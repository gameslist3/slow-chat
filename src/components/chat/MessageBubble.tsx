import React from 'react';
import { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Reply, File, Download, Play, Pause, Music, Film, Check, CheckCheck } from 'lucide-react';
import { GroupInviteCard } from './GroupInviteCard';
import { EncryptedMedia } from './EncryptedMedia';

interface MessageBubbleProps {
    message: Message;
    isContinual?: boolean; // If previous message was same sender
    onReact: (emoji: string) => void;
    onReply: () => void;
    onProfileClick?: (userId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isContinual, onReact, onReply, onProfileClick }) => {
    const { user } = useAuth();
    const isMe = message.senderId === user?.id;

    // Detect internal group links
    const groupLinkRegex = /\/chat\/([a-f0-9-]{36}|nexus-[a-z-]+|system-updates)/i;
    const groupLinkMatch = message.text?.match(groupLinkRegex);
    const linkedGroupId = groupLinkMatch ? groupLinkMatch[1] : null;

    // Helper to format time safely
    const formatTime = (ts: any) => {
        if (!ts) return '...';
        if (typeof ts === 'number') return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (ts?.toDate) return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return '...';
    };

    return (
        <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-${isContinual ? '1' : '4'} group relative animate-in fade-in slide-in-from-bottom-2 duration-300`}>

            {/* Avatar (Left) - Only if not continual */}
            {!isMe && (
                <div className={`w-10 h-10 mr-4 flex-shrink-0 ${isContinual ? 'opacity-0' : ''}`}>
                    {!isContinual && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onProfileClick?.(message.senderId); }}
                            className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 shadow-sm uppercase tracking-tighter hover:scale-105 transition-transform"
                        >
                            {message.sender.slice(0, 2)}
                        </button>
                    )}
                </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group/bubble shrink-0`}>
                {!isMe && !isContinual && (
                    <span className="text-[10px] font-bold text-primary/80 ml-1.5 mb-1">{message.sender}</span>
                )}

                {/* Reply Context - WhatsApp Style */}
                {message.replyTo && (
                    <div className={`
                        mb-1 text-xs mx-1 rounded-lg overflow-hidden flex cursor-pointer hover:bg-black/10 transition-colors relative shadow-sm
                        ${isMe ? 'bg-black/10' : 'bg-black/5'}
                    `}>
                        <div className="w-1 bg-[#7FA6FF] shrink-0" />
                        <div className="px-2.5 py-2 flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-[#7FA6FF] mb-0.5">
                                {message.replyTo.sender || 'Unknown'}
                            </div>
                            <div className="text-white/60 truncate text-[11px]">
                                {message.replyTo.text || 'Photo'}
                            </div>
                        </div>
                    </div>
                )}

                <div className={`
                    relative px-3.5 py-2 text-[15px] leading-snug break-words shadow-sm overflow-hidden flex flex-col
                    ${isMe
                        ? 'bg-[rgba(127,166,255,0.18)] text-[#E6ECFF] rounded-2xl rounded-tr-sm'
                        : 'bg-[rgba(255,255,255,0.08)] text-[#E6ECFF] rounded-2xl rounded-tl-sm'
                    }
                    ${message.type === 'image' || message.type === 'video' ? 'p-1 bg-transparent border-0 shadow-none' : ''}
                `}>
                    {message.type === 'text' && (
                        <div className="max-w-full">
                            <div className="mb-2 whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
                                {message.text}
                            </div>
                            {linkedGroupId && (
                                <div className="mt-3 mb-1">
                                    <GroupInviteCard groupId={linkedGroupId} />
                                </div>
                            )}
                        </div>
                    )}

                    {message.type === 'audio' && message.media && (
                        !message.media.encKey ? (
                            <div className="flex items-center gap-3 bg-white/5 py-3 px-4 rounded-xl w-full min-w-[220px] sm:min-w-[280px]">
                                <AudioPlayer url={message.media.url} name={message.media.name} />
                            </div>
                        ) : (
                            <EncryptedMedia
                                media={message.media}
                                type="audio"
                                render={(url) => (
                                    <div className="flex items-center gap-3 bg-white/5 py-3 px-4 rounded-xl w-full min-w-[220px] sm:min-w-[280px]">
                                        <AudioPlayer url={url} name={message.media?.name || 'VOICE_NOTE'} />
                                    </div>
                                )}
                            />
                        )
                    )}

                    {(message.type === 'image' || message.type === 'video') && message.media && (
                        !message.media.encKey ? (
                            <MediaRenderer url={message.media.url} type={message.type} name={message.media.name} />
                        ) : (
                            <EncryptedMedia
                                media={message.media}
                                type={message.type}
                                render={(url) => (
                                    <MediaRenderer url={url} type={message.type} name={message.media?.name} />
                                )}
                            />
                        )
                    )}

                    {message.type === 'file' && message.media && (
                        !message.media.encKey ? (
                            <FileRenderer url={message.media.url} name={message.media.name} size={message.media.size} />
                        ) : (
                            <EncryptedMedia
                                media={message.media}
                                type="file"
                                render={(url) => (
                                    <FileRenderer url={url} name={message.media?.name} size={message.media?.size} />
                                )}
                            />
                        )
                    )}

                    <div className={`mt-1 flex items-center gap-1 ${isMe ? 'self-end' : 'self-start'}`}>
                        <span className={`text-[10px] font-medium opacity-60 ${isMe ? 'text-[#E6ECFF]' : 'text-[#A9B4D0]'}`}>
                            {formatTime(message.timestamp)}
                        </span>
                        {isMe && (message.status === 'sending' || message.status === 'sent') && (
                            <div className={`opacity-60 text-white flex items-center justify-center ${message.status === 'sending' ? 'animate-pulse' : ''}`}>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                        )}
                        {isMe && message.status === 'delivered' && (
                            <div className="opacity-60 text-white flex items-center justify-center -ml-0.5">
                                <CheckCheck className="w-[15px] h-[15px] stroke-[3]" />
                            </div>
                        )}
                        {isMe && message.status === 'seen' && (
                            <div className="text-[#3B82F6] flex items-center justify-center -ml-0.5">
                                <CheckCheck className="w-[15px] h-[15px] stroke-[3]" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 z-10 ${isMe ? 'justify-end mr-1' : 'justify-start ml-1'}`}>
                        {message.reactions.map((r, i) => (
                            <span key={i} className="bg-[#0F1C34] border border-white/10 shadow-sm rounded-full px-1.5 py-0.5 text-[10px] animate-in zoom-in text-white/90">
                                {r.emoji}
                            </span>
                        ))}
                    </div>
                )}

                {/* Action Bar (Anchored to Bubble) */}
                <div className={`
                    absolute -top-7 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex gap-1 z-20 
                    scale-90 group-hover/bubble:scale-100 origin-bottom
                    ${isMe ? 'right-0' : 'left-0'}
                `}>
                    <div className="flex items-center gap-1 bg-[#0F1C34]/90 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-xl">
                        {['❤️', '😂', '😮', '😢'].map(emoji => (
                            <button
                                key={emoji}
                                className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-sm transition-transform hover:scale-110 active:scale-90"
                                onClick={() => onReact(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                        <div className="w-px h-3 bg-white/10 mx-0.5" />
                        <button
                            className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            onClick={onReply}
                        >
                            <Reply className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AudioPlayer = ({ url, name }: { url: string; name?: string }) => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [duration, setDuration] = React.useState('0:00');
    const audioRef = React.useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) audioRef.current.play();
        else audioRef.current.pause();
    };

    return (
        <>
            <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform shrink-0"
            >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>

            <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-end gap-[2px] h-6 w-full opacity-60">
                    {[30, 60, 45, 80, 50, 70, 40, 90, 65, 55, 75, 45, 85, 60, 50, 70, 40, 80, 55, 65].map((h, i) => (
                        <div
                            key={i}
                            className={`w-[2px] bg-white rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                            style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-white/50 tracking-widest">
                    <span>{name ? name.toUpperCase().slice(0, 15) : 'VOICE_NOTE'}</span>
                    <span>{duration}</span>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={url}
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (isFinite(d)) {
                        const m = Math.floor(d / 60);
                        const s = Math.floor(d % 60);
                        setDuration(`${m}:${s < 10 ? '0' : ''}${s}`);
                    }
                }}
                className="hidden"
            />
        </>
    );
};

