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
            onClose();
        } else if (note.type === 'message') {
            onClose();
        }
    };

    return (
        <div ref={containerRef} className="flex flex-col h-full glass-panel rounded-none md:rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5">
            <header className="px-6 md:px-8 py-5 md:py-6 border-b border-white/5 flex items-center justify-between bg-foreground/5 backdrop-blur-3xl">
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold tracking-widest text-primary opacity-60 mb-1 uppercase">Notifications</span>
                    <h2 className="text-xl font-bold tracking-tight text-foreground leading-none">Activity</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => markAllAsRead()}
                        className="p-2.5 rounded-xl bg-foreground/5 hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                        title="Mark all as read"
                    >
                        <RotateCw className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2.5 rounded-xl bg-foreground/5 hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"><X className="w-5 h-5" /></button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-8">
                <AnimatePresence mode="popLayout">
                    {/* Filter out read notifications */}
                    {notifications.filter(n => !n.read).length === 0 ? (
                        <div className="py-20 text-center opacity-20 flex flex-col items-center gap-6">
                            <div className="text-7xl drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">🔔</div>
                            <span className="text-[10px] font-bold tracking-widest uppercase">All caught up</span>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Pending Requests */}
                            {notifications.filter(n => n.type === 'follow_request' && !n.read).length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2 text-[9px] font-bold tracking-widest text-secondary opacity-60 uppercase">
                                        <span>Follow Requests</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                                    </div>
                                    {notifications
                                        .filter(n => n.type === 'follow_request' && !n.read)
                                        .map(note => (
                                            <FollowRequestItem key={note.id} note={note} />
                                        ))}
                                </div>
                            )}

                            {/* Recent Activity */}
                            <div className="space-y-4">
                                {notifications.filter(n => n.type !== 'follow_request' || n.read).length > 0 && (
                                    <div className="px-2 text-[9px] font-bold tracking-widest text-primary opacity-40 uppercase">
                                        <span>Recent Activity</span>
                                    </div>
                                )}
                                {notifications
                                    .filter(n => n.type !== 'follow_request' || n.read)
                                    .map(note => (
                                        <motion.div
                                            key={note.id}
                                            layout
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            onClick={() => handleSelect(note)}
                                            className={`
                                                group relative p-4 md:p-5 rounded-3xl transition-all cursor-pointer border
                                                ${note.read
                                                    ? 'opacity-40 grayscale bg-foreground/5 border-transparent'
                                                    : 'bg-foreground/5 border-white/5 hover:border-primary/40 hover:bg-primary/5'}
                                            `}
                                        >
                                            <div className="flex gap-4 md:gap-5 items-start">
                                                <div className={`w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110
                                                    ${note.type === 'mention' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        note.type === 'reply' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-foreground/5 text-muted-foreground border-white/5'}
                                                `}>
                                                    <IconForType type={note.type} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                        <span className="font-bold text-sm tracking-tight text-foreground/90">{note.senderName}</span>
                                                        <span className="text-[8px] font-bold opacity-30 tracking-widest uppercase">{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-sm font-medium line-clamp-2 text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                                                        {note.text}
                                                    </p>
                                                </div>
                                            </div>
                                            {!note.read && (
                                                <div className="absolute top-5 right-5 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),1)]" />
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

const FollowRequestItem = ({ note }: { note: Notification }) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAction = async (action: 'accept' | 'decline') => {
        setLoading(true);
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
            if (snap.empty) throw new Error("Request no longer valid");

            const requestId = snap.docs[0].id;

            if (action === 'accept') {
                await acceptFollowRequest(requestId);
                toast(`You follow ${note.senderName}`, 'success');
            } else {
                await declineFollowRequest(requestId);
                toast(`Request declined`, 'info');
            }

            await markAsRead(note.id);
        } catch (err: any) {
            toast(err.message || "Something went wrong", 'error');
        } finally {
            setLoading(false);
        }
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
                    <p className="text-[9px] font-bold text-secondary tracking-widest uppercase opacity-70 mt-1">Follow Request</p>
                </div>
            </div>
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
        </motion.div>
    );
};

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
