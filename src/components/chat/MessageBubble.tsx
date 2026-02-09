import React from 'react';
import { Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Smile, MoreHorizontal, Reply } from 'lucide-react';
import { Button } from '../ui/Button';

interface MessageBubbleProps {
    message: Message;
    isContinual?: boolean; // If previous message was same sender
    onReact: (emoji: string) => void;
    onReply: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isContinual, onReact, onReply }) => {
    const { user } = useAuth();
    const isMe = message.sender === user?.username;

    return (
        <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-${isContinual ? '1' : '4'} group relative animate-in fade-in slide-in-from-bottom-2 duration-300`}>

            {/* Avatar (Left) - Only if not continual */}
            {!isMe && (
                <div className={`w-10 h-10 mr-4 flex-shrink-0 ${isContinual ? 'opacity-0' : ''}`}>
                    {!isContinual && (
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 shadow-sm uppercase tracking-tighter">
                            {message.sender.slice(0, 2)}
                        </div>
                    )}
                </div>
            )}

            <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && !isContinual && (
                    <span className="text-[9px] uppercase font-black text-primary/60 ml-1 mb-1.5 tracking-[0.2em]">{message.sender}</span>
                )}

                {/* Reply Context */}
                {message.replyTo && (
                    <div className={`
             mb-1 text-xs px-3 py-1 rounded-lg bg-gray-100/50 border-l-2 border-gray-300 text-gray-500 truncate max-w-full
             ${isMe ? 'mr-1' : 'ml-1'}
           `}>
                        Replying to message...
                    </div>
                )}

                <div className={`
                    relative px-5 py-3.5 text-[15px] font-medium leading-relaxed tracking-tight break-words overflow-hidden
                    ${isMe
                        ? 'bg-primary text-white rounded-[1.5rem] rounded-tr-none shadow-lg shadow-primary/20'
                        : 'glass-panel rounded-[1.5rem] rounded-tl-none border border-white/10'
                    }
                    ${message.type === 'image' || message.type === 'video' ? 'p-1.5 bg-transparent border-0 shadow-none' : ''}
                `}>
                    {message.type === 'text' && (
                        <div className="max-w-full">
                            {message.text}
                        </div>
                    )}

                    {(message.type === 'image' || message.type === 'video') && (
                        <div className="relative group/media overflow-hidden rounded-xl">
                            {message.type === 'image' ? (
                                <img src={message.media?.url} alt="media" className="max-h-60 w-full object-cover shadow-sm" />
                            ) : (
                                <div className="max-h-60 w-full bg-black/90 flex items-center justify-center aspect-video relative">
                                    <video src={message.media?.url} className="w-full h-full object-cover opacity-50" />
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
                                    href={message.media?.url}
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

                    {message.type === 'text' && (
                        <span className={`text-[9px] font-black ml-3 opacity-40 inline-block align-bottom uppercase tracking-widest ${isMe ? 'text-white' : 'text-muted-foreground'}`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>

                {/* Reactions */}
                {message.reactions.length > 0 && (
                    <div className={`flex gap-1 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                        {message.reactions.map((r, i) => (
                            <span key={i} className="bg-white border border-gray-100 shadow-sm rounded-full px-1.5 py-0.5 text-xs animate-in zoom-in">
                                {r.emoji}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Bar (Simple, shows on hover) */}
            <div className={`
        absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 z-10
        ${isMe
                    ? 'right-full mr-3 flex-row-reverse'
                    : 'left-full ml-3'
                }
      `}>
                <Button
                    variant="secondary" size="icon" className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-indigo-600"
                    onClick={() => onReact('❤️')}
                >
                    ❤️
                </Button>
                <Button
                    variant="secondary" size="icon" className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-indigo-600"
                    onClick={onReply}
                >
                    <Reply className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
