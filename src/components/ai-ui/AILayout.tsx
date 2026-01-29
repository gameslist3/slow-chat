import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { ThemeToggle } from './ThemeToggle';
import { Group, User, PersonalChat, FollowRequest } from '../../types';
import { useInbox } from '../../hooks/useChat';
import { getPendingRequests } from '../../services/firebaseFollowService';
import { NotificationCenter } from '../chat/NotificationCenter';
import { AbstractBackground } from '../ui/AbstractBackground';
import { FriendsList } from '../social/FriendsList';
import { AISidebar } from './AISidebar';

interface AILayoutProps {
    children: React.ReactNode;
    userGroups: Group[];
    activeChatId: string | null;
    isPersonal: boolean;
    onSelectGroup: (id: string) => void;
    onSelectPersonal: (chatId: string) => void;
    onBrowseGroups: () => void;
    onFollowRequests: () => void;
    onSelectNotification: (chatId: string, isPersonal: boolean, messageId?: string) => void;
    onCreateGroup: () => void;
    onOpenSettings: () => void;
    onGoHome: () => void;
    user: User | null;
    onLogout: () => void;
    mobileTitle?: string;
}

export const AILayout: React.FC<AILayoutProps> = ({
    children,
    userGroups,
    activeChatId,
    isPersonal,
    onSelectGroup,
    onSelectPersonal,
    onBrowseGroups,
    onFollowRequests,
    onSelectNotification,
    onCreateGroup,
    onOpenSettings,
    onGoHome,
    user,
    onLogout,
    mobileTitle = "SlowChat"
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <div className="relative flex h-screen w-full overflow-hidden text-foreground font-sans selection:bg-primary/20">
            {/* --- Atmospheric Background --- */}
            <AbstractBackground />

            {/* --- Notifications HUD (Floating) --- */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed top-6 right-6 z-[100] w-full max-w-sm h-[calc(100vh-3rem)]"
                    >
                        <NotificationCenter
                            onClose={() => setShowNotifications(false)}
                            onSelectChat={onSelectNotification}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Mobile Sidebar Overlay --- */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* --- Navigation Loop (HUD Container) --- */}
            <div className="relative z-10 flex w-full h-full p-6 md:p-8 gap-6 md:gap-8">

                {/* Desktop HUD Sidebar (Slim & Minimal) */}
                <aside className={`
                    fixed inset-y-6 left-6 z-50 w-80 glass-panel rounded-[2.5rem] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] md:relative md:inset-0 md:flex md:w-80 flex-col shrink-0 overflow-hidden
                    ${sidebarOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[-120%] opacity-0 scale-95 md:translate-x-0 md:opacity-100 md:scale-100'}
                `}>
                    <AISidebar
                        groups={userGroups}
                        activeId={activeChatId}
                        isPersonalActive={isPersonal}
                        onSelectGroup={(id) => { onSelectGroup(id); setSidebarOpen(false); }}
                        onSelectPersonal={(id) => { onSelectPersonal(id); setSidebarOpen(false); }}
                        onBrowseGroups={() => { onBrowseGroups(); setSidebarOpen(false); }}
                        onFollowRequests={() => { onFollowRequests(); setSidebarOpen(false); }}
                        onOpenNotifications={() => { setShowNotifications(true); setSidebarOpen(false); }}
                        onCreateGroup={() => { onCreateGroup(); setSidebarOpen(false); }}
                        onOpenSettings={() => { onOpenSettings(); setSidebarOpen(false); }}
                        onGoHome={() => { onGoHome(); setSidebarOpen(false); }}
                        user={user}
                        onLogout={onLogout}
                        onClose={() => setSidebarOpen(false)}
                    />
                </aside>

                {/* Main Content Workspace (Floating Glass Island) */}
                <motion.div
                    layout
                    className="flex-1 flex flex-col min-w-0 glass-panel rounded-[2.5rem] relative overflow-hidden h-full"
                >
                    {/* Integrated System Header */}
                    <header className="flex items-center justify-between px-8 py-5 border-b border-border/5 bg-background/5 backdrop-blur-xl sticky top-0 z-40 h-[80px]">
                        <div className="flex items-center gap-6">
                            <button
                                className="md:hidden w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-90"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Icon name="menu" className="w-6 h-6" />
                            </button>
                            <button
                                onClick={onGoHome}
                                className="flex items-center gap-4 hover:opacity-70 transition-opacity active:scale-95"
                            >
                                <div className="flex flex-col">
                                    <span className="font-protocol text-[10px] uppercase tracking-[0.4em] text-primary">Protocol_Live</span>
                                    <h1 className="font-bold text-lg tracking-tighter truncate max-w-[240px] leading-none mt-1">{mobileTitle}</h1>
                                </div>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* HUD Notification Toggle */}
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`
                                    relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95
                                    ${showNotifications ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'}
                                `}
                                title="System Flux"
                            >
                                <Icon name="message" className="w-5 h-5" />
                                {(user?.unreadCount || 0) > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-secondary text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background"
                                    >
                                        {user?.unreadCount}
                                    </motion.span>
                                )}
                            </button>
                            <ThemeToggle />
                        </div>
                    </header>

                    <main className="flex-1 overflow-hidden flex flex-col relative w-full h-full">
                        {children}
                    </main>
                </motion.div>
            </div>
        </div>
    );
};
