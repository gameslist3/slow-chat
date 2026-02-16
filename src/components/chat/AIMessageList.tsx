import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { Message, Reaction, User as InternalUser } from '../../types';
import { getUserById } from '../../services/firebaseAuthService';
import { sendFollowRequest, getFollowStatus, cancelFollowRequest, unfollowUser } from '../../services/firebaseFollowService';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../common/Icon';

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
            setTimeout(() => el.classList.remove('pulse-highlight'), 2000);
        }
    };

    useEffect(() => {
        // Auto-scroll on new message
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, highlightId]);

    return (
        <div className="flex-1 overflow-y-auto pt-4 pb-24 px-4 md:px-8 custom-scrollbar relative scroll-smooth">
            <div className="max-w-4xl mx-auto space-y-8">
                {messages.map((msg, idx) => {
                    const prevMsg = messages[idx - 1];
                    const isSequence = prevMsg && prevMsg.senderId === msg.senderId && (msg.timestamp - prevMsg.timestamp < 300000);

                    return (
                        <MessageItem
                            key={msg.id}
                            message={msg}
                            isOwn={msg.senderId === currentUserId}
                            isSequence={isSequence}
                            onReply={() => onReply?.(msg)}
                            onReaction={(emoji) => onReaction?.(msg.id, emoji)}
                            onJumpToReply={scrollToMessage}
                            onUserClick={(uid) => setSelectedUser(uid)}
                        />
                    );
                })}
            </div>
            <div ref={bottomRef} className="h-4" />

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
    isSequence,
    onReply,
    onReaction,
    onJumpToReply,
    onUserClick
}: {
    message: Message,
    isOwn: boolean,
    isSequence: boolean,
    onReply: () => void,
    onReaction: (emoji: string) => void,
    onJumpToReply: (id: string) => void,
    onUserClick: (uid: string) => void
}) => {
    return (
        <motion.div
            id={`msg-${message.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-3 ${isSequence ? 'mt-2' : 'mt-6'} relative group px-2 md:px-0`}
        >
            {/* Avatar (Incoming Only) */}
            {!isOwn && !isSequence && (
                <button
                    onClick={() => onUserClick(message.senderId)}
                    className="shrink-0 w-8 h-8 rounded-full bg-[#FFFFFF0D] border border-[#FFFFFF1F] flex items-center justify-center text-xs font-bold text-[#E6ECFF] hover:border-[#7FA6FF]/50 transition-colors self-end"
                >
                    {message.sender?.[0]?.toUpperCase() || 'U'}
                </button>
            )}

            {/* Spacer for sequence messages without avatar */}
            {!isOwn && isSequence && <div className="w-8 shrink-0" />}

            <div className={`relative max-w-[75%] md:max-w-[60%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Sender Name (Incoming, non-sequence) */}
                {!isOwn && !isSequence && (
                    <span className="ml-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#7FA6FF]/80">
                        {message.sender}
                    </span>
                )}

                {/* Reply Context */}
                {message.replyTo && (
                    <button
                        onClick={() => onJumpToReply(message.replyTo!.messageId)}
                        className={`text-[10px] flex items-center gap-2 px-3 py-2 rounded-xl mb-1.5 transition-all border backdrop-blur-sm w-full
                            ${isOwn ? 'bg-[#5B79B7]/20 border-[#5B79B7]/30 text-[#E6ECFF]/80' : 'bg-white/5 border-white/10 text-[#A9B4D0]'}
                        `}
                    >
                        <div className="w-0.5 h-4 bg-[#7FA6FF]/50 rounded-full" />
                        <span className="truncate">{message.replyTo.text}</span>
                    </button>
                )}

                {/* Message Bubble */}
                <div className={`
                    relative px-4 py-3 shadow-lg text-[15px] leading-relaxed break-words flex flex-wrap gap-x-4 items-end backdrop-blur-xl
                    ${isOwn
                        ? 'bg-[#7FA6FF]/15 border border-[#7FA6FF]/10 text-white rounded-l-[1.5rem] rounded-tr-[1.5rem] rounded-br-[0.5rem] shadow-blue-500/5'
                        : 'bg-white/5 border border-white/5 text-[#E6ECFF] rounded-r-[1.5rem] rounded-tl-[1.5rem] rounded-bl-[0.5rem]'}
                `}>
                    {/* Message Content */}
                    <div className="z-10 relative flex-1">
                        {message.type === 'text' && (
                            <span className="whitespace-pre-wrap">{message.text}</span>
                        )}

                        {/* Media */}
                        {message.media && (
                            <div className="mt-2 mb-1 rounded-lg overflow-hidden">
                                {message.type === 'image' && <img src={message.media.url} className="max-h-80 w-auto object-cover rounded-lg" alt="" />}
                                {(message.type === 'audio' || message.media.type === 'audio') && <AudioPlayer src={message.media.url} />}
                                {(message.type === 'video' || message.media.type === 'video') && (
                                    <video src={message.media.url} controls className="max-h-80 w-full rounded-lg" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Metadata (Time + Ticks) */}
                    <div className={`flex items-center gap-1.5 shrink-0 select-none ml-auto h-[18px] self-end`}>
                        <span className={`text-[10px] font-medium ${isOwn ? 'text-[#E6ECFF]/60' : 'text-[#A9B4D0]/70'}`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && (
                            <span className="text-[#E6ECFF]/80">
                                {message.status === 'seen' || message.readBy?.length ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 opacity-60" />}
                            </span>
                        )}
                    </div>
                </div>

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                    <div className={`absolute -bottom-2.5 z-20 ${isOwn ? 'right-2' : 'left-2'}`}>
                        <div className="bg-[#0F1C34] border border-[#FFFFFF1F] rounded-full px-2 py-1 text-[10px] flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                            {message.reactions.map(r => (
                                <span key={r.emoji} className="leading-none flex items-center gap-0.5">
                                    {r.emoji} <span className="text-[9px] text-[#A9B4D0] font-bold">{r.userIds.length}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions (Hover) */}
            <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 ${isOwn ? 'left-auto right-full mr-3' : 'left-full ml-3'}`}>
                <button onClick={onReply} className="p-1.5 rounded-full bg-[#0F1C34] border border-[#FFFFFF1F] text-[#A9B4D0] hover:text-white hover:bg-[#5B79B7]/30 shadow-lg backdrop-blur-md transition-all">
                    <Icon name="message" className="w-4 h-4" />
                </button>
                <ReactionButton onReact={onReaction} />
            </div>
        </motion.div>
    );
};

