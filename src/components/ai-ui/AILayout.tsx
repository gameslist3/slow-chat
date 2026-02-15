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
        <div className="h-screen w-full text-foreground flex overflow-hidden font-sans selection:bg-primary/30">

            {/* Sidebar (Navigation Rail) - Fixed 240px */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[240px] border-r border-white/10 bg-glass-surface backdrop-blur-xl transition-transform duration-500
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <AISidebar
                    activeTab={activeTab}
                    onTabChange={(tab) => { onTabChange(tab); setSidebarOpen(false); }}
                    onOpenSettings={() => { onOpenSettings(); setSidebarOpen(false); }}
                    onGoHome={() => { onGoHome(); setSidebarOpen(false); }}
                    user={user}
                    onLogout={onLogout}
                />
            </aside>

            {/* Main Canvas - Margin 260px, Padding 60px */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10 md:ml-[260px] p-0 md:p-[60px] h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-border shrink-0 bg-surface/50 backdrop-blur-md">
                    <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center border border-border">
                        <Icon name="menu" className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <Logo className="h-6 w-auto" />
                    <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <span className="text-[10px] font-black">{user?.username?.[0].toUpperCase()}</span>
                    </button>
                </header>

                <div className="flex-1 overflow-visible relative h-full">
                    {/* Removed internal scroll container to let individual screens handle scrolling if needed, or use main's overflow */}
                    <div className="w-full h-full">
                        {children}
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
