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
            // System notices or requests don't open chats directly
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-panel w-full max-w-lg relative z-10 p-0 overflow-hidden flex flex-col max-h-[80vh] border border-white/10"
            >
                <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                            <Bell className="w-5 h-5 animate-pulse" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-white/90">Notifications</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => markAllAsRead()}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all"
                        >
                            Mark all read
                        </button>
                        <button onClick={onClose} className="btn-ghost p-2 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <AnimatePresence mode="popLayout">
                        {notifications.length === 0 ? (
                            <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                                <div className="text-6xl drop-shadow-lg">🔔</div>
                                <p className="font-black uppercase tracking-[0.3em] text-[10px] text-white">No new notifications</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Connection Protocols Section */}
                                {notifications.filter(n => n.type === 'follow_request' && !n.read).length > 0 && (
                                    <div className="px-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3 pl-2 italic drop-shadow-md">Connection Protocols</h3>
                                        {notifications
                                            .filter(n => n.type === 'follow_request' && !n.read)
                                            .map(note => (
                                                <FollowRequestItem key={note.id} note={note} />
                                            ))}
                                    </div>
                                )}

                                {/* Standard Notifications Section */}
                                <div className="px-2 py-2">
                                    {notifications.filter(n => n.type !== 'follow_request' || n.read).length > 0 && (
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-3 pl-2">Recent Updates</h3>
                                    )}
                                    {notifications
                                        .filter(n => n.type !== 'follow_request' || n.read)
                                        .map(note => (
                                            <motion.div
                                                key={note.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                onClick={() => handleSelect(note)}
                                                className={`
                                                    group relative p-4 rounded-2xl transition-all cursor-pointer border mb-1 backdrop-blur-md
                                                    ${note.read
                                                        ? 'opacity-50 grayscale bg-white/5 border-transparent'
                                                        : 'glass-card border-white/10 hover:border-primary/30 hover:bg-white/10'}
                                                `}
                                            >
                                                <div className="flex gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/5
                                                        ${note.type === 'mention' ? 'bg-purple-500/20 text-purple-400' :
                                                            note.type === 'reply' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-white/5 text-muted-foreground'}
                                                    `}>
                                                        <IconForType type={note.type} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <span className="font-black text-xs uppercase tracking-tight text-white/90">{note.senderName}</span>
                                                            <span className="text-[9px] font-black opacity-30 uppercase">{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-sm font-medium line-clamp-2 text-muted-foreground leading-snug group-hover:text-white/80 transition-colors">
                                                            {note.text}
                                                        </p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Zap className="w-4 h-4 text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                    </div>
                                                </div>
                                                {!note.read && (
                                                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
                                                )}
                                            </motion.div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
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
            if (snap.empty) throw new Error("Request no longer exists");

            const requestId = snap.docs[0].id;

            if (action === 'accept') {
                await acceptFollowRequest(requestId);
                toast(`Connection established with ${note.senderName}`, 'success');
            } else {
                await declineFollowRequest(requestId);
                toast(`Request declined`, 'info');
            }

            await markAsRead(note.id);
        } catch (err: any) {
            toast(err.message || "Action failed", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-5 rounded-3xl glass-card border border-primary/20 shadow-[0_0_30px_-10px_rgba(59,130,246,0.2)] mb-3 space-y-4 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-20" />

            <div className="flex gap-4 items-center relative z-10">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg border border-white/20">
                    {note.senderName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-tight text-white">{note.senderName}</p>
                    <p className="text-xs text-primary font-bold italic tracking-wide">Sent a connection protocol</p>
                </div>
            </div>
            <div className="flex gap-2 relative z-10">
                <button
                    onClick={() => handleAction('accept')}
                    disabled={loading}
                    className="flex-1 h-11 btn-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? 'Processing...' : '✅ Accept'}
                </button>
                <button
                    onClick={() => handleAction('decline')}
                    disabled={loading}
                    className="flex-1 h-11 btn-danger text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? '...' : '❌ Decline'}
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
