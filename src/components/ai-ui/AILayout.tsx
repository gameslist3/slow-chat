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
import { Logo } from '../common/Logo';

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
    const [showBottomNav, setShowBottomNav] = useState(true);
    const lastScrollY = React.useRef(0);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setShowBottomNav(false);
        } else {
            setShowBottomNav(true);
        }
        lastScrollY.current = currentScrollY;
    };

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
                        className="fixed inset-0 z-[100] md:inset-auto md:top-6 md:right-6 md:w-full md:max-w-sm md:h-[calc(100vh-3rem)]"
                    >
                        <NotificationCenter
                            onClose={() => setShowNotifications(false)}
                            onSelectChat={onSelectNotification}
                        />
                        {/* Mobile close overlay */}
                        <div className="absolute inset-0 -z-10 md:hidden" onClick={() => setShowNotifications(false)} />
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
                        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* --- Navigation Loop (HUD Container) --- */}
            <div className="relative flex w-full h-full p-0 md:p-8 gap-0 md:gap-8">

                {/* Desktop HUD Sidebar (Slim & Minimal) */}
                <aside className={`
                    fixed inset-y-0 left-0 z-[100] w-[300px] glass-panel transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] md:relative md:inset-auto md:flex md:w-80 md:rounded-[2.5rem] flex-col shrink-0 overflow-hidden
                    ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0 md:opacity-100 invisible md:visible pointer-events-none md:pointer-events-auto'}
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

                {/* Main Content Workspace */}
                <motion.div
                    layout
                    className="flex-1 flex flex-col min-w-0 glass-panel rounded-none md:rounded-[2.5rem] relative overflow-hidden h-full z-0 p-0 md:p-0"
                >
                    {/* Header: Conditionally hidden on mobile when chat is active */}
                    <header className={`
                        flex items-center justify-between px-4 py-3 md:px-8 md:py-5 border-b border-border/5 bg-background/5 backdrop-blur-xl sticky top-0 z-40 h-[60px] md:h-[80px]
                        ${activeChatId ? 'hidden md:flex' : 'flex'} 
                    `}>
                        <div className="flex items-center gap-4 md:gap-6">
                            {/* Standard Logo/Title on Mobile Home */}
                            <button
                                className="md:hidden flex items-center gap-3 active:scale-95 transition-transform"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Logo className="h-8 w-auto" />
                            </button>

                            {/* Desktop: Standard Logo/Title */}
                            <button
                                onClick={onGoHome}
                                className="hidden md:flex items-center gap-4 hover:opacity-70 transition-opacity active:scale-95"
                            >
                                <Logo className="h-10 w-auto" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            {/* HUD Notification Toggle */}
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`
                                    relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all active:scale-95
                                    ${showNotifications ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'}
                                `}
                                title="Notifications"
                            >
                                <Icon name="bell" className="w-5 h-5" />
                                {(user?.unreadCount || 0) > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-secondary text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background"
                                    >
                                        {user?.unreadCount}
                                    </motion.span>
                                )}
                            </button>
                            <ThemeToggle />
                        </div>
                    </header>

                    <main
                        className={`flex-1 overflow-y-auto flex flex-col relative w-full h-full mobile-scroll-fix ${activeChatId ? 'pt-[10%] md:pt-0' : ''}`}
                        onScroll={handleScroll}
                    >
                        {children}
                    </main>

                    {/* Mobile Bottom Nav */}
                    <motion.div
                        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-50 pb-safe"
                        initial={{ y: 0 }}
                        animate={{ y: showBottomNav ? 0 : '100%' }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeChatId ? (
                            // Chat Bottom Bar with Back Button
                            <button
                                onClick={onGoHome}
                                className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all p-2 w-full"
                            >
                                <Icon name="arrowLeft" className="w-5 h-5" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Back</span>
                            </button>
                        ) : (
                            // Home Bottom Bar
                            <>
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all p-2"
                                >
                                    <Icon name="menu" className="w-5 h-5" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Menu</span>
                                </button>
                                <button
                                    onClick={onBrowseGroups}
                                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all p-2"
                                >
                                    <Icon name="search" className="w-5 h-5" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Search</span>
                                </button>
                                <button
                                    onClick={() => setShowNotifications(true)}
                                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all p-2 relative"
                                >
                                    <Icon name="bell" className="w-5 h-5" />
                                    {(user?.unreadCount || 0) > 0 && (
                                        <div className="absolute top-1 right-3 w-2 h-2 bg-secondary rounded-full border border-background" />
                                    )}
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Activity</span>
                                </button>
                                <button
                                    onClick={onOpenSettings}
                                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all p-2"
                                >
                                    <Icon name="user" className="w-5 h-5" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
                                </button>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
