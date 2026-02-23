import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare, AtSign, Reply, UserPlus, Check, Trash2, Zap, RotateCw } from 'lucide-react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { subscribeToNotifications, markAsRead, markAllAsRead, cleanupNotifications } from '../../services/firebaseNotificationService';
import { acceptFollowRequest, declineFollowRequest } from '../../services/firebaseFollowService';
import { useToast } from '../../context/ToastContext';
import { Notification } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationCenterProps {
    onClose: () => void;
    onSelectChat: (chatId: string, isPersonal: boolean, messageId?: string) => void;
}

const IconForType = ({ type }: { type: Notification['type'] }) => {
    switch (type) {
        case 'mention': return <AtSign className="w-5 h-5" />;
        case 'reply': return <Reply className="w-5 h-5" />;
        case 'message': return <MessageSquare className="w-5 h-5" />;
        case 'follow_request': return <UserPlus className="w-5 h-5" />;
        case 'follow_accept': return <Check className="w-5 h-5" />;
        default: return <Bell className="w-5 h-5" />;
    }
};

const FollowRequestItem = ({ note, onSelectPersonal }: { note: Notification; onSelectPersonal: (chatId: string) => void }) => {
    const [loading, setLoading] = useState(false);
    const [actionStatus, setActionStatus] = useState<'pending' | 'accepted' | 'declined'>(note.followStatus || 'pending');
    const [hidden, setHidden] = useState(false);
    const { toast } = useToast();

    const handleAction = async (action: 'accept' | 'decline') => {
        setLoading(true);
        const newStatus = action === 'accept' ? 'accepted' : 'declined';

        try {
            const requestsRef = collection(db, 'follow_requests');
            const user = auth.currentUser;
            if (!user) return;

            const q = query(requestsRef,
                where('fromId', '==', note.groupId),
                where('toId', '==', user.uid),
                where('status', '==', 'pending'),
                limit(1)
            );
            const snap = await getDocs(q);
            if (snap.empty) {
                await markAsRead(note.id, { followStatus: newStatus });
            } else {
                const requestId = snap.docs[0].id;
                if (action === 'accept') {
                    await acceptFollowRequest(requestId);
                    await markAsRead(note.id, { followStatus: 'accepted' });
                    toast(`You follow ${note.senderName}`, 'success');
                } else {
                    await declineFollowRequest(requestId);
                    await markAsRead(note.id, { followStatus: 'declined' });
                    toast(`Request declined`, 'info');
                }
            }
            setActionStatus(newStatus);
        } catch (err: any) {
            console.error(err);
            toast("Action failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChat = () => {
        if (actionStatus !== 'accepted') return;
        const user = auth.currentUser;
        if (!user || !note.groupId) return;
        const chatId = [user.uid, note.groupId].sort().join('_');
        onSelectPersonal(chatId);
    };

    if (hidden) return null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, height: 0 }}
            className={`p-5 md:p-6 rounded-[2rem] bg-secondary/5 border border-secondary/20 relative overflow-hidden group shadow-xl ${actionStatus === 'declined' ? 'opacity-40 grayscale pointer-events-none' : ''}`}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-30 transition-opacity group-hover:opacity-50" />
            <div className="flex gap-4 md:gap-5 items-center relative z-10 text-left">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-secondary text-black rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
                    {note.senderName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-base tracking-tight text-white truncate">{note.senderName}</p>
                        <span className="text-[8px] font-bold opacity-30 tracking-widest uppercase shrink-0">
                            {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-[9px] font-bold text-secondary tracking-widest uppercase opacity-70 mt-1 text-left truncate">
                        {actionStatus === 'accepted' ? 'Connection Established' : actionStatus === 'declined' ? 'Protocol Terminated' : 'Wants to connect'}
                    </p>
                </div>
                {actionStatus === 'accepted' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenChat(); }}
                        className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center hover:bg-secondary hover:text-black transition-all shadow-lg"
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                )}
            </div>

            {actionStatus === 'pending' ? (
                <div className="flex gap-3 relative z-10 mt-6">
                    <button
                        onClick={() => handleAction('accept')}
                        disabled={loading}
                        className="flex-1 h-12 md:h-14 bg-secondary text-black rounded-2xl text-[10px] font-bold tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 shadow-xl shadow-secondary/20"
                    >
                        {loading ? '...' : 'ACCEPT'}
                    </button>
                    <button
                        onClick={() => handleAction('decline')}
                        disabled={loading}
                        className="flex-1 h-12 md:h-14 bg-foreground/5 text-muted-foreground border border-white/5 rounded-2xl text-[10px] font-bold tracking-widest hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-50"
                    >
                        {loading ? '...' : 'DECLINE'}
                    </button>
                </div>
            ) : actionStatus === 'declined' && (
                <div className="mt-4 text-center">
                    <span className="text-[9px] font-bold tracking-[0.2em] text-destructive/60 uppercase">Link Severed - Permanent</span>
                </div>
            )}
        </motion.div>
    );
};

