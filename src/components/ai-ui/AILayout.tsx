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
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

export const AILayout: React.FC<AILayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    onOpenSettings,
    onGoHome,
    user,
    onLogout,
    theme,
    onToggleTheme
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden font-sans text-foreground">

            {/* Desktop Sidebar (Flex Item) - Optimized Transparency */}
            <aside className="hidden md:flex w-72 flex-col flex-shrink-0 z-50 border-r border-[#FFFFFF08] bg-black/10 backdrop-blur-2xl">
                <AISidebar
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    onOpenSettings={onOpenSettings}
                    onGoHome={onGoHome}
                    user={user}
                    onLogout={onLogout}
                    onToggleTheme={onToggleTheme}
                />
            </aside>

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10 h-full overflow-hidden bg-transparent">
                {/* Mobile Header - Optimized Transparency */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-[#FFFFFF08] bg-black/20 backdrop-blur-xl shrink-0">
                    <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Icon name="menu" className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Logo className="h-6 w-6" />
                        <span className="font-bold text-lg tracking-tight">Gapes</span>
                    </div>
                    <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <span className="text-xs font-bold">{user?.username?.[0].toUpperCase()}</span>
                    </button>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative flex flex-col">
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
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0F1C34]/90 backdrop-blur-xl border-r border-white/10 md:hidden"
                        >
                            <AISidebar
                                activeTab={activeTab}
                                onTabChange={(tab) => { onTabChange(tab); setSidebarOpen(false); }}
                                onOpenSettings={() => { onOpenSettings(); setSidebarOpen(false); }}
                                onGoHome={() => { onGoHome(); setSidebarOpen(false); }}
                                user={user}
                                onLogout={onLogout}
                                onToggleTheme={onToggleTheme}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
