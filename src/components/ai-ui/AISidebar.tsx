import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
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
    const [activeTab, setActiveTab] = useState<'home' | 'direct' | 'groups' | 'friends' | 'inbox'>('home');
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

    const navItems = [
        { id: 'home', icon: 'zap', label: 'Dashboard', action: onGoHome },
        { id: 'direct', icon: 'message', label: 'Pulse', action: () => setActiveTab('direct') },
        { id: 'groups', icon: 'layers', label: 'Clusters', action: () => setActiveTab('groups') },
        { id: 'friends', icon: 'users', label: 'Alliance', action: () => setActiveTab('friends'), badge: followReqs.length },
        { id: 'inbox', icon: 'bell', label: 'Signals', action: () => setActiveTab('inbox'), badge: unreadNotifications },
    ];

    const handleFriendSelect = (friendId: string) => {
        // Find existing chat or just open home to start one
        onGoHome();
    };

    const handleSelectNotification = (chatId: string, isPersonal: boolean) => {
        if (isPersonal) onSelectPersonal(chatId);
        else onSelectGroup(chatId);
        if (onClose) onClose();
    };

    return (
        <div className="h-full flex flex-col bg-[#080808] border-r border-white/5 relative z-30">
            {/* Branding */}
            <div className="p-8 flex items-center justify-between shrink-0">
                <button onClick={onGoHome} className="flex items-center gap-3 active:scale-95 transition-transform group">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Logo className="h-6 w-auto text-white" />
                    </div>
                    <span className="font-black text-lg tracking-tighter uppercase italic leading-none">SlowChat</span>
                </button>
            </div>

            {/* Main Navigation */}
            <nav className="px-4 space-y-1 mt-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => { item.action(); setActiveTab(item.id as any); }}
                        className={`w-full h-14 rounded-2xl flex items-center gap-4 px-6 transition-all relative group
                            ${activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}
                        `}
                    >
                        <Icon name={item.icon} className={`w-5 h-5 ${activeTab === item.id ? 'text-primary' : 'text-muted-foreground group-hover:text-white'}`} />
                        <span className={`text-xs font-bold tracking-wide ${activeTab === item.id ? 'text-primary' : ''}`}>{item.label}</span>

                        {item.badge ? (
                            <span className="ml-auto w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-black flex items-center justify-center ring-4 ring-[#080808]">
                                {item.badge}
                            </span>
                        ) : null}

                        {activeTab === item.id && (
                            <motion.div
                                layoutId="nav-active"
                                className="absolute left-1 w-1 h-6 bg-primary rounded-full"
                            />
                        )}
                    </button>
                ))}
            </nav>

            {/* Sub-context (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar mt-6 px-4 pb-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'direct' && (
                        <motion.div
                            key="direct"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 pl-4 py-2">Pulse nodes</h4>
                            <div className="space-y-1">
                                {personalChats.map(chat => {
                                    const otherId = chat.userIds.find(id => id !== user?.id);
                                    const name = chat.usernames?.[otherId || ''] || 'User';
                                    const active = activeId === chat.id && isPersonalActive;
                                    return (
                                        <button
                                            key={chat.id}
                                            onClick={() => onSelectPersonal(chat.id)}
                                            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${active ? 'bg-white/5 text-white' : 'hover:bg-white/2 text-muted-foreground'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[#121212] flex items-center justify-center font-black text-xs border border-white/5 group-hover:border-primary/30 transition-colors">
                                                {name[0]}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-sm font-bold truncate">{name}</p>
                                                <p className="text-[10px] truncate opacity-40">{chat.lastMessage || 'Link established'}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'groups' && (
                        <motion.div
                            key="groups"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between px-4 py-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Active Clusters</h4>
                                <button onClick={onCreateGroup} className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                                    <Icon name="plus" className="w-4 h-4 text-primary" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => onSelectGroup(g.id)}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all group ${activeId === g.id && !isPersonalActive ? 'bg-white/5 text-white' : 'hover:bg-white/2 text-muted-foreground'}`}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[#121212] flex items-center justify-center text-lg border border-white/5 group-hover:border-secondary/30 transition-colors">
                                            {g.image}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-bold truncate">{g.name}</p>
                                            <p className="text-[10px] truncate opacity-40">{g.lastMessage || 'Operational'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'friends' && (
                        <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <FriendsList onSelectFriend={handleFriendSelect} />
                        </motion.div>
                    )}

                    {activeTab === 'inbox' && (
                        <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <NotificationList
                                notifications={notifications}
                                onSelectChat={handleSelectNotification}
                                onMarkAllRead={markAllAsRead}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Profile Section */}
            <div className="p-6 border-t border-white/5 shrink-0 bg-[#080808]/50 backdrop-blur-xl">
                <button onClick={onOpenSettings} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center font-black text-white shadow-lg shadow-primary/10">
                            {user?.username?.[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-[#080808]" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-black truncate">{user?.username}</p>
                        <p className="text-[10px] tracking-widest uppercase opacity-40 font-black">Authorized</p>
                    </div>
                    <Icon name="chevron-right" className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};
