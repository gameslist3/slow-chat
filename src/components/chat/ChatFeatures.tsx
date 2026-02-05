import React, { useRef, useEffect } from 'react';
import { useChat, useCooldown } from '../../hooks/index';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Group, Message } from '../../types';
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
    onType,
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
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = async (content: any) => {
        if (remaining > 0) return;
        try {
            // Find recipientId for personal chats
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
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
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

            {/* Message List Area - Fixed Scrollable Body */}
            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                {loading && messages.length === 0 ? (
                    <div className="max-w-4xl mx-auto py-10 space-y-8 px-4 flex-1 w-full">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-muted rounded-2xl shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-3 bg-muted rounded w-1/4" />
                                    <div className="h-12 bg-muted rounded-3xl w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                        <div className="text-8xl mb-6 text-center grayscale">💬</div>
                        <p className="font-bold uppercase tracking-widest text-xs text-center text-gray-500">No messages yet.</p>
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

            {/* Composer - Fixed at Bottom */}
            <div className="shrink-0">
                {chatId === 'system-updates' ? (
                    <div className="p-6 text-center">
                        <div className="inline-flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Official Updates
                        </div>
                    </div>
                ) : (
                    <AIComposer
                        groupId={chatId}
                        userId={user?.id || ''}
                        onSend={handleSendMessage}
                        replyingTo={replyingTo}
                        onCancelReply={cancelReply}
                        cooldown={remaining}
                    />
                )}
            </div>
        </div>
    );
};
