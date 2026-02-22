import React from 'react';
import { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Reply } from 'lucide-react';
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
    const isMe = message.sender === user?.username;

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

            <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'} relative group/bubble`}>
                {!isMe && !isContinual && (
                    <span className="text-[9px] uppercase font-black text-primary/60 ml-1 mb-1.5 tracking-[0.2em]">{message.sender}</span>
                )}

                {/* Reply Context - WhatsApp Style */}
                {message.replyTo && (
                    <div className={`
                        mb-1 text-xs mx-1 rounded-lg overflow-hidden flex cursor-pointer hover:bg-black/5 transition-colors relative
                        ${isMe ? 'bg-black/10' : 'bg-black/5'}
                    `}>
                        <div className="w-1 bg-[#7FA6FF] shrink-0" />
                        <div className="px-2 py-1.5 flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-[#7FA6FF] mb-0.5">
                                {message.replyTo.sender || 'Unknown'}
                            </div>
                            <div className="text-gray-400 truncate">
                                {message.replyTo.text || 'Photo'}
                            </div>
                        </div>
                    </div>
                )}

                <div className={`
                    relative px-5 py-3 text-[15px] font-medium leading-relaxed tracking-wide break-words overflow-hidden shadow-lg
                    ${isMe
                        ? 'bg-[rgba(127,166,255,0.18)] text-[#E6ECFF] rounded-[1.25rem] rounded-tr-sm border border-white/5'
                        : 'bg-[rgba(255,255,255,0.05)] text-[#E6ECFF] rounded-[1.25rem] rounded-tl-sm border border-white/5'
                    }
                    ${message.type === 'image' || message.type === 'video' ? 'p-1 bg-transparent border-0 shadow-none' : ''}
                `}>
                    {message.type === 'text' && (
                        <div className="max-w-full">
                            <div className="mb-2">{message.text}</div>
                            {linkedGroupId && (
                                <div className="mt-3 mb-1">
                                    <GroupInviteCard groupId={linkedGroupId} />
                                </div>
                            )}
                        </div>
                    )}

                    {message.type === 'audio' && message.media && (
                        <EncryptedMedia
                            media={message.media}
                            type="audio"
                            render={(url) => (
                                <div className="flex items-center gap-3 min-w-[200px] h-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const audio = e.currentTarget.nextElementSibling as HTMLAudioElement;
                                            if (audio.paused) audio.play(); else audio.pause();
                                            e.currentTarget.querySelector('svg')?.classList.toggle('hidden');
                                        }}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
                                    >
                                        <svg className="w-3 h-3 fill-current ml-0.5 play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        <svg className="w-3 h-3 fill-current hidden pause-icon" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                    </button>
                                    <audio
                                        src={url}
                                        onPlay={(e) => {
                                            (e.currentTarget.previousElementSibling?.querySelector('.play-icon') as HTMLElement).classList.add('hidden');
                                            (e.currentTarget.previousElementSibling?.querySelector('.pause-icon') as HTMLElement).classList.remove('hidden');
                                        }}
                                        onPause={(e) => {
                                            (e.currentTarget.previousElementSibling?.querySelector('.play-icon') as HTMLElement).classList.remove('hidden');
                                            (e.currentTarget.previousElementSibling?.querySelector('.pause-icon') as HTMLElement).classList.add('hidden');
                                        }}
                                        onEnded={(e) => {
                                            (e.currentTarget.previousElementSibling?.querySelector('.play-icon') as HTMLElement).classList.remove('hidden');
                                            (e.currentTarget.previousElementSibling?.querySelector('.pause-icon') as HTMLElement).classList.add('hidden');
                                        }}
                                        className="hidden"
                                    />
                                    <div className="flex-1 space-y-1">
                                        <div className="h-0.5 bg-white/20 rounded-full overflow-hidden w-full">
                                            <div className="h-full bg-white w-0 animate-[progress_1s_linear]" style={{ width: '0%' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    )}

                    {(message.type === 'image' || message.type === 'video') && message.media && (
                        <EncryptedMedia
                            media={message.media}
                            type={message.type}
                            render={(url) => (
                                <div className="relative group/media overflow-hidden rounded-xl">
                                    {message.type === 'image' ? (
                                        <img src={url} alt="media" className="max-h-60 w-full object-cover shadow-sm" />
                                    ) : (
                                        <div className="max-h-60 w-full bg-black/90 flex items-center justify-center aspect-video relative">
                                            <video src={url} className="w-full h-full object-cover opacity-50" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                                                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Download Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                        <a
                                            href={url}
                                            download={message.media?.name || 'download'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-bold text-xs hover:scale-105 transition-transform shadow-xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                            Download to View
                                        </a>
                                    </div>
                                </div>
                            )}
                        />
                    )}

                    {message.type === 'file' && message.media && (
                        <EncryptedMedia
                            media={message.media}
                            type="file"
                            render={(url) => (
                                <div className="flex items-center gap-4 p-1 min-w-[220px]">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold truncate text-[#E6ECFF]">{message.media?.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">{(message.media?.size || 0) / 1024 > 1024 ? `${((message.media?.size || 0) / (1024 * 1024)).toFixed(1)} MB` : `${((message.media?.size || 0) / 1024).toFixed(0)} KB`}</div>
                                    </div>
                                    <a
                                        href={url}
                                        download={message.media?.name || 'file'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/40 flex items-center justify-center text-primary transition-all active:scale-95"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                    </a>
                                </div>
                            )}
                        />
                    )}

                    <div className={`mt-1 flex items-center ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[9px] font-bold opacity-40 uppercase tracking-widest ${isMe ? 'text-[#E6ECFF]' : 'text-[#7C89A6]'}`}>
                            {formatTime(message.timestamp)}
                        </span>
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
