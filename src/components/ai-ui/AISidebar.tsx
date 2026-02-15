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
        { id: 'explore', icon: 'telescope' as any, label: 'Explore', action: () => onTabChange('groups') }, // Using groups tab for explore
        { id: 'friends', icon: 'sparkles' as any, label: 'Friends', action: () => onTabChange('friends') },
        { id: 'inbox', icon: 'bell' as any, label: 'Notifications', action: () => onTabChange('inbox') },
    ];

    return (
        <div className="h-full flex flex-col bg-transparent border-r border-border relative z-30">
            {/* Branding */}
            <div className="p-6 flex items-center justify-center lg:justify-start shrink-0">
                <button onClick={onGoHome} className="flex items-center gap-3 active:scale-95 transition-transform group">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Logo className="h-6 w-auto text-white" />
                    </div>
                    <span className="hidden lg:block font-black text-xl tracking-tighter uppercase italic leading-none">SlowChat</span>
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="px-3 space-y-2 mt-4 flex-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.action}
                        title={item.label}
                        className={`w-full h-12 lg:h-14 rounded-2xl flex items-center justify-center lg:justify-start lg:px-6 transition-all relative group
                            ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-surface2 hover:text-foreground'}
                        `}
                    >
                        <Icon name={item.icon} className={`w-5 h-5 ${activeTab === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                        <span className={`hidden lg:block ml-4 text-sm font-bold tracking-tight ${activeTab === item.id ? 'text-primary' : ''}`}>{item.label}</span>

                        {activeTab === item.id && (
                            <motion.div
                                layoutId="nav-active"
                                className="absolute left-0 w-1.5 h-6 bg-primary rounded-r-full"
                            />
                        )}
                    </button>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-border shrink-0 space-y-2">
                <div className="px-4 py-2">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-surface2/50 border border-border">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-yellow-400 text-black' : 'bg-transparent text-muted-foreground'}`}>
                                <Icon name="sun" className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider hidden lg:block">Theme</span>
                        </div>
                        <button
                            onClick={onToggleTheme}
                            className={`w-12 h-7 rounded-full p-1 transition-colors relative ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                            <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={`w-5 h-5 rounded-full shadow-sm ${theme === 'dark' ? 'bg-white translate-x-5' : 'bg-white translate-x-0'}`}
                            />
                        </button>
                    </div>
                </div>

                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center justify-center lg:justify-start gap-4 p-2 rounded-2xl hover:bg-surface2 transition-all group"
                    title="Profile Settings"
                >
                    <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary text-xs border border-primary/20">
                            {user?.username?.[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface" />
                    </div>
                    <div className="hidden lg:block flex-1 text-left min-w-0">
                        <p className="text-sm font-black truncate">{user?.username}</p>
                        <p className="text-[10px] uppercase opacity-40 font-bold">Active</p>
                    </div>
                </button>
            </div>
        </div>
    );
};