const ReactionButton = ({ onReact }: { onReact: (e: string) => void }) => {
    const [open, setOpen] = useState(false);
    const emojis = ['👍', '❤️', '😂', '🔥', '👏'];

    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <Icon name="thumbsUp" className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full mb-2 left-0 flex gap-1 p-1 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl z-50"
                    >
                        {emojis.map(e => (
                            <button key={e} onClick={() => { onReact(e); setOpen(false); }} className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-125">
                                {e}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AudioPlayer = ({ src }: { src: string }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    return (
        <div className="flex items-center gap-3 p-2 min-w-[200px]">
            <button onClick={() => { if (playing) audioRef.current?.pause(); else audioRef.current?.play(); setPlaying(!playing); }} className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors">
                <Icon name={playing ? "pause" : "play"} className="w-4 h-4 fill-current" />
            </button>
            <div className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/80 animate-pulse" style={{ width: playing ? '60%' : '0%' }} />
            </div>
            <audio ref={audioRef} src={src} onEnded={() => setPlaying(false)} className="hidden" />
        </div>
    );
};

const UserProfileCard = ({ userId, currentUserId, onClose }: { userId: string, currentUserId: string, onClose: () => void }) => {
    const [profile, setProfile] = useState<InternalUser | null>(null);
    const [status, setStatus] = useState<'none' | 'pending' | 'accepted' | 'cooldown'>('none');
    const [loading, setLoading] = useState(true);
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
                toast('Identity failure.', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-sm bg-[#080808] border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl relative"
                onClick={e => e.stopPropagation()}
            >
                {loading ? <Icon name="rotate" className="w-10 h-10 animate-spin mx-auto opacity-20" /> : (
                    <>
                        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center text-primary text-3xl font-black mx-auto mb-6 border border-primary/30">
                            {profile?.username[0].toUpperCase()}
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">{profile?.username}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-1 mb-8">Decentralized Node Resident</p>

                        {userId !== currentUserId && (
                            <button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                                Establish Link
                            </button>
                        )}
                        <button onClick={onClose} className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-white transition-colors">Close</button>
                    </>
                )}
            </motion.div>
        </div>
    );
};
