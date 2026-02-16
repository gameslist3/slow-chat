import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';
import { User } from '../../types';
import { Logo } from '../common/Logo';

interface AISidebarProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
    onOpenSettings: () => void;
    onGoHome: () => void;
    user: User | null;
    onLogout: () => void;
    theme?: 'light' | 'dark';
    onToggleTheme?: () => void;
}

export const AISidebar: React.FC<AISidebarProps> = ({
    activeTab,
    onTabChange,
    onOpenSettings,
    onGoHome,
    user,
    theme = 'dark',
    onToggleTheme
}) => {
    const navItems = [
        { id: 'home', icon: 'zap' as any, label: 'Home', action: onGoHome },
        { id: 'explore', icon: 'telescope' as any, label: 'Explore', action: () => onTabChange('groups') },
        { id: 'friends', icon: 'sparkles' as any, label: 'Friends', action: () => onTabChange('friends') },
        { id: 'inbox', icon: 'bell' as any, label: 'Notifications', action: () => onTabChange('inbox') },
    ];

    return (
        <div className="h-full flex flex-col relative w-full p-4">
            {/* Branding */}
            <div className="px-4 py-8 flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                    <Logo className="w-8 h-8 relative z-10" />
                </div>
                <span className="font-heading font-black text-2xl tracking-tighter text-white">Gapes</span>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-2 mt-4 flex-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={item.action}
                            className={`w-full h-12 rounded-full flex items-center px-5 transition-all duration-300 relative group overflow-hidden
                                ${isActive ? 'nav-item-active' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-glow"
                                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50"
                                />
                            )}
                            <Icon
                                name={item.icon}
                                className={`w-5 h-5 mr-3 relative z-10 transition-colors ${isActive ? 'text-blue-300' : 'text-slate-500 group-hover:text-blue-200'}`}
                            />
                            <span className="text-sm font-semibold tracking-wide relative z-10">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section: User Status & Theme */}
            <div className="mt-auto pt-6 border-t border-white/5">
                <div className="flex flex-col gap-4">
                    {/* User Profile */}
                    <button
                        onClick={onOpenSettings}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group w-full"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
                                {user?.username?.[0].toUpperCase() || 'H'}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0F1C34]" />
                        </div>

                        <div className="flex-1 text-left">
                            <div className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">
                                {user?.username || 'Happy'}
                            </div>
                            <div className="text-xs text-slate-500">Online</div>
                        </div>
                    </button>

                    {/* Theme Toggle & Options */}
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Appearance</span>
                        <button
                            onClick={onToggleTheme}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <Icon name="moon" className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
