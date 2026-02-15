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
        <div className="h-full flex flex-col bg-transparent relative z-30 w-64">
            {/* Branding */}
            <div className="p-6 flex items-center gap-3 shrink-0">
                <Logo className="w-8 h-8" />
                <span className="font-heading font-bold text-2xl tracking-tighter text-white">Gapes</span>
            </div>

            {/* Main Navigation */}
            <nav className="px-4 space-y-2 mt-4 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.action}
                        className={`w-full h-12 rounded-xl flex items-center px-4 transition-all group
                            ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Icon name={item.icon} className={`w-5 h-5 mr-3 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                        <span className="text-sm font-bold tracking-wide">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Bottom Profile Section */}
            <div className="p-4 mt-auto">
                <div className="flex items-center justify-between px-2 py-2">
                    <button onClick={onOpenSettings} className="flex items-center gap-3 group">
                        <div className="relative">
                            <Icon name="rocket" className="w-5 h-5 text-emerald-400" />
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-500 rounded-full border border-[#050608]" />
                        </div>
                        <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                            {user?.username || 'Happy'}
                        </span>
                    </button>

                    <button
                        onClick={onToggleTheme}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <Icon name="moon" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
