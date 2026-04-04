import React from 'react';
import { cn } from '../../utils/helpers';

export function AudioVisualizer({ isRecording, className }) {
    // Render 5 bars that animate when recording
    return (
        <div className={cn("flex items-center justify-center space-x-1 h-12", className)}>
            {[...Array(5)].map((_, i) => (
                <div 
                    key={i}
                    className={cn(
                        "w-2 bg-blue-500 rounded-full transition-all duration-300",
                        isRecording ? "animate-soundwave" : "h-2"
                    )}
                    style={{
                        animationDelay: isRecording ? `${i * 0.15}s` : '0s',
                        height: isRecording ? '24px' : '8px'
                    }}
                />
            ))}
        </div>
    );
}
