import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';
import { User } from '../../types';
import { Logo } from '../common/Logo';
import { useUsageStats } from '../../hooks/useUsageStats';

interface AISidebarProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
    onOpenSettings: () => void;
    onGoHome: () => void;
    user: User | null;
    onLogout: () => void;
    unreadCount?: number;
    followRequestsCount?: number;
    friendsUnread?: number;
}

const formatRemainingTime = (resetTime: number): string => {
    const remaining = resetTime - Date.now();
    if (remaining <= 0) return 'Resetting...';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};

export const AISidebar: React.FC<AISidebarProps> = ({
    activeTab,
    onTabChange,
    onOpenSettings,
    onGoHome,
    user,
    onLogout,
    unreadCount = 0,
    followRequestsCount = 0,
    friendsUnread = 0
}) => {
    const { stats, loading } = useUsageStats();
    const navItems = [
        { id: 'home', icon: 'zap' as any, label: 'Home', action: onGoHome },
        { id: 'explore', icon: 'telescope' as any, label: 'Explore', action: () => onTabChange('groups') },
        { id: 'friends', icon: 'sparkles' as any, label: 'Friends', action: () => onTabChange('friends') },
        { id: 'inbox', icon: 'bell' as any, label: 'Notifications', action: () => onTabChange('inbox') },
    ];

    return (
        <div className="h-full flex flex-col relative w-full px-4 py-6">
            {/* Branding - Top Left (Icon Only) - Increased Size (+50%) */}
            <div className="px-4 mb-10 flex items-center justify-center md:justify-start">
                <div className="relative group cursor-pointer hover:scale-110 transition-transform duration-300">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Logo className="w-16 h-16 md:w-20 md:h-20 text-white relative z-10 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="space-y-3 flex-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const isNotifications = item.id === 'inbox';
                    const isFriends = item.id === 'friends';

                    return (
                        <button
                            key={item.id}
                            onClick={item.action}
                            className={`
                                w-full flex items-center gap-4 px-4 py-3.5 rounded-full transition-all duration-300 group relative
                                ${isActive
                                    ? 'bg-gradient-to-r from-[#5B79B7] to-[#243A6B] text-white shadow-lg shadow-blue-900/20'
                                    : 'text-[#7C89A6] hover:text-[#E6ECFF] hover:bg-[#FFFFFF05]'
                                }
                            `}
                        >
                            <div className="relative">
                                <Icon
                                    name={item.icon}
                                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#7C89A6] group-hover:text-white'}`}
                                />
                                {isNotifications && unreadCount > 0 && (
                                    <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex-center border-2 border-[#0B1220]">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                                {isFriends && friendsUnread > 0 && (
                                    <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex-center border-2 border-[#0B1220] animate-pulse">
                                        {friendsUnread > 9 ? '9+' : friendsUnread}
                                    </div>
                                )}
                            </div>
                            <span className="hidden md:block text-sm font-medium tracking-wide">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section: User & Config */}
            <div className="mt-auto flex flex-col gap-6 items-center md:items-stretch">
                {/* Minimalist Daily Resource Usage */}
                <div className="w-full px-2 mb-4 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#7C89A6] hidden md:block">Daily Quota</span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-primary/80">
                            <Icon name="clock" className="w-2.5 h-2.5" />
                            <span>{stats ? formatRemainingTime(stats.resetTime) : '--'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Files Sent */}
                        <div className="group cursor-help">
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <div className="flex items-center gap-2">
                                    <Icon name="file" className="w-3 h-3 text-[#7FA6FF]" />
                                    <span className="text-[10px] font-bold text-[#7C89A6] group-hover:text-white transition-colors hidden md:block">Files</span>
                                </div>
                                <span className="text-[10px] font-black text-white/40 group-hover:text-white/80 transition-colors">
                                    {stats ? `${stats.count}/${stats.limitCount}` : '0/20'}
                                </span>
                            </div>
                            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: stats ? `${Math.min((stats.count / stats.limitCount) * 100, 100)}%` : '0%' }}
                                    className={`h-full rounded-full ${
                                        stats && stats.count >= stats.limitCount ? 'bg-red-500' : 'bg-primary'
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Data Transfer */}
                        <div className="group cursor-help">
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <div className="flex items-center gap-2">
                                    <Icon name="database" className="w-3 h-3 text-[#7FA6FF]" />
                                    <span className="text-[10px] font-bold text-[#7C89A6] group-hover:text-white transition-colors hidden md:block">Data</span>
                                </div>
                                <span className="text-[10px] font-black text-white/40 group-hover:text-white/80 transition-colors">
                                    {stats ? `${(stats.size / (1024 * 1024)).toFixed(1)}/20MB` : '0/20MB'}
                                </span>
                            </div>
                            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: stats ? `${Math.min((stats.size / stats.limitSize) * 100, 100)}%` : '0%' }}
                                    className={`h-full rounded-full ${
                                        stats && stats.size >= stats.limitSize ? 'bg-red-500' : 'bg-blue-500'
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Profile Pill */}
                <div
                    onClick={onOpenSettings}
                    className="flex flex-col md:flex-row items-center gap-3 p-2 rounded-full md:rounded-2xl hover:bg-[#FFFFFF05] transition-colors cursor-pointer group border border-transparent hover:border-white/5"
                >
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
                        <span className="text-[10px] text-[#7C89A6] font-bold uppercase tracking-tighter">Verified Node</span>
                    </div>

                    <div className="hidden md:block ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="arrowRight" className="w-4 h-4 text-[#7C89A6]" />
                    </div>
                </div>

                {/* Logout Action (Mobile focused) */}
                <button
                    onClick={(e) => { e.stopPropagation(); onLogout(); }}
                    className="md:hidden w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                >
                    <Icon name="logout" className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
