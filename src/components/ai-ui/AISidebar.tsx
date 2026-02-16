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
            {/* Branding - Icon Only, Increased Size */}
            <div className="px-4 py-8 flex items-center justify-center">
                <div className="relative group cursor-pointer hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <Logo className="w-12 h-12 relative z-10 text-white drop-shadow-[0_0_15px_rgba(127,166,255,0.5)]" />
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-4 mt-8 flex-1 flex flex-col items-center">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={item.action}
                            title={item.label}
                            className={`w-12 h-12 md:w-full md:h-14 rounded-2xl md:rounded-xl flex items-center justify-center md:justify-start md:px-5 transition-all duration-300 relative group overflow-hidden
                                ${isActive
                                    ? 'bg-[#5B79B7] shadow-[0_0_20px_rgba(127,166,255,0.4)] text-[#E6ECFF]'
                                    : 'text-[#A9B4D0] hover:text-[#E6ECFF] hover:bg-white/5'
                                }
                            `}
                        >
                            <Icon
                                name={item.icon}
                                className={`w-6 h-6 md:mr-4 relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`}
                            />
                            <span className={`hidden md:block text-sm font-bold tracking-wide relative z-10 ${isActive ? 'text-white' : ''} transition-opacity`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section: User Status & Theme */}
            <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-6">
                {/* User Status */}
                <div className="flex items-center gap-3 px-2">
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#182B52] to-[#243A6B] flex items-center justify-center text-white font-bold text-sm border border-white/10 shadow-lg">
                            {user?.username?.[0].toUpperCase() || 'H'}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#7ED957] rounded-full border-2 border-[#0B1220] shadow-[0_0_8px_#7ED957]" />
                    </div>
                    <div className="hidden md:block overflow-hidden">
                        <div className="text-sm font-bold text-[#A9B4D0] truncate">
                            {user?.username || 'Happy'}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#7ED957]">Online</div>
                    </div>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={onToggleTheme}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#A9B4D0] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-lg mx-auto md:mx-0"
                >
                    <Icon name={theme === 'dark' ? 'moon' : 'sun'} className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
