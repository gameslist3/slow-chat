import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        if (highlightId) {
            setTimeout(() => scrollToMessage(highlightId), 100);
        } else {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'} ${isSequence ? 'mt-[-1.5rem]' : 'mt-0'}`}
        >
            {/* Sender Label */}
            {!isSequence && (
                <div className={`flex items-center gap-3 mb-1 px-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <button
                        onClick={() => onUserClick(message.senderId)}
                        className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                    >
                        {message.sender}
                    </button>
                    <span className="text-[9px] font-bold text-muted-foreground/30">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )}

            <div className={`group relative flex gap-3 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar (Only if NOT sequence) */}
                {!isSequence ? (
                    <button
                        onClick={() => onUserClick(message.senderId)}
                        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black border transition-all
                            ${isOwn ? 'bg-white/5 border-white/10 text-white' : 'bg-primary/20 border-primary/30 text-primary'}
                        `}
                    >
                        {message.sender[0].toUpperCase()}
                    </button>
                ) : (
                    <div className="w-8 shrink-0" />
                )}

                <div className={`flex flex-col gap-2 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Reply Context */}
                    {message.replyTo && (
                        <button
                            onClick={() => onJumpToReply(message.replyTo!.messageId)}
                            className="text-[10px] flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10 transition-all mb-[-4px]"
                        >
                            <Icon name="message" className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{message.replyTo.text}</span>
                        </button>
                    )}

                    {/* Bubble */}
                    <div className={`
                        px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed border transition-all relative
                        ${isOwn
                            ? 'bg-primary text-white border-primary/20 rounded-tr-sm shadow-lg shadow-primary/10'
                            : 'bg-white/[0.03] text-white border-white/5 rounded-tl-sm'}
                    `}>
                        {message.type === 'text' && (
                            <div className="whitespace-pre-wrap break-words">
                                {message.text}
                            </div>
                        )}

                        {/* Media */}
                        {message.media && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                                {message.type === 'image' && <img src={message.media.url} className="max-h-96 w-auto" alt="" />}
                                {(message.type === 'audio' || message.media.type === 'audio') && <AudioPlayer src={message.media.url} />}
                                {(message.type === 'video' || message.media.type === 'video') && (
                                    <video src={message.media.url} controls className="max-h-96 w-full rounded-lg" />
                                )}
                            </div>
                        )}

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                            <div className={`absolute -bottom-2 flex gap-1 ${isOwn ? 'right-2' : 'left-2'}`}>
                                {message.reactions.map(r => (
                                    <div key={r.emoji} className="bg-[#0A0A0A] border border-white/10 rounded-full px-1.5 py-0.5 text-[11px] flex items-center gap-1 shadow-xl">
                                        <span>{r.emoji}</span>
                                        <span className="text-[9px] font-black opacity-40">{r.userIds.length}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Hover Actions */}
                    <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        <button onClick={onReply} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                            <Icon name="message" className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <ReactionButton onReact={onReaction} />
                    </div>
                </div>
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
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl min-w-[200px]">
            <button onClick={() => { if (playing) audioRef.current?.pause(); else audioRef.current?.play(); setPlaying(!playing); }} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <Icon name={playing ? "pause" : "play"} className="w-4 h-4" />
            </button>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '30%' }} />
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
