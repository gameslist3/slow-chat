import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { ThemeToggle } from './ThemeToggle';
import { Group, User, PersonalChat, FollowRequest, Notification } from '../../types';
import { useInbox } from '../../hooks/useChat';
import { getPendingRequests } from '../../services/firebaseFollowService';
import { AbstractBackground } from '../ui/AbstractBackground';
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
    const [showBottomNav, setShowBottomNav] = useState(true);
    const lastScrollY = React.useRef(0);

    useEffect(() => {
        if (showNotifications) {
            markAllAsRead();
        }
    }, [showNotifications]);

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
        <div className="relative h-screen w-full overflow-hidden text-foreground font-sans selection:bg-primary/20 flex flex-col">
            <AbstractBackground />

            <div className="relative flex-1 flex w-full h-full p-0 md:p-8 gap-0 md:gap-8 overflow-hidden">
                {/* HUD Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-[100] w-[320px] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] md:relative md:inset-auto md:flex md:w-80 md:rounded-[2.5rem] flex-col shrink-0 overflow-hidden glass-panel
                    ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0 md:opacity-100 md:visible pointer-events-none md:pointer-events-auto'}
                `}>
                    <AISidebar
                        groups={userGroups}
                        activeId={activeChatId}
                        isPersonalActive={isPersonal}
                        onSelectGroup={(id) => { onSelectGroup(id); setSidebarOpen(false); }}
                        onSelectPersonal={(id) => { onSelectPersonal(id); setSidebarOpen(false); }}
                        onBrowseGroups={() => { onBrowseGroups(); setSidebarOpen(false); }}
                        onFollowRequests={() => { onFollowRequests(); setSidebarOpen(false); }}
                        onCreateGroup={() => { onCreateGroup(); setSidebarOpen(false); }}
                        onOpenSettings={() => { onOpenSettings(); setSidebarOpen(false); }}
                        onGoHome={() => { onGoHome(); setSidebarOpen(false); }}
                        user={user}
                        onLogout={onLogout}
                        onClose={() => setSidebarOpen(false)}
                    />
                </aside>

                <motion.div
                    layout
                    className="flex-1 flex flex-col min-w-0 glass-panel rounded-none md:rounded-[2.5rem] relative h-full overflow-hidden z-0"
                >
                    <header className={`
                        flex items-center justify-between px-6 py-4 md:px-8 md:py-6 border-b border-border/5 bg-background/5 backdrop-blur-xl sticky top-0 z-40 h-[70px] md:h-[90px]
                        ${activeChatId ? 'hidden md:hidden' : 'flex md:hidden'}
                    `}>
                        <div className="flex items-center gap-4">
                            <button className="md:hidden active:scale-95 transition-transform" onClick={() => setSidebarOpen(true)}>
                                <Logo className="h-8 w-auto" />
                            </button>
                            <button onClick={onGoHome} className="hidden md:block active:scale-95 transition-transform">
                                <Logo className="h-10 w-auto" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Mobile Bell - Now opens sidebar to notifications */}
                            <button
                                onClick={() => {
                                    setSidebarOpen(true);
                                    // ideally we'd pass a prop to open directly to notifications, 
                                    // but for now opening sidebar is enough as the user can tap bell there.
                                    // Or we can add a prop to AISidebar to force-view notifications.
                                }}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-foreground/5 text-muted-foreground hover:bg-foreground/10 transition-all md:hidden"
                            >
                                <Icon name="bell" className="w-5 h-5" />
                            </button>
                            <ThemeToggle />
                        </div>
                    </header>

                    <main
                        className={`flex-1 overflow-hidden flex flex-col relative w-full h-full min-h-0 mobile-scroll-fix ${activeChatId ? 'pt-0' : 'md:p-0'}`}
                        onScroll={handleScroll}
                    >
                        {children}
                    </main>

                    {/* Desktop Bottom Nav Replacement (Floating HUD for Mobile Home) */}
                    <AnimatePresence>
                        {!activeChatId && (
                            <motion.div
                                className="md:hidden fixed bottom-10 left-6 right-6 h-16 glass-panel rounded-2xl flex items-center justify-around z-50 shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-white/10"
                                initial={{ y: 100 }}
                                animate={{ y: showBottomNav ? 0 : 100 }}
                                exit={{ y: 100 }}
                            >
                                <button onClick={() => setSidebarOpen(true)} className="w-12 h-12 flex items-center justify-center text-muted-foreground active:text-primary transition-colors"><Icon name="menu" /></button>
                                <button onClick={onBrowseGroups} className="w-12 h-12 flex items-center justify-center text-muted-foreground active:text-primary transition-colors"><Icon name="search" /></button>
                                <button onClick={onGoHome} className="w-12 h-12 flex items-center justify-center text-primary"><Icon name="zap" /></button>
                                <button onClick={onFollowRequests} className="w-12 h-12 flex items-center justify-center text-muted-foreground active:text-primary transition-colors"><Icon name="users" /></button>
                                <button onClick={onOpenSettings} className="w-12 h-12 flex items-center justify-center text-muted-foreground active:text-primary transition-colors"><Icon name="user" /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};