const MediaRenderer = ({ url, type, name }: { url: string; type: string; name?: string }) => {
    if (type === 'image') {
        return (
            <div className="relative group/media overflow-hidden rounded-2xl shadow-2xl border border-white/5">
                <img src={url} alt="media" className="max-h-72 w-full object-cover transition-transform duration-500 group-hover/media:scale-105" />
                <div className="absolute inset-0 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[4px] bg-black/40 z-10">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2.5 bg-white text-black rounded-full font-black text-[10px] tracking-widest uppercase hover:scale-105 transition-transform shadow-2xl flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download className="w-4 h-4" /> View Full
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/5 bg-[#0B1221]">
            <video src={url} controls preload="metadata" className="max-h-72 w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
    );
};

const FileRenderer = ({ url, name, size }: { url: string; name?: string; size?: number }) => (
    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl w-full min-w-[220px] sm:min-w-[280px] hover:bg-white/10 transition-colors">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <File className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 pr-2">
            <div className="text-sm font-semibold truncate text-[#E6ECFF] mb-0.5">{name}</div>
            <div className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">
                {(size || 0) / 1024 > 1024
                    ? `${((size || 0) / (1024 * 1024)).toFixed(1)} MB`
                    : `${((size || 0) / 1024).toFixed(0)} KB`}
            </div>
        </div>
        <a
            href={url}
            download={name || 'file'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-black/20 hover:bg-primary hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
            onClick={(e) => e.stopPropagation()}
        >
            <Download className="w-4 h-4" />
        </a>
    </div>
);
