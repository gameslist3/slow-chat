import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { ThemeToggle } from './ThemeToggle';
import { Group, User, PersonalChat, FollowRequest, Notification } from '../../types';
import { useInbox } from '../../hooks/useChat';
import { getPendingRequests, acceptFollowRequest, declineFollowRequest } from '../../services/firebaseFollowService';
import { subscribeToNotifications, markAllAsRead } from '../../services/firebaseNotificationService';
import { FriendsList } from '../social/FriendsList';
import { NotificationList } from '../chat/NotificationCenter';
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
    onCreateGroup,
    onOpenSettings,
    onGoHome,
    user,
    onLogout,
    onClose
}) => {
    const { personalChats } = useInbox();
    const [searchTerm, setSearchTerm] = useState('');
    const [followReqs, setFollowReqs] = useState<FollowRequest[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [view, setView] = useState<'chats' | 'friends' | 'notifications'>('chats');
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = subscribeToNotifications(setNotifications);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = getPendingRequests(setFollowReqs);
        return () => unsubscribe();
    }, [user?.id]);

    const unreadNotifications = notifications.filter(n => !n.read).length;

    const handleSelectNotification = (chatId: string, isPersonal: boolean, messageId?: string) => {
        if (isPersonal) onSelectPersonal(chatId);
        else onSelectGroup(chatId);
        if (onClose) onClose();
    };

    const handleAcceptReq = async (id: string, name: string) => {
        setFollowReqs(prev => prev.map(req => req.id === id ? { ...req, status: 'accepted' as const } : req));
        try {
            await acceptFollowRequest(id);
            toast(`Connected with ${name}`, 'success');
        } catch (err: any) {
            toast(err.message, 'error');
        }
    };

    const handleDeclineReq = async (id: string) => {
        setFollowReqs(prev => prev.map(req => req.id === id ? { ...req, status: 'declined' as const } : req));
        try {
            await declineFollowRequest(id);
        } catch (err: any) {
            toast(err.message, 'error');
        }
    };

    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredChats = personalChats.filter(chat => {
        const otherId = chat.userIds.find(id => id !== user?.id);
        const name = chat.usernames?.[otherId || ''] || 'User';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <aside className="h-full flex flex-col glass-panel border-r border-white/5 relative z-30 w-full md:w-80 lg:w-96 overflow-hidden bg-background/40 backdrop-blur-3xl shadow-2xl">
            {/* Header / Config */}
            <div className="p-6 pb-2 flex items-center justify-between shrink-0">
                <button onClick={onGoHome} className="active:scale-95 transition-transform opacity-80 hover:opacity-100">
                    <Logo className="h-8 w-auto text-foreground" />
                </button>
                <div className="flex gap-2">
                    <ThemeToggle />
                    <button onClick={onOpenSettings} className="w-10 h-10 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-all">
                        <Icon name="settings" className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* Profile / Stats Card */}
            <div className="mx-6 mt-4 p-5 rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon name="activity" className="w-16 h-16 text-primary rotate-12" />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/25">
                        {user?.username?.[0].toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-base leading-tight text-foreground">{user?.username}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-primary font-black opacity-80">Online</p>
                    </div>
                </div>
                {/* Visual Stats */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-primary/10">
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-foreground">{personalChats.length}</span>
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Chats</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-foreground">{groups.length}</span>
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Groups</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex px-6 mt-6 mb-2 gap-2">
                {['chats', 'friends', 'notifications'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setView(t as any)}
                        className={`relative flex-1 h-10 rounded-xl flex items-center justify-center transition-all ${view === t ? 'bg-foreground text-background font-bold shadow-lg' : 'hover:bg-foreground/5 text-muted-foreground'
                            }`}
                    >
                        {t === 'chats' && <Icon name="message" className="w-4 h-4" />}
                        {t === 'friends' && <Icon name="users" className="w-4 h-4" />}
                        {t === 'notifications' && <Icon name="bell" className="w-4 h-4" />}

                        {/* Badges */}
                        {t === 'friends' && followReqs.length > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                        {t === 'notifications' && unreadNotifications > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="px-6 mb-4">
                <div className="relative group">
                    <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-foreground transition-colors" />
                    <input
                        className="w-full h-10 bg-foreground/5 rounded-xl pl-10 pr-4 text-xs font-bold outline-none border border-transparent focus:bg-foreground/10 focus:border-foreground/5 transition-all placeholder:text-muted-foreground/40"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto px-6 space-y-2 pb-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {view === 'chats' && (
                        <motion.div
                            key="chats"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Create / Discover Actions */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button onClick={onBrowseGroups} className="h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 hover:border-violet-500/40 p-3 flex flex-col justify-between transition-all group">
                                    <Icon name="compass" className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-500/80">Discover</span>
                                </button>
                                <button onClick={onCreateGroup} className="h-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 p-3 flex flex-col justify-between transition-all group">
                                    <Icon name="plus" className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500/80">Create</span>
                                </button>
                            </div>

                            {/* Direct Messages */}
                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-2">Private</h4>
                                {filteredChats.length === 0 && <p className="text-xs text-muted-foreground/40 italic p-4 text-center">No chats found.</p>}
                                {filteredChats.map(chat => {
                                    const otherId = chat.userIds.find(id => id !== user?.id);
                                    const name = chat.usernames?.[otherId || ''] || 'User';
                                    const active = activeId === chat.id && isPersonalActive;
                                    const unread = chat.unreadCounts?.[user?.id || ''] || 0;

                                    return (
                                        <button
                                            key={chat.id}
                                            onClick={() => onSelectPersonal(chat.id)}
                                            className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all relative overflow-hidden group ${active ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${active ? 'bg-white/20' : 'bg-foreground/5 group-hover:bg-foreground/10'}`}>
                                                {name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center justify-between">
                                                    <p className={`font-bold text-sm truncate ${active ? 'text-white' : 'text-foreground'}`}>{name}</p>
                                                    {unread > 0 && <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />}
                                                </div>
                                                <p className={`text-[10px] truncate opacity-60 ${active ? 'text-white/80' : ''}`}>
                                                    {chat.lastMessage || 'Start talking...'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Groups */}
                            <div className="space-y-2">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-2">Clusters</h4>
                                {filteredGroups.length === 0 && <p className="text-xs text-muted-foreground/40 italic p-4 text-center">No groups joined.</p>}
                                {filteredGroups.map(group => {
                                    const active = activeId === group.id && !isPersonalActive;
                                    const unread = group.unreadCounts?.[user?.id || ''] || 0;

                                    return (
                                        <button
                                            key={group.id}
                                            onClick={() => onSelectGroup(group.id)}
                                            className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all relative overflow-hidden group ${active ? 'bg-gradient-to-r from-secondary to-orange-500 text-white shadow-lg shadow-secondary/25' : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${active ? 'bg-white/20' : 'bg-foreground/5 group-hover:bg-foreground/10'}`}>
                                                {group.image}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center justify-between">
                                                    <p className={`font-bold text-sm truncate ${active ? 'text-white' : 'text-foreground'}`}>{group.name}</p>
                                                    {unread > 0 && <span className="text-[9px] font-black bg-white text-secondary px-1.5 rounded-md">{unread}</span>}
                                                </div>
                                                <p className={`text-[10px] truncate opacity-60 ${active ? 'text-white/80' : ''}`}>
                                                    {group.lastMessage || 'Active'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {view === 'friends' && (
                        <motion.div
                            key="friends"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <FriendsList onSelectFriend={handleFriendSelect} />

                            {/* Embedded Follow Requests */}
                            {followReqs.length > 0 && (
                                <div className="mt-6 space-y-4">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary pl-2">Pending Requests</h4>
                                    {followReqs.map(req => (
                                        <div key={req.id} className="p-4 rounded-3xl bg-secondary/10 border border-secondary/20">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black text-white">
                                                    {req.fromUsername[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs text-secondary-foreground">{req.fromUsername}</p>
                                                    <p className="text-[9px] opacity-60">Wants to connect</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAcceptReq(req.id, req.fromUsername)} className="flex-1 h-8 bg-secondary text-white rounded-lg text-[10px] font-bold">ACCEPT</button>
                                                <button onClick={() => handleDeclineReq(req.id)} className="flex-1 h-8 bg-background/50 text-muted-foreground hover:text-red-500 rounded-lg text-[10px] font-bold">DECLINE</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {view === 'notifications' && (
                        <motion.div
                            key="notifications"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="-mx-4"
                        >
                            <NotificationList
                                notifications={notifications}
                                onSelectChat={handleSelectNotification}
                                onMarkAllRead={markAllAsRead}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </aside>
    );
};
