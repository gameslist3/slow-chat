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
    onProfileClick?: (userId: string) => void;
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
    onLeave,
    onProfileClick
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
        <div className="w-full h-full flex flex-col relative overflow-hidden bg-transparent">
            {/* Header */}
            <div className="shrink-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/5">
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
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {loading && messages.length === 0 ? (
                    <div className="max-w-4xl mx-auto py-10 space-y-8 px-8 w-full">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex gap-4 animate-pulse ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 bg-white/5 rounded-2xl shrink-0" />
                                <div className={`flex-1 space-y-3 ${i % 2 === 0 ? 'items-end flex flex-col' : ''}`}>
                                    <div className="h-2 bg-white/5 rounded w-24" />
                                    <div className={`h-16 bg-white/5 rounded-3xl w-2/3 ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                                    <div className="h-2 bg-white/5 rounded w-16 opacity-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 w-full overflow-y-auto custom-scrollbar pb-2 px-4 md:px-0 scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <div className="text-4xl text-blue-400">💬</div>
                                </div>
                                <p className="text-xs uppercase tracking-[0.3em] font-black text-blue-200">No signals detected</p>
                                <p className="text-sm text-blue-200/50 mt-2">Begin transmission</p>
                            </div>
                        ) : (
                            <div className="pb-32">
                                <AIMessageList
                                    messages={messages}
                                    currentUserId={user?.id || ''}
                                    highlightId={highlightMessageId}
                                    onReply={handleReply}
                                    onReaction={toggleReaction}
                                    onProfileClick={onProfileClick}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Composer - Floating Absolute */}
            <div className="absolute bottom-0 left-0 right-0 z-50">
                {(title === 'Gapes Team' || title === 'System Intelligence') ? (
                    <div className="mx-4 mb-6 p-4 rounded-3xl bg-secondary/10 border border-secondary/20 backdrop-blur-xl text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">Transmission Restricted: Gapes Team Only</p>
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
