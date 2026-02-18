import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { Message, Reaction, User as InternalUser } from '../../types';
import { getUserById } from '../../services/firebaseAuthService';
import { sendFollowRequest, getFollowStatus, cancelFollowRequest, unfollowUser } from '../../services/firebaseFollowService';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../common/Icon';
import { MessageBubble } from './MessageBubble';

interface AIMessageListProps {
    messages: Message[];
    currentUserId: string;
    highlightId?: string;
    onReply?: (msg: Message) => void;
    onReaction?: (messageId: string, emoji: string) => void;
    onProfileClick?: (userId: string) => void;
}

export const AIMessageList: React.FC<AIMessageListProps> = ({
    messages,
    currentUserId,
    highlightId,
    onReply,
    onReaction,
    onProfileClick
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
            scrollToMessage(highlightId);
        } else if (bottomRef.current) {
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
                            isSequence={isSequence}
                            onReply={() => onReply?.(msg)}
                            onReaction={(emoji) => onReaction?.(msg.id, emoji)}
                            onProfileClick={onProfileClick}
                        />
                    );
                })}
            </div>
            <div ref={bottomRef} className="h-4" />

            {/* We might remove this if we move it to App level, but keeping for now if used internally */}
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
    isSequence,
    onReply,
    onReaction,
    onProfileClick
}: {
    message: Message,
    isSequence: boolean,
    onReply: () => void,
    onReaction: (emoji: string) => void,
    onProfileClick?: (userId: string) => void
}) => {
    return (
        <div id={`msg-${message.id}`}>
            <MessageBubble
                message={message}
                isContinual={isSequence}
                onReact={onReaction}
                onReply={onReply}
                onProfileClick={onProfileClick}
            />
        </div>
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
