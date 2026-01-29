import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { ThemeToggle } from './ThemeToggle';
import { Group, User, PersonalChat, FollowRequest } from '../../types';
import { useInbox } from '../../hooks/useChat';
import { getPendingRequests } from '../../services/firebaseFollowService';
import { FriendsList } from '../social/FriendsList';

interface AISidebarProps {
    groups: Group[];
    activeId: string | null;
    isPersonalActive: boolean;
    onSelectGroup: (id: string) => void;
    onSelectPersonal: (chatId: string) => void;
    onBrowseGroups: () => void;
    onFollowRequests: () => void;
    onOpenNotifications: () => void;
    onCreateGroup: () => void;
    onOpenSettings: () => void;
    onGoHome: () => void;
    user: User | null;
    onLogout: () => void;
    onClose?: () => void;
}

export const AISidebar: React.FC<AISidebarProps> = ({
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
    onGoHome,
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
        <div className="flex flex-col h-full p-8 gap-8 relative z-10">
            <div className="flex items-center justify-between px-2 pt-2">
                <button
                    onClick={onGoHome}
                    className="flex flex-col text-left hover:opacity-70 transition-opacity active:scale-95"
                >
                    <span className="font-protocol text-[9px] tracking-[0.5em] text-primary opacity-60">SYSTEM_VOICE</span>
                    <span className="font-protocol text-2xl tracking-tighter text-foreground mt-1">SLOWCHAT</span>
                </button>
                {onClose && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="md:hidden opacity-50 p-2"
                    >
                        <Icon name="x" className="w-6 h-6" />
                    </motion.button>
                )}
            </div>

            <div className="flex gap-3">
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('chats')}
                    className={`flex-1 gap-3 h-14 flex items-center justify-center rounded-2xl transition-all font-protocol text-[10px] tracking-[0.2em] ${view === 'chats' ? 'btn-primary' : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10'}`}
                >
                    <Icon name="message" className="w-4 h-4" />
                    <span>Transmissions</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView('friends')}
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === 'friends' ? 'btn-secondary' : 'bg-foreground/5 text-muted-foreground hover:text-primary'}`}
                    title="Friends & Requests"
                >
                    <Icon name="users" className="w-5 h-5" />
                    {followReqs.length > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-background"
                        >
                            {followReqs.length}
                        </motion.span>
                    )}
                </motion.button>
            </div>

            {view === 'friends' ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                    <FriendsList onSelectFriend={handleFriendSelect} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0 gap-6">
                    <div className="relative group">
                        <Icon name="search" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30 transition-opacity group-focus-within:opacity-100" />
                        <input className="glass-input pl-14 h-14 bg-foreground/5" placeholder="Filter protocols..." />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar pr-3">
                        {/* Personal Chats */}
                        {personalChats.length > 0 && (
                            <div className="space-y-3">
                                <div className="py-2 flex items-center justify-between font-protocol text-[10px] tracking-[0.3em] text-primary opacity-40 px-3 uppercase">
                                    <span>Direct_Sync</span>
                                    <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[8px]">{personalChats.length}</span>
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
                                            whileHover={{ x: 6, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`
                                                w-full flex items-center gap-4 px-4 py-4 rounded-3xl transition-all group relative border
                                                ${isActive ? 'bg-primary border-primary/30 text-white shadow-xl shadow-primary/20' : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground'}
                                            `}
                                        >
                                            <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-bold text-xs transition-all ${isActive ? 'bg-white/20 text-white' : 'bg-foreground/5 text-primary'}`}>
                                                {otherUsername.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate font-bold text-sm tracking-tight">{otherUsername}</span>
                                                    {unread > 0 && (
                                                        <motion.span
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg ${isActive ? 'bg-secondary text-black' : 'bg-primary text-white shadow-primary/20'}`}
                                                        >
                                                            {unread}
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <p className={`text-[11px] truncate font-medium mt-0.5 ${isActive ? 'text-white/60' : 'opacity-40'}`}>{chat.lastMessage || 'Link Stable'}</p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Groups */}
                        <div className="space-y-3">
                            <div className="py-2 flex items-center justify-between font-protocol text-[10px] tracking-[0.3em] text-primary opacity-40 px-3 uppercase">
                                <span>Nexus_Clusters</span>
                                <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[8px]">{groups.length}</span>
                            </div>
                            {groups.map((group) => {
                                const unread = user ? (group.unreadCounts?.[user.id] || 0) : 0;
                                const isActive = activeId === group.id && !isPersonalActive;
                                return (
                                    <motion.button
                                        key={group.id}
                                        onClick={() => onSelectGroup(group.id)}
                                        whileHover={{ x: 6, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`
                                            w-full flex items-center gap-4 px-4 py-4 rounded-3xl transition-all group relative border
                                            ${isActive ? 'bg-primary border-primary/30 text-white shadow-xl shadow-primary/20' : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground'}
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-xl transition-all ${isActive ? 'bg-white/20' : 'bg-foreground/5'}`}>
                                            {group.image}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span className="truncate font-bold text-sm tracking-tight">{group.name}</span>
                                                    {unread > 0 && (
                                                        <motion.span
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className={`text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg ${isActive ? 'bg-secondary text-black' : 'bg-primary text-white shadow-primary/20'}`}
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
                                            <p className={`text-[11px] truncate font-medium mt-0.5 ${isActive ? 'text-white/60' : 'opacity-40'}`}>{group.lastMessage || 'Sync Active'}</p>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-auto space-y-6 pt-6 border-t border-border/10">
                <div className="flex items-center justify-between">
                    <motion.button
                        whileHover={{ x: 8, color: 'var(--primary)' }}
                        onClick={onBrowseGroups}
                        className="flex items-center gap-4 px-2 h-10 font-protocol text-[9px] tracking-[0.4em] text-muted-foreground transition-all uppercase"
                    >
                        <Icon name="compass" className="w-4 h-4 opacity-40" />
                        <span>Discover</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onCreateGroup}
                        className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                    >
                        <Icon name="plus" className="w-5 h-5" />
                    </motion.button>
                </div>

                <motion.div
                    whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.02)' }}
                    className="glass-card p-4 flex items-center gap-4 cursor-pointer group rounded-[1.75rem]"
                    onClick={onOpenSettings}
                >
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg shadow-primary/30 text-lg transition-transform group-hover:scale-110 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                        {user?.username?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-sm tracking-tight">{user?.username || 'User'}</p>
                        <p className="font-protocol text-[8px] text-primary truncate tracking-[0.3em] mt-0.5 opacity-60 uppercase">Verified_Link</p>
                    </div>
                    <div className="p-2 rounded-xl bg-foreground/5 group-hover:rotate-90 transition-transform">
                        <Icon name="settings" className="w-4 h-4 text-muted-foreground" />
                    </div>
                </motion.div>

                <div className="flex items-center justify-between px-2">
                    <ThemeToggle />
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onLogout}
                        className="w-12 h-12 flex items-center justify-center text-destructive rounded-2xl transition-all"
                    >
                        <Icon name="logout" className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