export const NotificationList: React.FC<{
    notifications: Notification[];
    onSelectChat: (chatId: string, isPersonal: boolean, messageId?: string) => void;
    onMarkAllRead?: () => void;
}> = ({ notifications, onSelectChat, onMarkAllRead }) => {
    const user = auth.currentUser;

    const isPersonalNote = (note: Notification): boolean => {
        const type = note.type;
        const gId = note.groupId || '';
        if (type === 'message' || type === 'reply') return gId.includes('_');
        return type === 'follow_accept';
    };

    const handleSelect = async (note: Notification) => {
        if (!note.read) await markAsRead(note.id);
        if (note.senderName === 'System' || note.type === 'follow_request') return;
        const chatId = note.groupId;
        if (chatId) onSelectChat(chatId, isPersonalNote(note), note.messageId);
    };

    const [now, setNow] = useState(Date.now());

    // Force periodic re-render to handle real-time 24h expiry
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000); // Tick every minute
        return () => clearInterval(interval);
    }, []);

    // Auto-mark as read when screen is opened
    useEffect(() => {
        const hasUnreadActivity = notifications.some(n => !n.read && n.type !== 'follow_request');
        if (hasUnreadActivity && onMarkAllRead) {
            onMarkAllRead();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { user: authUser } = useAuth();
    const autoDeleteWindow = 5 * 60 * 60 * 1000; // Strictly 5 hours as per production requirement
    const clearedAt = authUser?.notificationsClearedAt || 0;

    const requests = notifications
        .filter(n => {
            if (n.type !== 'follow_request') return false;
            // PENDING friend requests are always visible (Pinned Top)
            return (n.followStatus || 'pending') === 'pending';
        })
        .sort((a, b) => b.timestamp - a.timestamp);

    const activity = notifications
        .filter(n => {
            if (n.type === 'follow_request') return false;

            // NEW RULE: If it's UNREAD, always show it (bypass timer/clearedAt)
            if (!n.read) return true;

            // Mark all read behavior: Hide if older than clearing timestamp AND marked as read
            const isCleared = n.timestamp <= clearedAt && n.read;
            if (isCleared) return false;

            // Dynamic Visibility Window for read alerts
            const isWithinTimer = (now - n.timestamp) < autoDeleteWindow;
            return isWithinTimer;
        })
        .sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="flex flex-col h-full bg-background/50 pt-8 md:pt-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-12">
                <AnimatePresence mode="popLayout">
                    {requests.length === 0 && activity.length === 0 ? (
                        <div className="py-20 text-center opacity-20 flex flex-col items-center gap-6">
                            <Bell className="w-12 h-12 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-widest uppercase">All caught up</span>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Section 1: Friend Requests (Pinned Top) */}
                            {requests.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2 text-[9px] font-bold tracking-widest text-secondary opacity-60 uppercase">
                                        <span>Friend Requests</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                                    </div>
                                    <div className="space-y-4">
                                        {requests.map(note => (
                                            <FollowRequestItem key={note.id} note={note} onSelectPersonal={(id) => onSelectChat(id, true)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section 2: Other Notifications (Sorted Newest -> Oldest) */}
                            {activity.length > 0 && (
                                <div className="space-y-4">
                                    <div className="px-2 text-[9px] font-bold tracking-widest text-primary opacity-40 uppercase">
                                        <span>Recent Activity</span>
                                    </div>
                                    <div className="space-y-4">
                                        {activity.map((note, index) => (
                                            <motion.div
                                                key={note.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05, type: 'spring', damping: 20, stiffness: 100 }}
                                                onClick={() => handleSelect(note)}
                                                className={`group relative p-4 rounded-3xl transition-all cursor-pointer border ${note.read ? 'opacity-40 grayscale bg-foreground/5 border-transparent' : 'bg-foreground/5 border-white/5 hover:border-primary/40 hover:bg-primary/5'}`}
                                            >
                                                <div className="flex gap-4 items-start text-left">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 ${note.type === 'mention' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : note.type === 'reply' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : note.type === 'follow_accept' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-foreground/5 text-muted-foreground border-white/5'}`}>
                                                        {note.groupImage ? (
                                                            <span className="text-xl">{note.groupImage}</span>
                                                        ) : (
                                                            <IconForType type={note.type} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <div className="flex flex-col text-left">
                                                                {note.groupName && (
                                                                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter opacity-70">
                                                                        {note.groupName}
                                                                    </span>
                                                                )}
                                                                <span className="font-bold text-xs tracking-tight text-foreground/90">
                                                                    {note.groupName ? `> ${note.senderName}` : note.senderName}
                                                                </span>
                                                            </div>
                                                            <span className="text-[8px] font-bold opacity-30 tracking-widest uppercase">{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-xs font-medium line-clamp-2 text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors text-left">{note.text}</p>
                                                    </div>
                                                </div>
                                                {!note.read && (
                                                    <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),1)]" />
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose, onSelectChat }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = subscribeToNotifications(user.id, setNotifications);

        // Initial cleanup of expired alerts from DB: Strictly 5 hours
        cleanupNotifications(user.id, 5);

        return () => unsubscribe();
    }, [user?.id, user?.autoDeleteHours]);

    return (
        <div ref={containerRef} className="flex flex-col h-full glass-panel rounded-none md:rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5 bg-[#0B1221]/95">
            <div className="flex items-center justify-end p-2 md:hidden">
                <button onClick={onClose} className="p-2"><X className="w-6 h-6" /></button>
            </div>
            <NotificationList notifications={notifications} onSelectChat={onSelectChat} onMarkAllRead={() => user?.id && markAllAsRead(user.id)} />
        </div>
    );
};
