import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../store/slices/appSlice';
import { logout } from '../../store/slices/authSlice';
import { Button } from '../ui/Button';
import { Menu, Moon, Sun, Bell, LogOut } from 'lucide-react';

export function Navbar({ onMenuClick }) {
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.app.theme);
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        window.location.href = '/login';
    };

    if (!isAuthenticated) return null; // Or show a minimal navbar

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
                    className="w-9 h-9 p-0 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleLogout}
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>
        </header>
    );
}
