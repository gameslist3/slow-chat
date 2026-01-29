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
                <div className={`w-8 h-8 mr-2 flex-shrink-0 ${isContinual ? 'opacity-0' : ''}`}>
                    {!isContinual && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-gray-700 ring-2 ring-white shadow-sm">
                            {message.sender[0].toUpperCase()}
                        </div>
                    )}
                </div>
            )}

            <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && !isContinual && (
                    <span className="text-[10px] uppercase font-bold text-gray-400 ml-1 mb-1 tracking-wider">{message.sender}</span>
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
          relative px-4 py-2.5 text-base shadow-sm break-words
          ${isMe
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-tl-sm'
                    }
          ${message.type === 'image' || message.type === 'video' ? 'p-1 bg-transparent border-0 shadow-none' : ''}
        `}>
                    {message.type === 'text' && message.text}

                    {(message.type === 'image' || message.type === 'gif') && (
                        <img src={message.mediaUrl} alt="media" className="rounded-xl max-h-60 object-cover shadow-sm" />
                    )}

                    {message.type === 'video' && (
                        <video src={message.mediaUrl} controls className="rounded-xl max-h-60 bg-black" />
                    )}

                    {message.type === 'text' && (
                        <span className={`text-[10px] ml-2 opacity-60 inline-block align-bottom ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
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
