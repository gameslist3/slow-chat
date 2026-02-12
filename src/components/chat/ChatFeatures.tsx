import React, { useRef } from 'react';
import { useChat, useCooldown } from '../../hooks/index';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AIChatHeader } from './AIChatHeader';
import { AIMessageList } from './AIMessageList';
import { AIComposer } from './AIComposer';

interface ChatInterfaceProps {
    chatId: string;
    isPersonal: boolean;
    highlightMessageId?: string;
    title: string;
    image: string;
    memberCount: number;
    memberIds?: string[];
    createdAt?: number;
    onType?: (isDirty: boolean) => void;
    onLeave?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    chatId,
    isPersonal,
    highlightMessageId,
    title,
    image,
    memberCount,
    memberIds = [],
    createdAt,
    onLeave
}) => {
    const {
        messages,
        sendMessage,
        toggleReaction,
        handleReply,
        cancelReply,
        replyingTo,
        loading
    } = useChat(chatId, isPersonal);

    const { user } = useAuth();
    const { remaining, triggerCooldown } = useCooldown(chatId, memberCount);
    const { toast } = useToast();

    const handleSendMessage = async (content: any) => {
        if (remaining > 0) return;
        try {
            let recipientId: string | undefined;
            if (isPersonal) {
                const ids = chatId.split('_');
                recipientId = ids.find(id => id !== user?.id);
            }

            await sendMessage({ ...content, recipientId });
            triggerCooldown();
        } catch (error: any) {
            toast(error.message || "Failed to send message", "error");
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#050505] relative overflow-hidden">
            <AIChatHeader
                groupId={chatId}
                isPersonal={isPersonal}
                title={title}
                image={image}
                createdAt={createdAt}
                memberCount={memberCount}
                memberIds={memberIds}
                onLeave={onLeave}
            />

            {/* Message List Area */}
            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col w-full h-full">
                {loading && messages.length === 0 ? (
                    <div className="max-w-4xl mx-auto py-10 space-y-8 px-4 flex-1 w-full overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`flex gap-4 animate-pulse ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 bg-white/5 rounded-xl shrink-0" />
                                <div className={`flex-1 space-y-3 ${i % 2 === 0 ? 'items-end flex flex-col' : ''}`}>
                                    <div className="h-2 bg-white/5 rounded w-24" />
                                    <div className={`h-12 bg-white/5 rounded-2xl w-3/4 ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full w-full">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-20">
                                <div className="text-6xl mb-6 grayscale italic">💬</div>
                                <p className="text-[10px] uppercase tracking-[0.3em] font-black">No activity located</p>
                            </div>
                        ) : (
                            <AIMessageList
                                messages={messages}
                                currentUserId={user?.id || ''}
                                highlightId={highlightMessageId}
                                onReply={handleReply}
                                onReaction={toggleReaction}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Composer */}
            <div className="shrink-0 relative z-50">
                <AIComposer
                    groupId={chatId}
                    userId={user?.id || ''}
                    onSend={handleSendMessage}
                    replyingTo={replyingTo}
                    onCancelReply={cancelReply}
                    cooldown={remaining}
                />
            </div>
        </div>
    );
};
