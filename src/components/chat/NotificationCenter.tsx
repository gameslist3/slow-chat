import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare, AtSign, Reply, UserPlus, Check, Trash2, Zap, RotateCw } from 'lucide-react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { subscribeToNotifications, markAsRead, markAllAsRead } from '../../services/firebaseNotificationService';
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
    const [actionStatus, setActionStatus] = useState<'pending' | 'accepted' | 'declined'>(note.followStatus || (note.read ? 'accepted' : 'pending'));
    const { toast } = useToast();

    const handleAction = async (action: 'accept' | 'decline') => {
        const newStatus = action === 'accept' ? 'accepted' : 'declined';

        // Optimistic UI
        setActionStatus(newStatus);
        setLoading(false); // Hide spinner immediately

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
                // If it was already processed elsewhere, just mark notification
                await markAsRead(note.id, { followStatus: newStatus });
                return;
            }

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
        } catch (err: any) {
            console.error(err);
            // On hard error, we could revert, but usually with subscription it's better to just log
            // toast(err.message || "Action failed", 'error'); 
        }
    };

    const handleOpenChat = () => {
        const user = auth.currentUser;
        if (!user || !note.groupId) return;
        const chatId = [user.uid, note.groupId].sort().join('_');
        onSelectPersonal(chatId);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-5 md:p-6 rounded-[2rem] bg-secondary/5 border border-secondary/20 relative overflow-hidden group shadow-xl"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-30 transition-opacity group-hover:opacity-50" />

            <div className="flex gap-4 md:gap-5 items-center relative z-10">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-secondary text-black rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
                    {note.senderName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                    <p className="font-bold text-base tracking-tight text-white">{note.senderName}</p>
                    <p className="text-[9px] font-bold text-secondary tracking-widest uppercase opacity-70 mt-1">
                        {actionStatus === 'accepted' ? 'Connection Established' : actionStatus === 'declined' ? 'Request Declined' : 'Follow Request'}
                    </p>
                </div>
            </div>

            <div className="flex gap-3 relative z-10 mt-6">
                {actionStatus === 'pending' ? (
                    <>
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
                    </>
                ) : actionStatus === 'accepted' ? (
                    <button
                        onClick={handleOpenChat}
                        className="w-full h-12 md:h-14 bg-green-500 text-white rounded-2xl text-[10px] font-bold tracking-widest hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-500/20"
                    >
                        <MessageSquare className="w-4 h-4" />
                        MESSAGE NOW
                    </button>
                ) : (
                    <div className="w-full text-center py-4 text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-40">
                        Protocol Terminated
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const NotificationList: React.FC<{
    notifications: Notification[];
    onSelectChat: (chatId: string, isPersonal: boolean, messageId?: string) => void;
    onMarkAllRead?: () => void;
}> = ({ notifications, onSelectChat, onMarkAllRead }) => {

    // Logic for processing notifications
    const isPersonalNote = (note: Notification): boolean => {
        const type = note.type;
        const gId = note.groupId || '';
        return type === 'message' || type === 'reply' || type === 'follow_accept' || gId.includes('_');
    };

    const handleSelect = async (note: Notification) => {
        if (!note.read) await markAsRead(note.id);

        if (note.senderName === 'System' || note.type === 'follow_request') {
            return;
        }

        const chatId = note.groupId;
        if (chatId) {
            onSelectChat(chatId, isPersonalNote(note), note.messageId);
        }
    };

    const tenMins = 10 * 60 * 1000;
    const now = Date.now();

    const followReqFilter = (n: Notification) =>
        n.type === 'follow_request' && (!n.read || (n.updatedAt && now - n.updatedAt < tenMins));

    const recentActivityFilter = (n: Notification) => {
        if (n.type === 'follow_request') {
            return false;
        }
        return true;
    };

    return (
        <div className="flex flex-col h-full">
            <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b border-border/5">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold tracking-widest text-primary opacity-60 mb-1 uppercase">Notifications</span>
                    <h2 className="text-xl font-bold tracking-tight text-foreground leading-none">Activity</h2>
                </div>
                {onMarkAllRead && (
                    <button
                        onClick={onMarkAllRead}
                        className="p-2.5 rounded-xl bg-foreground/5 hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                        title="Mark all as read"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                <AnimatePresence mode="popLayout">
                    {notifications.filter(followReqFilter).length === 0 && notifications.filter(recentActivityFilter).length === 0 ? (
                        <div className="py-20 text-center opacity-20 flex flex-col items-center gap-6">
                            <div className="text-7xl drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">🔔</div>
                            <span className="text-[10px] font-bold tracking-widest uppercase">All caught up</span>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Pending Requests */}
                            {notifications.filter(followReqFilter).length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2 text-[9px] font-bold tracking-widest text-secondary opacity-60 uppercase">
                                        <span>Follow Requests</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                                    </div>
                                    {notifications
                                        .filter(followReqFilter)
                                        .map(note => (
                                            <FollowRequestItem key={note.id} note={note} onSelectPersonal={(id) => onSelectChat(id, true)} />
                                        ))}
                                </div>
                            )}

                            {/* Recent Activity */}
                            <div className="space-y-4">
                                {notifications.filter(recentActivityFilter).length > 0 && (
                                    <div className="px-2 text-[9px] font-bold tracking-widest text-primary opacity-40 uppercase">
                                        <span>Recent Activity</span>
                                    </div>
                                )}
                                {notifications
                                    .filter(recentActivityFilter)
                                    .map((note, index) => (
                                        <motion.div
                                            key={note.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{
                                                delay: index * 0.05,
                                                type: 'spring',
                                                damping: 20,
                                                stiffness: 100
                                            }}
                                            onClick={() => handleSelect(note)}
                                            className={`
                                                group relative p-4 rounded-3xl transition-all cursor-pointer border
                                                ${note.read
                                                    ? 'opacity-40 grayscale bg-foreground/5 border-transparent'
                                                    : 'bg-foreground/5 border-white/5 hover:border-primary/40 hover:bg-primary/5'}
                                            `}
                                        >
                                            <div className="flex gap-4 items-start">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110
                                                    ${note.type === 'mention' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        note.type === 'reply' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-foreground/5 text-muted-foreground border-white/5'}
                                                `}>
                                                    <IconForType type={note.type} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <span className="font-bold text-xs tracking-tight text-foreground/90">{note.senderName}</span>
                                                        <span className="text-[8px] font-bold opacity-30 tracking-widest uppercase">{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs font-medium line-clamp-2 text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                                                        {note.text}
                                                    </p>
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
                </AnimatePresence>
            </div>
        </div>
    );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose, onSelectChat }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        const unsubscribe = subscribeToNotifications(setNotifications);
        return () => unsubscribe();
    }, []);

    return (
        <div ref={containerRef} className="flex flex-col h-full glass-panel rounded-none md:rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5">
            <div className="flex items-center justify-end p-2 md:hidden">
                <button onClick={onClose} className="p-2"><X className="w-6 h-6" /></button>
            </div>
            <NotificationList
                notifications={notifications}
                onSelectChat={onSelectChat}
                onMarkAllRead={() => markAllAsRead()}
            />
        </div>
    );
};
