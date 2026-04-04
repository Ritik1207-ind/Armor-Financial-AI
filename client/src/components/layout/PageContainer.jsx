import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function PageContainer({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            
            <Sidebar className={isSidebarOpen ? "translate-x-0 z-50 transition-transform" : "-translate-x-full md:translate-x-0"} />
            
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
