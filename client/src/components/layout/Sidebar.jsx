import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Mic, Clock, User } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useSelector } from 'react-redux';

export function Sidebar({ className }) {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    
    if (!isAuthenticated) return null;
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Mic, label: 'Upload Conversation', path: '/upload' },
        { icon: Clock, label: 'History', path: '/history' },
    ];

    return (
        <aside className={cn("hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617] h-screen fixed left-0 top-0", className)}>
            <div className="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
                <Shield className="w-8 h-8 text-blue-600" />
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Armor AI</span>
            </div>
            
            {user && (
                <div className="p-6 pt-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {user.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                                User Profile
                            </span>
                        </div>
                    </div>
                </div>
            )}
            
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive 
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
