import React, { useRef, useEffect, useState } from 'react';
import { Icon } from '../common/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Reaction, User as InternalUser } from '../../types';
import { getUserById } from '../../services/firebaseAuthService';
import { sendFollowRequest, getFollowStatus, cancelFollowRequest, unfollowUser } from '../../services/firebaseFollowService';
import { useToast } from '../../context/ToastContext';

interface AIMessageListProps {
    messages: Message[];
    currentUserId: string;
    highlightId?: string;
    onReply?: (msg: Message) => void;
    onReaction?: (messageId: string, emoji: string) => void;
}

export const AIMessageList: React.FC<AIMessageListProps> = ({
    messages,
    currentUserId,
    highlightId,
    onReply,
    onReaction
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const scrollToMessage = (id: string) => {
        const el = document.getElementById(`msg-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('pulse-highlight');
            setTimeout(() => el.classList.remove('pulse-highlight'), 3000);
        }
    };

    useEffect(() => {
        if (highlightId) {
            setTimeout(() => scrollToMessage(highlightId), 100);
        } else {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, highlightId]);

    return (
        <div className="flex-1 overflow-y-auto py-8 space-y-12 px-4 md:px-6 custom-scrollbar relative overscroll-contain">
            {messages.map((msg) => (
                <MessageItem
                    key={msg.id}
                    message={msg}
                    isOwn={msg.senderId === currentUserId}
                    onReply={() => onReply?.(msg)}
                    onReaction={(emoji) => onReaction?.(msg.id, emoji)}
                    onJumpToReply={scrollToMessage}
                    onUserClick={(uid) => setSelectedUser(uid)}
                />
            ))}
            <div ref={bottomRef} className="h-4" />

            {/* Profile Overlay - Rendered inside but positioned fixed */}
            <AnimatePresence>
                {selectedUser && (
                    <UserProfileCard
                        userId={selectedUser}
                        currentUserId={currentUserId}
                        onClose={() => setSelectedUser(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const MessageItem = ({
    message,
    isOwn,
    onReply,
    onReaction,
    onJumpToReply,
    onUserClick
}: {
    message: Message,
    isOwn: boolean,
    onReply: () => void,
    onReaction: (emoji: string) => void,
    onJumpToReply: (id: string) => void,
    onUserClick: (uid: string) => void
}) => {
    const getAvatarColor = (id: string) => {
        const colors = ['bg-primary', 'bg-secondary', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
        let hash = 0;
        for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <motion.div
            id={`msg-${message.id}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group flex flex-col gap-3 px-2 md:px-6 transition-all duration-700`}
        >
            <div className={`max-w-4xl mx-auto w-full flex gap-4 md:gap-6 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <button
                    onClick={() => onUserClick(message.senderId)}
                    className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
                        ${isOwn ? 'bg-surface border-border text-foreground hover:border-primary/30' : `${getAvatarColor(message.senderId)} border-white/20 text-white shadow-lg`}
                    `}
                >
                    {isOwn ? <Icon name="user" className="w-5 h-5" /> : <span className="font-black text-xs">{message.sender.slice(0, 2).toUpperCase()}</span>}
                </button>

                <div className={`flex-1 min-w-0 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Header */}
                    <div className={`flex items-center gap-3 mb-2 animate-in fade-in duration-1000 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <button
                            onClick={() => onUserClick(message.senderId)}
                            className="font-protocol text-[9px] uppercase tracking-[0.34em] text-primary opacity-40 hover:opacity-100 transition-opacity"
                        >
                            {message.sender}
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold opacity-20 font-protocol tracking-widest mt-0.5">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOwn && message.status && <StatusIcon status={message.status} />}
                        </div>
                    </div>

                    {/* Bubble Container */}
                    <div className="relative flex flex-col gap-2 max-w-[95%] md:max-w-prose group/bubble">
                        {/* Reply Preview inside bubble */}
                        {message.replyTo && (
                            <div
                                onClick={() => onJumpToReply(message.replyTo!.messageId)}
                                className={`cursor-pointer glass-card p-4 rounded-2xl mb-1 text-xs transition-all hover:bg-foreground/5 ${isOwn ? 'text-right' : 'text-left'}`}
                            >
                                <p className="font-protocol text-[9px] text-primary tracking-[0.2em] mb-1 italic">{message.replyTo.sender}</p>
                                <p className="text-muted-foreground truncate opacity-70 font-medium">{message.replyTo.text}</p>
                            </div>
                        )}

                        <div className={`
                            text-[15px] leading-relaxed shadow-sm p-5 rounded-[2rem] border transition-all duration-500 relative glass-card
                            ${isOwn ? 'text-right rounded-tr-sm' : 'text-left rounded-tl-sm'}
                        `}>
                            {message.type === 'text' && (
                                <div className="markdown-content font-medium opacity-90 whitespace-pre-wrap break-words">
                                    {message.text?.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                                        part.match(/^https?:\/\//) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-70">{part}</a> : part
                                    )}
                                </div>
                            )}

                            {/* Media Rendering */}
                            {message.media && (
                                <div className={`space-y-4 ${isOwn ? 'flex flex-col items-end' : ''}`}>
                                    {message.type === 'image' && (
                                        <div className="relative group/img overflow-hidden rounded-2xl border border-border/10">
                                            <img src={message.media.url} alt={message.media.name} className="max-h-[500px] w-auto transition-transform duration-700 group-hover/img:scale-105" />
                                        </div>
                                    )}
                                    {message.type === 'video' && (
                                        <video src={message.media.url} controls className="rounded-2xl max-h-[500px] w-full shadow-ui border border-border/10" />
                                    )}
                                    {message.type === 'audio' && (
                                        <AudioPlayer src={message.media.url} isOwn={isOwn} />
                                    )}
                                    {['pdf', 'doc'].includes(message.type) && (
                                        <a href={message.media.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 glass-card bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all border border-border/10 group/file">
                                            <div className="w-12 h-12 bg-primary/10 rounded-[1rem] flex items-center justify-center text-primary transition-transform group-hover/file:scale-110"><Icon name="file" className="w-6 h-6" /></div>
                                            <div className="flex-1 text-left">
                                                <p className="font-protocol text-[10px] tracking-tight truncate max-w-[220px] uppercase">{message.media.name}</p>
                                                <p className="text-[9px] opacity-40 uppercase font-black tracking-widest mt-0.5">{Math.round(message.media.size / 1024)} KB • {message.type}</p>
                                            </div>
                                            <Icon name="clock" className="w-4 h-4 opacity-20 group-hover/file:opacity-100 transition-opacity" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* WhatsApp Style Reactions Overlay */}
                            {message.reactions && message.reactions.length > 0 && (
                                <div className={`absolute -bottom-3 flex flex-wrap gap-1 ${isOwn ? 'right-4' : 'left-4'}`}>
                                    {message.reactions.map((r: Reaction) => (
                                        <button
                                            key={r.emoji}
                                            onClick={() => onReaction(r.emoji)}
                                            className="h-7 px-2 flex items-center gap-1.5 glass-card shadow-xl rounded-full text-[13px] hover:border-primary/50 transition-all font-bold"
                                        >
                                            <span className="scale-110">{r.emoji}</span>
                                            <span className="text-[10px] opacity-60 font-protocol">{r.userIds.length}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Interaction Bar */}
                        <div className={`flex items-center gap-2 transition-all opacity-0 group-hover/bubble:opacity-100 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <ReactionButton onReact={onReaction} isOwn={isOwn} />
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onReply}
                                className="w-9 h-9 rounded-xl glass-card text-muted-foreground flex items-center justify-center transition-all hover:text-primary"
                                title="Reply"
                            >
                                <Icon name="message" className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const StatusIcon = ({ status }: { status: 'sent' | 'delivered' | 'seen' }) => {
    if (status === 'sent') return <Icon name="check" className="w-3 h-3 opacity-20" />;
    if (status === 'delivered') return <Icon name="checkCheck" className="w-3 h-3 opacity-20" />;
    if (status === 'seen') return <Icon name="checkCheck" className="w-3 h-3 text-secondary" />;
    return null;
};

const ReactionButton = ({ onReact, isOwn }: { onReact: (e: string) => void, isOwn: boolean }) => {
    const [open, setOpen] = useState(false);
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '⚡'];

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-lg hover:bg-surface2 text-muted-foreground flex items-center justify-center transition-all hover:text-primary" title="React">
                <Icon name="thumbsUp" className="w-4 h-4" />
            </button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-[110]" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className={`absolute z-[120] flex gap-1 p-1 bg-surface border border-border shadow-2xl rounded-2xl backdrop-blur-3xl
                                ${isOwn ? 'right-0 -top-12' : 'left-0 -top-12'}
                                whitespace-nowrap
                            `}
                        >
                            {emojis.map(e => (
                                <button
                                    key={e}
                                    onClick={() => { onReact(e); setOpen(false); }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-primary/10 rounded-xl text-xl transition-all hover:scale-125 active:scale-95"
                                >
                                    {e}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const AudioPlayer = ({ src, isOwn }: { src: string, isOwn: boolean }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [progress, setProgress] = useState(0);

    const toggle = () => {
        if (!audioRef.current) return;
        if (playing) audioRef.current.pause();
        else audioRef.current.play();
        setPlaying(!playing);
    };

    return (
        <div className={`flex items-center gap-4 p-4 bg-muted/40 rounded-[1.5rem] min-w-[240px] border border-border/20 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <button onClick={toggle} className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-all group/play">
                {playing ? <Icon name="pause" className="w-6 h-6" /> : <Icon name="play" className="w-6 h-6 ml-1 group-hover/play:scale-110 transition-transform" />}
            </button>
            <div className="flex-1 space-y-2">
                <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary"
                    />
                </div>
                <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-40 italic">
                    <span>{playing ? 'Playing' : 'Voice Message'}</span>
                    <span>HD Audio</span>
                </div>
            </div>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={(e) => setProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)}
                onEnded={() => setPlaying(false)}
                className="hidden"
            />
        </div>
    );
};

