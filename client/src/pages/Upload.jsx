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
    const [activeStream, setActiveStream] = useState(null);
    
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setActiveStream(stream);
            
            // Check for supported mime types
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus' 
                : 'audio/webm';
                
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const extension = mimeType.includes('webm') ? 'webm' : 'ogg';
                const file = new File([audioBlob], `recording.${extension}`, { type: mimeType });
                processInteraction({ audio_file: file, user_id: 'test_user_123', input_type: 'audio' });
                setActiveStream(null);
            };

            mediaRecorder.start(1000); // Request data every second
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
                            <AudioVisualizer isRecording={true} stream={activeStream} className="text-blue-500" />
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

            {/* Results Preview Detailed View */}
            {result && (
                <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Analysis Acquired</h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 max-w-lg mx-auto">
                            The AI Engine has successfully dissected your conversation into actionable insights below.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Summary Block */}
                        <Card className="col-span-1 md:col-span-2 border-2 border-blue-500/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-blue-600 dark:text-blue-400">Intelligence Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                    {result.summary || "No summary was generated."}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Entities Data Block */}
                        <Card className="col-span-1 md:col-span-2 border border-indigo-200 dark:border-indigo-900/50">
                            <CardHeader className="pb-2 bg-indigo-50/50 dark:bg-indigo-900/10">
                                <CardTitle className="text-lg text-indigo-600 dark:text-indigo-400">Extracted Datapoints</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(result.entities || {}).map(([key, val]) => {
                                    // Handle string arrays
                                    if (Array.isArray(val)) {
                                        return (
                                            <div key={key} className="flex flex-col justify-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <span className="text-sm font-semibold capitalize text-slate-500 mb-1">{key.replace('_', ' ')}</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {val.length > 0 ? val.map((v, i) => <span key={i} className="font-medium text-xs text-indigo-700 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300 px-2 py-0.5 rounded-full">{v}</span>) : <span className="text-slate-400 text-xs">None identified</span>}
                                                </div>
                                            </div>
                                        )
                                    }
                                    const isRate = key.toLowerCase().includes('rate_of_interest') || key.toLowerCase().includes('rate');
                                    const isTime = key.toLowerCase().includes('tenure') || key.toLowerCase().includes('year') || key.toLowerCase().includes('month');
                                    return (
                                        <div key={key} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <span className="text-sm font-semibold capitalize text-slate-500">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">
                                                {typeof val === 'number' && val > 0 
                                                    ? (isRate ? `${val}%` : isTime ? `${val}` : `₹${val.toLocaleString()}`) 
                                                    : (val || 'None')}
                                            </span>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>

                        {/* Psychology & Behavior Block */}
                        <Card className="col-span-1 border border-purple-200 dark:border-purple-900/50">
                            <CardHeader className="pb-2 bg-purple-50/50 dark:bg-purple-900/10">
                                <CardTitle className="text-lg text-purple-600 dark:text-purple-400">Psychology & Profile</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-semibold text-slate-500">Conversation Type</span>
                                    <span className={`font-bold capitalize px-2 py-0.5 rounded-full text-xs ${result.is_financial ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                                        {result.is_financial ? 'Financial' : 'Non-Financial'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-semibold text-slate-500">Detected Emotion</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{result.user_emotion || 'Neutral'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-semibold text-slate-500">Confidence Level</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{result.user_confidence || 'Medium'}</span>
                                </div>
                                {result.good_decisions && result.good_decisions.length > 0 && (
                                    <div className="pt-2">
                                        <span className="text-sm font-semibold text-slate-500 mb-2 block">Strong User Decisions Identified:</span>
                                        <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
                                            {result.good_decisions.map((dec, i) => <li key={i} className="leading-snug">{dec}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Consultation Advice Block */}
                        <Card className="col-span-1 border border-emerald-200 dark:border-emerald-900/50">
                            <CardHeader className="pb-2 bg-emerald-50/50 dark:bg-emerald-900/10">
                                <CardTitle className="text-lg text-emerald-600 dark:text-emerald-400">Financial Consultation</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {result.financial_advice && result.financial_advice.length > 0 ? (
                                    <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                                        {result.financial_advice.map((advice, i) => (
                                            <li key={i} className="flex gap-2 items-start">
                                                <div className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mt-0.5 font-bold text-xs">
                                                    {i + 1}
                                                </div>
                                                <span className="leading-tight">{advice}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500">No specific advice available for this context.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Original Transcript */}
                        <Card className="col-span-1 md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-slate-500 font-medium">Original Transcription</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-slate-50 dark:bg-[#020617]/50 p-4 rounded-lg font-mono text-sm text-slate-600 dark:text-slate-400 italic border border-slate-200 dark:border-slate-800">
                                    "{result.transcription}"
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-center mt-4">
                        <Button variant="outline" onClick={() => navigate('/history')} className="min-w-[200px]">
                            Go to Complete History
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
