import React, { useEffect, useRef } from 'react';
import { Group } from '../../types';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { Button } from '../ui/Button';
import { Share2, Users, Info, X, ChevronLeft } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useToast } from '../../context/ToastContext';

interface ChatInterfaceProps {
    group: Group;
    onBack?: () => void; // For mobile
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ group, onBack }) => {
    const { messages, sendMessage, addReaction, replyingTo, handleReply, cancelReply } = useChat(group.messages || []);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Auto scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, replyingTo]);

    const handleSend = (text: string) => {
        sendMessage(text);
    };

    const handleUpload = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            toast("File too large (max 10MB)", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            sendMessage("", result, type);
        };
        reader.readAsDataURL(file);
    };

    const handleShare = () => {
        const url = `${window.location.origin}/group/${group.id}`;
        navigator.clipboard.writeText(url);
        toast("Link copied to clipboard", "success");
    };

    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] relative">
            {/* Header - Custom for Chat, overrides Layout header potentially or sits below it if not careful. 
            Layout usually handles header on mobile, but Chat might want custom controls.
            Let's keep it simple: Render top bar on desktop, hidden on mobile if Layout handles it.
            Actually, MainLayout puts MobileHeader above children.
            So we should hide this header on mobile?
            OR we use this header as the ONLY header for Chat View.
            
            Let's make this header "Desktop Only" or "Persistent Info Bar".
            Mobile Layout Header shows Title.
        */}
            <div className="hidden md:flex bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3 justify-between items-center z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className="text-3xl filter drop-shadow-sm">{group.image}</div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-tight">{group.name}</h2>
                        <p className="text-xs text-gray-500 flex items-center font-medium">
                            <Users className="w-3 h-3 mr-1" /> {group.members} members &bull; {group.category}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleShare}
                        className="hover:bg-indigo-50 hover:text-indigo-600"
                    >
                        <Share2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Info className="w-5 h-5 text-gray-400" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-2 md:px-0 py-4 scroll-smooth">
                <div className="max-w-3xl mx-auto space-y-1 pb-4">
                    {messages.length === 0 && (
                        <div className="text-center py-20 opacity-50 select-none">
                            <div className="text-6xl mb-4 grayscale opacity-50">🍃</div>
                            <p className="text-gray-400">It's quiet here. Start a conversation.</p>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isContinual = i > 0 && messages[i - 1].sender === msg.sender;
                        // Add date separator if needed? simplified for now.
                        return (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isContinual={isContinual}
                                onReact={(emoji) => addReaction(msg.id, emoji)}
                                onReply={() => handleReply(msg)}
                            />
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </div>

            {/* Reply Preview Area */}
            {replyingTo && (
                <div className="bg-white/90 backdrop-blur-sm border-t border-gray-100 px-4 py-2 flex justify-between items-center text-sm shadow-sm animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col border-l-2 border-indigo-500 pl-3 py-1">
                        <span className="text-indigo-600 font-semibold text-xs">Replying to {replyingTo.sender}</span>
                        <span className="text-gray-600 truncate max-w-xs md:max-w-md">{replyingTo.text}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={cancelReply} className="h-8 w-8 text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Input */}
            <ChatInput
                groupId={group.id}
                memberCount={group.members}
                onSend={handleSend}
                onUpload={handleUpload}
            />
        </div>
    );
};
