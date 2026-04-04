import React from 'react';
import { cn } from '../../utils/helpers';

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
    
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        outline: "border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100",
        ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100",
        danger: "bg-red-500 text-white hover:bg-red-600"
    };

    const sizes = {
        sm: "h-9 px-3 text-sm",
        md: "h-10 py-2 px-4",
        lg: "h-11 px-8 text-lg"
    };

    return (
        <button 
            className={cn(baseStyles, variants[variant], sizes[size], className)} 
            {...props} 
        />
    );
}