// --- Profile Card ---
const UserProfileCard = ({ userId, currentUserId, onClose }: { userId: string, currentUserId: string, onClose: () => void }) => {
    const [profile, setProfile] = useState<InternalUser | null>(null);
    const [status, setStatus] = useState<'none' | 'pending' | 'accepted' | 'cooldown'>('none');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [u, s] = await Promise.all([
                    getUserById(userId),
                    getFollowStatus(userId)
                ]);
                setProfile(u);
                setStatus(s as any);
            } catch (err: any) {
                console.error('[ProfileCard] Load error:', err);
                toast('Failed to load user profile.', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    const handleFollow = async () => {
        if (!profile || actionLoading) return;

        if (status === 'cooldown') {
            toast("Connection protocol resetting. Please wait.", "info");
            return;
        }

        if (status === 'pending') {
            // Cancel request (Optimistic)
            const prevStatus = status;
            setStatus('none');
            toast(`Connection protocol withdrawn.`, 'info');
            try {
                await cancelFollowRequest(profile.id);
            } catch (err: any) {
                setStatus(prevStatus);
                toast(err.message || "Failed to withdraw request", 'error');
            }
            return;
        }

        if (status !== 'none') return;

        // Follow (Optimistic)
        setStatus('pending');
        toast(`Connection request sent to ${profile.username}`, 'success');
        try {
            await sendFollowRequest(profile.id, profile.username);
        } catch (err: any) {
            // Check if it was a cooldown error
            if (err.message.includes('Protocol reset')) {
                setStatus('cooldown');
            } else {
                setStatus('none');
            }
            toast(err.message || "Failed to send request", 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/60 backdrop-blur-3xl"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="ui-card w-full max-w-[90vw] md:max-w-sm relative z-[1000] p-6 md:p-8 text-center space-y-8 border shadow-2xl bg-surface/90 backdrop-blur-2xl rounded-[3rem] overflow-hidden"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-surface2 rounded-full transition-all"
                >
                    <Icon name="x" className="w-5 h-5" />
                </button>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Icon name="rotate" className="w-10 h-10 animate-spin text-primary opacity-50" />
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-30">Fetching Identity...</p>
                    </div>
                ) : profile ? (
                    <>
                        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary font-black text-4xl shadow-xl mx-auto mb-4 border border-primary/20">
                            {profile.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic">{profile.username}</h3>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40 italic">SlowChat Member</p>
                        </div>

                        {userId !== currentUserId && (
                            <div className="pt-4">
                                <button
                                    onClick={handleFollow}
                                    disabled={actionLoading || status === 'accepted' || status === 'cooldown'}
                                    className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all shadow-lg
                                        ${status === 'accepted' ? 'bg-secondary/10 text-secondary border border-secondary/20 shadow-none' :
                                            status === 'pending' ? 'bg-surface2 text-primary border border-primary/20 hover:bg-surface2/80 active:scale-95 shadow-none' :
                                                status === 'cooldown' ? 'bg-destructive/10 text-destructive border border-destructive/20 shadow-none opacity-50' :
                                                    'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20 hover:shadow-primary/40'}
                                    `}
                                >
                                    {status === 'accepted' ? <Icon name="check" className="w-5 h-5" /> :
                                        status === 'pending' ? <Icon name="rotate" className="w-5 h-5 animate-spin" /> :
                                            status === 'cooldown' ? <Icon name="clock" className="w-5 h-5" /> :
                                                <Icon name="userPlus" className="w-5 h-5" />}

                                    {status === 'accepted' ? 'Connected' :
                                        status === 'pending' ? 'Requested' :
                                            status === 'cooldown' ? 'Wait' :
                                                'Follow'}
                                </button>
                                {status === 'accepted' && (
                                    <button
                                        onClick={async () => {
                                            if (!profile || actionLoading) return;
                                            setActionLoading(true);
                                            try {
                                                await unfollowUser(profile.id);
                                                setStatus('none');
                                                toast(`Connection with ${profile.username} terminated.`, 'info');
                                            } catch (err: any) {
                                                toast(err.message || "Failed to terminate sync", 'error');
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        disabled={actionLoading}
                                        className="w-full h-12 mt-3 rounded-2xl bg-destructive/5 text-destructive border border-destructive/10 hover:bg-destructive/10 text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        TERMINATE SYNC
                                    </button>
                                )}
                                {status === 'pending' && (
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-3 italic animate-pulse">Click to withdraw protocol</p>
                                )}
                                {status === 'cooldown' && (
                                    <p className="text-[9px] font-black uppercase tracking-widest text-destructive opacity-40 mt-3 italic">Protocol reset in progress</p>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Icon name="x" className="w-10 h-10 text-danger opacity-20" />
                        <p className="text-muted-foreground italic uppercase font-black tracking-widest opacity-40">Identity Not Located</p>
                        <button onClick={onClose} className="ui-button-ghost text-[10px] font-black uppercase tracking-widest">Close</button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
