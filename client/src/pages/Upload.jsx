import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AudioVisualizer } from '../components/ui/AudioVisualizer';
import { analyzeConversation } from '../services/api';
import { Mic, Square, Loader2, CheckCircle, UploadCloud } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addConversation } from '../store/slices/conversationSlice';

export default function Upload() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [textInput, setTextInput] = useState("");
    
    // MEDIA RECORDER STATE
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const fileInputRef = useRef(null);
    
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
                processInteraction({ audio_file: file, user_id: 'test_user_123', input_type: 'audio' });
            };

            mediaRecorder.start();
            setIsRecording(true);
            setResult(null);
        } catch (err) {
            console.error("Microphone access denied", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const handleRecordToggle = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        processInteraction({ text: textInput, user_id: 'test_user_123', input_type: 'text' });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        processInteraction({ audio_file: file, user_id: 'test_user_123', input_type: 'audio' });
    };

    const processInteraction = async (payload) => {
        setIsProcessing(true);
        try {
            const data = await analyzeConversation(payload);
            setResult(data);
            dispatch(addConversation(data));
        } catch (error) {
            console.error("Failed to process", error);
            alert("Error: " + (error.response?.data?.message || "AI Analysis Failed. Check if Server and AI-Service are running."));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Capture Intelligence</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Record a real-time financial conversation or upload audio.</p>
            </div>

            <Card className="overflow-hidden border-2 border-transparent transition-all duration-300 hover:border-blue-500/20">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-8">
                    
                    <div className="h-24 flex items-center justify-center">
                        {isRecording ? (
                            <AudioVisualizer isRecording={true} className="text-blue-500" />
                        ) : (
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <Mic className="w-10 h-10 text-blue-500" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                            {isRecording ? "Listening to conversation..." : "Start Recording"}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            {isRecording 
                                ? "Speak naturally. We automatically detect languages and extract financial entities." 
                                : "Click the button below to start capturing a real-time conversation via your microphone."}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                            size="lg" 
                            variant={isRecording ? "danger" : "primary"}
                            className="rounded-full shadow-lg shadow-blue-500/20 px-8"
                            onClick={handleRecordToggle}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                            ) : isRecording ? (
                                <><Square className="mr-2 h-5 w-5 fill-current" /> Stop & Finalize</>
                            ) : (
                                <><Mic className="mr-2 h-5 w-5" /> Start Recording</>
                            )}
                        </Button>
                        
                        {!isRecording && (
                            <>
                                <input 
                                    type="file" 
                                    accept="audio/*" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    disabled={isProcessing}
                                />
                                <Button 
                                    size="lg" 
                                    variant="outline"
                                    className="rounded-full px-8"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                >
                                    <UploadCloud className="mr-2 h-5 w-5" /> Upload Audio
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="relative flex items-center py-5">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR Enter text manually</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleTextSubmit} className="flex gap-4">
                        <input 
                            type="text" 
                            className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. Can you manage my car loan EMI?"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            disabled={isRecording || isProcessing}
                        />
                        <Button type="submit" disabled={isRecording || isProcessing || !textInput.trim()}>
                            Analyze Text
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Results Preview */}
            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-6 flex flex-col items-center text-center space-y-4">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                    <div>
                        <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Analysis Complete!</h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1 max-w-md mx-auto">
                            "{result.summary || "Conversation processed successfully."}"
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/history')} className="mt-2 bg-white dark:bg-[#020617] border-emerald-200 dark:border-emerald-800">
                        View Full Details
                    </Button>
                </div>
            )}
        </div>
    );
}
