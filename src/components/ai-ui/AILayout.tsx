import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { User } from '../../types';
import { AISidebar } from './AISidebar';
import { Logo } from '../common/Logo';

interface AILayoutProps {
    children: React.ReactNode;
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

export const AILayout: React.FC<AILayoutProps> = ({
    children,
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden font-sans text-foreground">

            {/* Desktop Sidebar (Flex Item) - Optimized Transparency */}
            {/* Desktop Sidebar (Flex Item) - Optimized Transparency */}
            <aside className="hidden md:flex w-72 flex-col flex-shrink-0 z-50 border-r border-white/5 bg-[#0B1221]/60 backdrop-blur-3xl">
                <AISidebar
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    onOpenSettings={onOpenSettings}
                    onGoHome={onGoHome}
                    user={user}
                    onLogout={onLogout}
                    unreadCount={unreadCount}
                    followRequestsCount={followRequestsCount}
                    friendsUnread={friendsUnread}
                />
            </aside>

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10 h-full overflow-hidden bg-transparent">
                {/* Mobile Header - Optimized Transparency */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0B1221]/80 backdrop-blur-xl shrink-0">
                    <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center relative">
                        <Icon name="menu" className="w-5 h-5 text-muted-foreground" />
                        {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0B1221] shadow-lg">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </button>
                    <div className="flex items-center gap-2">
                        <Logo className="h-14 w-14 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    </div>
                    <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="text-xs font-bold">{user?.username?.[0].toUpperCase()}</span>
                    </button>
                </header>

                {/* Content Scroll Area */}
                <div className={`flex-1 overflow-x-hidden custom-scrollbar relative flex flex-col ${activeTab === 'chat' ? 'overflow-y-hidden' : 'overflow-y-auto'}`}>
                    {children}
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-[88px] bg-[#0F1C34]/90 backdrop-blur-xl border-r border-white/10 md:hidden flex flex-col items-center"
                        >
                            <AISidebar
                                activeTab={activeTab}
                                onTabChange={(tab) => { onTabChange(tab); setSidebarOpen(false); }}
                                onOpenSettings={() => { onOpenSettings(); setSidebarOpen(false); }}
                                onGoHome={() => { onGoHome(); setSidebarOpen(false); }}
                                user={user}
                                onLogout={onLogout}
                                unreadCount={unreadCount}
                                followRequestsCount={followRequestsCount}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
