import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { toggleTheme } from '../../store/slices/appSlice';
import { Button } from '../ui/Button';

export function Navbar({ onMenuClick }) {
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.app.theme);

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 glass border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="md:hidden font-semibold text-lg">Armor AI</div>
            </div>
            
            <div className="flex items-center gap-3 space-x-2">
                <Button variant="ghost" size="sm" className="w-9 h-9 p-0 rounded-full">
                    <Bell className="w-5 h-5" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-9 h-9 p-0 rounded-full"
                    onClick={() => dispatch(toggleTheme())}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                <div className="w-9 h-9 ml-2 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 border border-white/20 shadow-sm flex items-center justify-center text-white font-medium text-sm">
                    S
                </div>
            </div>
        </header>
    );
}
