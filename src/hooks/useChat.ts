import { useState, useCallback, useEffect } from 'react';
import { Message, ReplyMetadata, FileMetadata, PersonalChat } from '../types';
import { useAuth } from '../context/AuthContext';
import {
    sendMessage as sendFirebaseMessage,
    toggleReaction as toggleFirebaseReaction,
    subscribeToMessages,
    markAsSeen as markFirebaseSeen,
    subscribeToPersonalChats,
    fetchPreviousMessages
} from '../services/firebaseMessageService';

export const useChat = (chatId: string, isPersonal: boolean = false) => {
    const { user } = useAuth();
    const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
    const [history, setHistory] = useState<Message[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Initial window: Last 24 hours
    const [startTime] = useState(() => Date.now() - 24 * 60 * 60 * 1000);

    // Messaging Subscription (Real-time for current window)
    useEffect(() => {
        if (!chatId || !user?.id) return;
        setLoading(true);
        const unsubscribe = subscribeToMessages(chatId, isPersonal, (newMessages) => {
            const filtered = newMessages.filter(m => m.type !== 'system');
            setRealtimeMessages(filtered);
            setLoading(false);

            if (user?.id) {
                markFirebaseSeen(chatId, isPersonal, user.id);
            }
        }, startTime);
        return () => unsubscribe();
    }, [chatId, isPersonal, user?.id, startTime]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !chatId) return;
        setLoadingMore(true);

        try {
            // Find oldest message timestamp to fetch before it
            const oldest = history[0] || realtimeMessages[0];
            const beforeTs = oldest ? ((oldest.timestamp as any)?.toMillis?.() || Date.now()) : Date.now();

            const chunk = await fetchPreviousMessages(chatId, isPersonal, beforeTs);

            if (chunk.length === 0) {
                setHasMore(false);
            } else {
                setHistory(prev => [...chunk, ...prev]);
            }
        } catch (error) {
            console.error("[useChat] LoadMore error:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [chatId, isPersonal, history, realtimeMessages, loadingMore, hasMore]);

    const sendMessage = useCallback(async (content: {
        text?: string,
        media?: FileMetadata,
        type: Message['type'],
        recipientId?: string
    }) => {
        if (!user?.username || !user?.id || !chatId) return;

        let replyMeta: ReplyMetadata | undefined;
        if (replyingTo) {
            replyMeta = {
                messageId: replyingTo.id,
                text: replyingTo.text || (replyingTo.type !== 'text' ? `[${replyingTo.type}]` : ''),
                sender: replyingTo.sender
            };
        }

        try {
            const sentMessage = await sendFirebaseMessage(chatId, user.id, user.username, {
                ...content,
                replyTo: replyMeta,
                isPersonal
            });
            setReplyingTo(null);
            return sentMessage;
        } catch (error) {
            console.error('[useChat] Error sending message:', error);
            throw error;
        }
    }, [user, chatId, replyingTo, isPersonal]);

    const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!user?.id || !chatId) return;
        try {
            await toggleFirebaseReaction(chatId, messageId, user.id, emoji, isPersonal);
        } catch (error) {
            console.error('[useChat] Error toggling reaction:', error);
        }
    }, [user, chatId, isPersonal]);

    const handleReply = (message: Message) => setReplyingTo(message);
    const cancelReply = () => setReplyingTo(null);

    return {
        messages: [...history, ...realtimeMessages],
        sendMessage,
        toggleReaction,
        replyingTo,
        handleReply,
        cancelReply,
        loading,
        loadingMore,
        loadMore,
        hasMore
    };
};

/**
 * Hook for managing the inbox (Recent Chats)
 */
export const useInbox = () => {
    const { user } = useAuth();
    const [personalChats, setPersonalChats] = useState<PersonalChat[]>([]);

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = subscribeToPersonalChats(user.id, setPersonalChats);
        return () => unsubscribe();
    }, [user?.id]);

    return { personalChats };
};
