import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plus, Search, MessageSquare, Compass, Settings, LogOut, UserPlus, Users } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Group, User, PersonalChat, FollowRequest } from '../../types';
import { useInbox } from '../../hooks/useChat';
import { getPendingRequests } from '../../services/firebaseFollowService';
import { NotificationCenter } from '../chat/NotificationCenter';

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
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {showNotifications && (
                <NotificationCenter
                    onClose={() => setShowNotifications(false)}
                    onSelectChat={onSelectNotification}
                />
            )}

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-80 flex-col bg-surface border-r border-border shrink-0 shadow-ui z-30">
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

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-80 bg-surface border-r border-border transition-transform duration-500 ease-in-out md:hidden shadow-2xl
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-background relative">
                {/* Header (Desktop + Mobile) */}
                <header className="flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40 shadow-sm h-[72px]">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center text-muted-foreground hover:text-primary transition-all active:scale-95"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="font-black text-xs uppercase tracking-[0.2em] text-primary italic">SlowChat</span>
                                <span className="font-bold text-sm tracking-tight truncate max-w-[200px]">{sidebarOpen ? '' : mobileTitle}</span>
                            </div>

                            {/* Integrated Notifications Hub */}
                            <button
                                onClick={() => setShowNotifications(true)}
                                className="relative w-9 h-9 rounded-xl bg-surface2 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                                title="Notifications"
                            >
                                <MessageSquare className="w-4 h-4" />
                                {(user?.unreadCount || 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-danger text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-surface">
                                        {user?.unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                    </div>
                </header>

                <main className="flex-1 overflow-hidden flex flex-col">
                    {children}
                </main>
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

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = getPendingRequests(setFollowReqs);
        return () => unsubscribe();
    }, [user?.id]);

    return (
        <div className="flex flex-col h-full p-4 gap-4">
            <div className="flex items-center justify-between px-2">
                <span className="font-black text-2xl tracking-tighter text-primary italic">SLOWCHAT</span>
                {onClose && <button onClick={onClose} className="md:hidden opacity-50"><X /></button>}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onCreateGroup}
                    className="ui-button-primary flex-1 gap-2 h-11 shadow-lg hover:shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs uppercase font-black tracking-widest">Create Group</span>
                </button>
                <button
                    onClick={onFollowRequests}
                    className="ui-button-ghost relative w-11 h-11 bg-surface2 rounded-2xl flex items-center justify-center border border-border/30 hover:border-primary/30 transition-all font-black"
                    title="Friend Requests"
                >
                    <UserPlus className="w-5 h-5 text-muted-foreground" />
                    {followReqs.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface">
                            {followReqs.length}
                        </span>
                    )}
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                <input className="ui-input pl-10 h-10 bg-surface2 border-transparent focus:bg-background placeholder:text-[10px] placeholder:uppercase placeholder:font-black placeholder:tracking-widest" placeholder="Search chats..." />
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar -mx-2 px-2">
                {/* Personal Chats */}
                {personalChats.length > 0 && (
                    <div className="space-y-1">
                        <div className="py-2 flex items-center justify-between text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-40 px-3 font-black">
                            <span>Direct Chats</span>
                            <span>{personalChats.length}</span>
                        </div>
                        {personalChats.map((chat) => {
                            const unread = user ? (chat.unreadCounts[user.id] || 0) : 0;
                            const otherUserId = chat.userIds.find(id => id !== user?.id);
                            const otherUsername = chat.usernames?.[otherUserId || ''] || `User_${otherUserId?.slice(0, 4)}`;
                            return (
                                <button
                                    key={chat.id}
                                    onClick={() => onSelectPersonal(chat.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group
                                        ${activeId === chat.id && isPersonalActive ? 'bg-surface2 text-primary shadow-sm' : 'text-muted-foreground hover:bg-surface2 hover:text-foreground'}
                                    `}
                                >
                                    <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs transition-transform group-hover:scale-105`}>
                                        {otherUsername.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate font-bold text-sm uppercase tracking-tight">{otherUsername}</span>
                                            {unread > 0 && (
                                                <motion.span
                                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                    className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-primary/20"
                                                >
                                                    {unread}
                                                </motion.span>
                                            )}
                                        </div>
                                        <p className="text-[10px] opacity-40 truncate font-medium">{chat.lastMessage || 'Active'}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Groups */}
                <div className="space-y-1">
                    <div className="py-2 flex items-center justify-between text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-40 px-3 font-black">
                        <span>Groups</span>
                        <span>{groups.length}</span>
                    </div>
                    {groups.map((group) => {
                        const unread = user ? (group.unreadCounts?.[user.id] || 0) : 0;
                        return (
                            <button
                                key={group.id}
                                onClick={() => onSelectGroup(group.id)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group
                                    ${activeId === group.id && !isPersonalActive ? 'bg-surface2 text-primary shadow-sm' : 'text-muted-foreground hover:bg-surface2 hover:text-foreground'}
                                `}
                            >
                                <span className={`text-xl transition-transform duration-300 ${activeId === group.id && !isPersonalActive ? 'scale-110' : 'group-hover:scale-110'}`}>{group.image}</span>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="truncate font-bold text-sm uppercase tracking-tight">{group.name}</span>
                                            {unread > 0 && (
                                                <motion.span
                                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                    className="bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg shadow-primary/20"
                                                >
                                                    {unread}
                                                </motion.span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-20 shrink-0">
                                            <Users className="w-3 h-3" />
                                            <span className="text-[9px] font-black">{group.members}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] opacity-40 truncate font-medium">{group.lastMessage || 'Active'}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-auto space-y-2">
                <button
                    onClick={onBrowseGroups}
                    className="ui-button-ghost w-full justify-start gap-4 h-12 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all"
                >
                    <Compass className="w-5 h-5" />
                    <span>Discover</span>
                </button>
                <div
                    className="ui-panel p-4 flex items-center gap-4 hover:bg-surface2 transition-all cursor-pointer group rounded-[2rem] border border-border/30"
                    onClick={onOpenSettings}
                >
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/30 text-lg transition-transform group-hover:scale-110">
                        {user?.username?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black truncate text-sm uppercase tracking-tight">{user?.username || 'User'}</p>
                        <p className="text-[9px] text-muted-foreground truncate uppercase tracking-[0.2em] font-black opacity-40 italic">Member since {new Date().getFullYear()}</p>
                    </div>
                    <Settings className="w-4 h-4 text-muted-foreground group-hover:rotate-90 transition-transform" />
                </div>
                <div className="flex items-center justify-between px-2 pt-2">
                    <ThemeToggle />
                    <button onClick={onLogout} className="ui-button-ghost w-11 h-11 flex items-center justify-center text-danger hover:bg-danger/10 rounded-2xl transition-all">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
