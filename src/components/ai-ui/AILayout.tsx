import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { ThemeToggle } from './ThemeToggle';
import { User, Group } from '../../types';
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
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen w-full bg-[#050505] text-white flex overflow-hidden font-sans selection:bg-primary/30">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
            </div>

            {/* Sidebar (Command Center) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 lg:w-80 b-r border-white/5 bg-[#080808]/80 backdrop-blur-3xl transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                md:relative md:inset-auto md:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
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

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-6 border-b border-white/5 shrink-0 bg-[#050505]/50 backdrop-blur-md">
                    <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Icon name="menu" className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <Logo className="h-6 w-auto" />
                    <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <span className="text-[10px] font-black">{user?.username?.[0].toUpperCase()}</span>
                    </button>
                </header>

                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar scroll-smooth p-6 md:p-12">
                        <div className="max-w-7xl mx-auto w-full">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
