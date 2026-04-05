import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/helpers';

export function AudioVisualizer({ isRecording, stream, className }) {
    const [volumes, setVolumes] = useState([0, 0, 0, 0, 0]);
    const animationRef = useRef();
    const analyserRef = useRef();

    useEffect(() => {
        if (isRecording && stream) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const update = () => {
                analyser.getByteFrequencyData(dataArray);
                // Get 5 samples from the frequency data
                const newVolumes = [
                    dataArray[2] || 0,
                    dataArray[5] || 0,
                    dataArray[8] || 0,
                    dataArray[11] || 0,
                    dataArray[14] || 0
                ].map(v => Math.max(8, v / 4)); // Scale for height
                
                setVolumes(newVolumes);
                animationRef.current = requestAnimationFrame(update);
            };
            
            update();

            return () => {
                cancelAnimationFrame(animationRef.current);
                audioContext.close();
            };
        } else {
            setVolumes([8, 8, 8, 8, 8]);
        }
    }, [isRecording, stream]);

    return (
        <div className={cn("flex items-center justify-center space-x-1.5 h-16", className)}>
            {volumes.map((vol, i) => (
                <div 
                    key={i}
                    className="w-2.5 bg-blue-500 rounded-full transition-all duration-75"
                    style={{
                        height: `${vol}px`,
                        opacity: isRecording ? 1 : 0.3
                    }}
                />
            ))}
        </div>
    );
}
