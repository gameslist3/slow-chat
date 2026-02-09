import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { ThemeToggle } from './ThemeToggle';
import { Group, User, PersonalChat, FollowRequest } from '../../types';
import { useInbox } from '../../hooks/useChat';
import { getPendingRequests, acceptFollowRequest, declineFollowRequest } from '../../services/firebaseFollowService';
import { FriendsList } from '../social/FriendsList';
import { Logo } from '../common/Logo';
import { useToast } from '../../context/ToastContext';

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
    unreadNotifications: number;
    showNotifications: boolean;
    onToggleNotifications: () => void;
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
    onClose,
    unreadNotifications,
    showNotifications,
    onToggleNotifications
}) => {
    const { personalChats } = useInbox();
    const [followReqs, setFollowReqs] = useState<FollowRequest[]>([]);
    const [view, setView] = useState<'chats' | 'friends'>('chats');
    const { toast } = useToast();

    const handleAcceptReq = async (id: string, name: string) => {
        // Optimistic update
        setFollowReqs(prev => prev.map(req =>
            req.id === id ? { ...req, status: 'accepted' as const } : req
        ));

        try {
            await acceptFollowRequest(id);
            toast(`You follow ${name}`, 'success');
        } catch (err: any) {
            toast(err.message || "Failed to accept", 'error');
            // Error handling: the subscription will eventually reset the state to the server state
        }
    };

    const handleDeclineReq = async (id: string) => {
        // Optimistic update
        setFollowReqs(prev => prev.map(req =>
            req.id === id ? { ...req, status: 'declined' as const } : req
        ));

        try {
            await declineFollowRequest(id);
            toast("Request declined", 'info');
        } catch (err: any) {
            toast(err.message || "Failed to decline", 'error');
        }
    };

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
                <div className="flex gap-2">
                    <button
                        onClick={onToggleNotifications}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group/bell ${showNotifications ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'glass-card text-muted-foreground hover:bg-foreground/10'}`}
                    >
                        <motion.div
                            animate={unreadNotifications > 0 ? {
                                rotate: [0, -10, 10, -10, 10, 0],
                                scale: [1, 1.1, 1]
                            } : {}}
                            transition={{
                                repeat: Infinity,
                                duration: 2,
                                repeatDelay: 3
                            }}
                        >
                            <Icon name="bell" className="w-4 h-4" />
                        </motion.div>

                        {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-black text-white border-2 border-background shadow-lg">
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </span>
                        )}
                    </button>
                    <ThemeToggle />
                    <button onClick={onBrowseGroups} className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-muted-foreground hover:bg-foreground/10 transition-all"><Icon name="compass" className="w-4 h-4" /></button>
                    <button onClick={onCreateGroup} className="w-10 h-10 glass-card rounded-xl flex items-center justify-center text-muted-foreground hover:bg-foreground/10 transition-all"><Icon name="plus" className="w-4 h-4" /></button>
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
                        {followReqs.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2 mb-2">
                                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Pending Requests</span>
                                    <span className="text-[10px] font-black text-secondary/40">{followReqs.length}</span>
                                </div>
                                {followReqs.map(req => {
                                    const chatId = [user?.id, req.fromId].sort().join('_');
                                    return (
                                        <div key={req.id} className="w-full p-4 rounded-3xl bg-secondary/5 border border-secondary/10 flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black bg-secondary text-black text-xs">
                                                    {req.fromUsername.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="font-bold text-sm tracking-tight truncate text-white">{req.fromUsername}</p>
                                                    <p className="text-[9px] font-bold text-secondary tracking-widest uppercase opacity-60">
                                                        {req.status === 'accepted' ? 'Connected' : req.status === 'declined' ? 'Request Declined' : 'Wants to connect'}
                                                    </p>
                                                </div>
                                                {req.status === 'accepted' && (
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                {req.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAcceptReq(req.id, req.fromUsername)}
                                                            className="flex-1 h-9 bg-secondary text-black rounded-xl text-[9px] font-black tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20"
                                                        >
                                                            ACCEPT
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeclineReq(req.id)}
                                                            className="flex-1 h-9 bg-foreground/5 text-muted-foreground border border-white/5 rounded-xl text-[9px] font-black tracking-widest hover:bg-destructive/10 hover:text-destructive transition-all"
                                                        >
                                                            DECLINE
                                                        </button>
                                                    </>
                                                ) : req.status === 'accepted' ? (
                                                    <button
                                                        onClick={() => onSelectPersonal(chatId)}
                                                        className="w-full h-10 bg-green-500 text-white rounded-xl text-[10px] font-black tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                                    >
                                                        <Icon name="message" className="w-4 h-4" />
                                                        OPEN CHAT
                                                    </button>
                                                ) : (
                                                    <div className="w-full text-center py-2 text-[9px] font-black text-muted-foreground tracking-widest uppercase opacity-40">
                                                        Protocol Terminated
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="h-4" />
                            </div>
                        )}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">Direct chat</span>
                                <span className="text-[10px] font-black text-primary/20">{personalChats.length}</span>
                            </div>
                            {personalChats.map(chat => {
                                const otherId = chat.userIds.find(id => id !== user?.id);
                                const name = chat.usernames?.[otherId || ''] || 'User';
                                const active = activeId === chat.id && isPersonalActive;
                                return (
                                    <button key={chat.id} onClick={() => onSelectPersonal(chat.id)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black ${active ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{name.slice(0, 2).toUpperCase()}</div>
                                        <div className="text-left flex-1 min-w-0"><p className="font-bold text-sm tracking-tight truncate">{name}</p><p className={`text-[10px] truncate opacity-50 ${active ? 'text-white' : ''}`}>{chat.lastMessage || 'Connected'}</p></div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">Joined Groups</span>
                                <span className="text-[10px] font-black text-primary/20">{groups.length}</span>
                            </div>
                            {groups.map(group => {
                                const active = activeId === group.id && !isPersonalActive;
                                return (
                                    <button key={group.id} onClick={() => onSelectGroup(group.id)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${active ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'}`}>
                                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl ${active ? 'bg-white/20' : 'bg-foreground/5'}`}>{group.image}</div>
                                        <div className="text-left flex-1 min-w-0"><p className="font-bold text-sm tracking-tight truncate">{group.name}</p><p className={`text-[10px] truncate opacity-50 ${active ? 'text-white' : ''}`}>{group.lastMessage || 'Active'}</p></div>
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
                    <div className="text-left flex-1"><p className="text-sm font-black">{user?.username || 'Gapes User'}</p></div>
                    <Icon name="settings" className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>
        </aside>
    );
};
