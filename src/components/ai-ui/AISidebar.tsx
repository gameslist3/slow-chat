import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { ThemeToggle } from './ThemeToggle';
import { Group, User, PersonalChat, FollowRequest } from '../../types';
import { useInbox } from '../../hooks/useChat';
import { getPendingRequests } from '../../services/firebaseFollowService';
import { FriendsList } from '../social/FriendsList';
import { Logo } from '../common/Logo';

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
        <aside className="h-full flex flex-col bg-background/20 relative z-30 w-full">
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
                <button onClick={onGoHome} className="active:scale-95 transition-transform"><Logo className="h-9 w-auto" /></button>
                <div className="flex gap-3">
                    <button onClick={onBrowseGroups} className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-muted-foreground"><Icon name="compass" className="w-5 h-5" /></button>
                    <button onClick={onCreateGroup} className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-muted-foreground"><Icon name="plus" className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Search */}
            <div className="px-6 py-4">
                <div className="relative">
                    <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                    <input className="w-full h-12 bg-foreground/5 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none border border-transparent focus:border-primary/20 transition-all" placeholder="Search clusters..." />
                </div>
            </div>

            {/* Tab Controller */}
            <div className="px-6 flex gap-3 mb-6">
                <button onClick={() => setView('chats')} className={`flex-1 h-12 rounded-2xl text-xs font-black uppercase tracking-widest ${view === 'chats' ? 'btn-primary' : 'bg-foreground/5 text-muted-foreground'}`}>Chats</button>
                <button onClick={() => setView('friends')} className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${view === 'friends' ? 'btn-secondary' : 'bg-foreground/5 text-muted-foreground'}`}>
                    <Icon name="users" className="w-5 h-5" />
                    {followReqs.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background">{followReqs.length}</span>}
                </button>
            </div>

            {/* List Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-8 pb-32 custom-scrollbar">
                {view === 'friends' ? (
                    <FriendsList onSelectFriend={handleFriendSelect} />
                ) : (
                    <>
                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] px-2 mb-2">Direct Syncs</div>
                            {personalChats.map(chat => {
                                const otherId = chat.userIds.find(id => id !== user?.id);
                                const name = chat.usernames?.[otherId || ''] || 'User';
                                const active = activeId === chat.id && isPersonalActive;
                                return (
                                    <button key={chat.id} onClick={() => onSelectPersonal(chat.id)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black ${active ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{name.slice(0, 2).toUpperCase()}</div>
                                        <div className="text-left"><p className="font-bold text-sm tracking-tight">{name}</p><p className={`text-[10px] truncate opacity-50 ${active ? 'text-white' : ''}`}>{chat.lastMessage || 'Connected'}</p></div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="space-y-3">
                            <div className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] px-2 mb-2">Active Clusters</div>
                            {groups.map(group => {
                                const active = activeId === group.id && !isPersonalActive;
                                return (
                                    <button key={group.id} onClick={() => onSelectGroup(group.id)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl ${active ? 'bg-white/20' : 'bg-foreground/5'}`}>{group.image}</div>
                                        <div className="text-left"><p className="font-bold text-sm tracking-tight">{group.name}</p><p className={`text-[10px] truncate opacity-50 ${active ? 'text-white' : ''}`}>{group.lastMessage || 'Active'}</p></div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* User Footer */}
            <div className="p-6 border-t border-border/5 bg-foreground/5 mt-auto">
                <button onClick={onOpenSettings} className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-foreground/10 transition-all">
                    <div className="relative">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black text-xs">{user?.username?.[0].toUpperCase() || 'U'}</div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div className="text-left flex-1"><p className="text-sm font-black">{user?.username || 'Gapes User'}</p><p className="text-[9px] font-black text-primary/60 uppercase">Authenticated</p></div>
                    <Icon name="settings" className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>
        </aside>
    );
};
