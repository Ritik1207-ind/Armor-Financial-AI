import React from 'react';
import { cn } from '../../utils/helpers';

export function Card({ className, children, ...props }) {
    return (
        <div className={cn("glass rounded-xl p-6 shadow-sm", className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return (
        <div className={cn("mb-4", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }) {
    return (
        <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }) {
    return (
        <div className={cn("", className)} {...props}>
            {children}
        </div>
    );
}
