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
    onLogout,
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
        <div className="h-full flex flex-col relative w-full px-4 py-6">
            {/* Branding - Top Left */}
            <div className="px-4 mb-10 flex items-center gap-3">
                <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Logo className="w-8 h-8 md:w-10 md:h-10 text-white relative z-10" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white hidden md:block">
                    Gapes
                </span>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-3 flex-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={item.action}
                            className={`
                                w-full flex items-center gap-4 px-4 py-3.5 rounded-full transition-all duration-300 group
                                ${isActive
                                    ? 'bg-gradient-to-r from-[#5B79B7] to-[#243A6B] text-white shadow-lg shadow-blue-900/20'
                                    : 'text-[#7C89A6] hover:text-[#E6ECFF] hover:bg-[#FFFFFF05]'
                                }
                            `}
                        >
                            <Icon
                                name={item.icon}
                                className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#7C89A6] group-hover:text-white'}`}
                            />
                            <span className="hidden md:block text-sm font-medium tracking-wide">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section: User & Config */}
            <div className="mt-auto flex flex-col gap-4">
                {/* User Profile Pill */}
                <div className="flex items-center gap-3 p-2 rounded-full hover:bg-[#FFFFFF05] transition-colors cursor-pointer group">
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#182B52] to-[#0F1C34] flex items-center justify-center text-white font-bold border border-[#FFFFFF10] shadow-lg group-hover:border-[#5B79B7] transition-colors">
                            {user?.username?.[0].toUpperCase() || <Icon name="user" className="w-4 h-4" />}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#7ED957] rounded-full border-2 border-[#0B1220]" />
                    </div>

                    <div className="hidden md:flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-[#E6ECFF] truncate">
                            {user?.username || 'Guest'}
                        </span>
                    </div>

                    {/* Theme Toggle Mini */}
                    <button
                        onClick={onToggleTheme}
                        className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-[#7C89A6] hover:text-white hover:bg-white/10"
                    >
                        <Icon name={theme === 'dark' ? 'moon' : 'sun'} className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
