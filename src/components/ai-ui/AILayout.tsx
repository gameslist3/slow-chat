import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { ThemeToggle } from './ThemeToggle';
import { Group, User, PersonalChat, FollowRequest } from '../../types';
import { useInbox } from '../../hooks/useChat';
import { getPendingRequests } from '../../services/firebaseFollowService';
import { NotificationCenter } from '../chat/NotificationCenter';
import { AbstractBackground } from '../ui/AbstractBackground';
import { HeroOrb } from '../ui/HeroOrb';

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
    user,
    onLogout,
    mobileTitle = "SlowChat"
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <div className="relative flex h-screen w-full overflow-hidden text-foreground font-sans">
            {/* --- Premium Motion Background --- */}
            <AbstractBackground />

            {/* --- Notifications Overlay --- */}
            <AnimatePresence>
                {showNotifications && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <NotificationCenter
                            onClose={() => setShowNotifications(false)}
                            onSelectChat={onSelectNotification}
                        />
                    </div>
                )}
            </AnimatePresence>

            {/* --- Mobile Sidebar Overlay --- */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* --- Mobile Sidebar (Drawer) --- */}
            <aside className={`
                fixed inset-y-4 left-4 z-50 w-80 glass-panel rounded-[2rem] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] md:hidden
                ${sidebarOpen ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-[120%] opacity-0 scale-95'}
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
                    user={user}
                    onLogout={onLogout}
                    onClose={() => setSidebarOpen(false)}
                />
            </aside>

            {/* --- Main Layout Container --- */}
            <div className="relative z-10 flex w-full h-full p-4 gap-4">

                {/* Desktop Sidebar (Floating) */}
                <aside className="hidden md:flex w-80 flex-col glass-panel rounded-[2rem] shrink-0 overflow-hidden relative">
                    {/* Integrated 3D Hero Orb in Sidebar Header */}
                    <div className="absolute top-0 left-0 w-full h-40 pointer-events-none opacity-40">
                        <HeroOrb />
                    </div>

                    <AISidebar
                        groups={userGroups}
                        activeId={activeChatId}
                        isPersonalActive={isPersonal}
                        onSelectGroup={onSelectGroup}
                        onSelectPersonal={onSelectPersonal}
                        onBrowseGroups={onBrowseGroups}
                        onFollowRequests={onFollowRequests}
                        onOpenNotifications={() => setShowNotifications(true)}
                        onCreateGroup={onCreateGroup}
                        onOpenSettings={onOpenSettings}
                        user={user}
                        onLogout={onLogout}
                    />
                </aside>

                {/* Main Content Area (Glass Sheet) */}
                <motion.div
                    layout
                    className="flex-1 flex flex-col min-w-0 glass-panel rounded-[2rem] relative overflow-hidden"
                >
                    {/* Header (Floating in Content) */}
                    <header className="flex items-center justify-between px-6 py-4 border-b border-border/10 sticky top-0 z-40 h-[72px] bg-background/5 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <button
                                className="md:hidden w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-90"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Icon name="menu" className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="font-black text-xs uppercase tracking-[0.2em] text-primary italic">SlowChat</span>
                                    <span className="font-bold text-sm tracking-tight truncate max-w-[200px]">{sidebarOpen ? '' : mobileTitle}</span>
                                </div>

                                {/* Integrated Notifications Hub */}
                                <button
                                    onClick={() => setShowNotifications(true)}
                                    className="relative w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/20 transition-all active:scale-90"
                                    title="Notifications"
                                >
                                    <Icon name="message" className="w-4 h-4" />
                                    {(user?.unreadCount || 0) > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background"
                                        >
                                            {user?.unreadCount}
                                        </motion.span>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
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

interface AISidebarProps {
    groups: Group[];
    activeId: string | null;
    isPersonalActive: boolean;
    onSelectGroup: (id: string) => void;
    onSelectPersonal: (chatId: string) => void;
    onBrowseGroups: () => void;
    onFollowRequests: () => void;
    onOpenNotifications: () => void; // Kept for prop-compatibility but logic moved
    onCreateGroup: () => void;
    onOpenSettings: () => void;
    user: User | null;
    onLogout: () => void;
    onClose?: () => void;
}

import { FriendsList } from '../social/FriendsList';

/* ... imports ... */

/* ... interfaces ... */

const AISidebar: React.FC<AISidebarProps> = ({
    groups,
    activeId,
    isPersonalActive,
    onSelectGroup,
    onSelectPersonal,
    onBrowseGroups,
    onFollowRequests,
    onOpenNotifications,
    onCreateGroup,
    onOpenSettings,
    user,
    onLogout,
    onClose
}) => {
    const { personalChats } = useInbox();
    const [followReqs, setFollowReqs] = useState<FollowRequest[]>([]);
    const [view, setView] = useState<'chats' | 'friends'>('chats');

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = getPendingRequests(setFollowReqs);
        return () => unsubscribe();
    }, [user?.id]);

    const handleFriendSelect = (friendId: string) => {
        if (!user?.id) return;
        const chatId = [user.id, friendId].sort().join('_');
        onSelectPersonal(chatId);
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col h-full p-6 pt-10 gap-6 relative z-10">
            <div className="flex items-center justify-between px-2">
                <span className="font-black text-2xl tracking-tighter text-primary italic">SLOWCHAT</span>
                {onClose && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="md:hidden opacity-50 p-2"
                    >
                        <Icon name="x" />
                    </motion.button>
                )}
            </div>

            <div className="flex gap-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('chats')}
                    className={`flex-1 gap-2 h-12 flex items-center justify-center rounded-2xl transition-all font-black uppercase text-xs tracking-widest ${view === 'chats' ? 'btn-primary' : 'bg-background/10 text-muted-foreground hover:bg-background/20'}`}
                >
                    <Icon name="message" className="w-4 h-4" />
                    <span className="hidden sm:inline">Chats</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView('friends')}
                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border border-border/10 transition-all font-black ${view === 'friends' ? 'btn-secondary' : 'bg-background/10 text-muted-foreground hover:text-primary'}`}
                    title="Friends & Requests"
                >
                    <Icon name="users" className="w-5 h-5" />
                    {followReqs.length > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background"
                        >
                            {followReqs.length}
                        </motion.span>
                    )}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCreateGroup}
                    className="w-12 h-12 bg-background/10 rounded-2xl flex items-center justify-center border border-border/10 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                    title="Create Group"
                >
                    <Icon name="plus" className="w-5 h-5" />
                </motion.button>
            </div>

            {view === 'friends' ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                    <FriendsList onSelectFriend={handleFriendSelect} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0 gap-6">
                    <div className="relative">
                        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40 shadow-sm" />
                        <input className="glass-input pl-11 h-12 bg-background/20" placeholder="Search chats..." />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar -mx-2 px-2 pb-4">
                        {/* Personal Chats */}
                        {personalChats.length > 0 && (
                            <div className="space-y-2">
                                <div className="py-2 flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-60 px-3">
                                    <span>Direct Chats</span>
                                    <span className="w-4 h-4 rounded-full bg-border/20 flex items-center justify-center text-[8px]">{personalChats.length}</span>
                                </div>
                                {personalChats.map((chat) => {
                                    const unread = user ? (chat.unreadCounts[user.id] || 0) : 0;
                                    const otherUserId = chat.userIds.find(id => id !== user?.id);
                                    const otherUsername = chat.usernames?.[otherUserId || ''] || `User_${otherUserId?.slice(0, 4)}`;
                                    const isActive = activeId === chat.id && isPersonalActive;

                                    return (
                                        <motion.button
                                            key={chat.id}
                                            onClick={() => onSelectPersonal(chat.id)}
                                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`
                                                w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all group relative
                                                ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}
                                            `}
                                        >
                                            {isActive && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-primary rounded-full" />}
                                            <div className={`w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs transition-all ${isActive ? 'scale-110 shadow-lg shadow-primary/20' : 'group-hover:scale-110'}`}>
                                                {otherUsername.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate font-bold text-sm uppercase tracking-tight">{otherUsername}</span>
                                                    {unread > 0 && (
                                                        <motion.span
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-primary/20"
                                                        >
                                                            {unread}
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] opacity-50 truncate font-medium">{chat.lastMessage || 'Active'}</p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Groups */}
                        <div className="space-y-2">
                            <div className="py-2 flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-60 px-3">
                                <span>Groups</span>
                                <span className="w-4 h-4 rounded-full bg-border/20 flex items-center justify-center text-[8px]">{groups.length}</span>
                            </div>
                            {groups.map((group) => {
                                const unread = user ? (group.unreadCounts?.[user.id] || 0) : 0;
                                const isActive = activeId === group.id && !isPersonalActive;
                                return (
                                    <motion.button
                                        key={group.id}
                                        onClick={() => onSelectGroup(group.id)}
                                        whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`
                                            w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all group relative
                                            ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}
                                        `}
                                    >
                                        {isActive && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-primary rounded-full" />}
                                        <div className={`w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-xl transition-all ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            {group.image}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="truncate font-bold text-sm uppercase tracking-tight">{group.name}</span>
                                                    {unread > 0 && (
                                                        <motion.span
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-primary/20"
                                                        >
                                                            {unread}
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-20 shrink-0">
                                                    <Icon name="users" className="w-3 h-3" />
                                                    <span className="text-[9px] font-black">{group.members}</span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] opacity-50 truncate font-medium">{group.lastMessage || 'Active'}</p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-auto space-y-4 pt-4 border-t border-border/10">
                <motion.button
                    whileHover={{ x: 5, color: 'var(--primary)' }}
                    onClick={onBrowseGroups}
                    className="flex items-center gap-4 w-full px-4 h-12 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground transition-all"
                >
                    <Icon name="compass" className="w-5 h-5 opacity-50" />
                    <span>Discover</span>
                </motion.button>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="glass-card p-4 flex items-center gap-4 cursor-pointer group rounded-[1.5rem]"
                    onClick={onOpenSettings}
                >
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 text-lg transition-transform group-hover:scale-110">
                        {user?.username?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black truncate text-sm uppercase tracking-tight">{user?.username || 'User'}</p>
                        <p className="text-[9px] text-muted-foreground truncate uppercase tracking-[0.2em] font-black opacity-30 italic">Member</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 group-hover:rotate-90 transition-transform">
                        <Icon name="settings" className="w-4 h-4 text-muted-foreground" />
                    </div>
                </motion.div>

                <div className="flex items-center justify-between px-2">
                    <ThemeToggle />
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onLogout}
                        className="w-11 h-11 flex items-center justify-center text-red-500 rounded-2xl transition-all"
                    >
                        <Icon name="logout" className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
