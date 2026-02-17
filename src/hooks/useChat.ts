import { useState, useCallback, useEffect } from 'react';
import { Message, ReplyMetadata, FileMetadata, PersonalChat } from '../types';
import { useAuth } from '../context/AuthContext';
import {
    sendMessage as sendFirebaseMessage,
    toggleReaction as toggleFirebaseReaction,
    subscribeToMessages,
    markAsSeen as markFirebaseSeen,
    subscribeToPersonalChats
} from '../services/firebaseMessageService';

export const useChat = (chatId: string, isPersonal: boolean = false) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);

    // Messaging Subscription
    useEffect(() => {
        if (!chatId) return;
        setLoading(true);
        const unsubscribe = subscribeToMessages(chatId, isPersonal, (newMessages) => {
            // Filter out system messages to focus on direct communication (WhatsApp/Instagram style)
            const filtered = newMessages.filter(m => m.type !== 'system');
            setMessages(filtered);
            setLoading(false);

            // Mark as seen when new messages arrive and we are active
            if (user?.id) {
                markFirebaseSeen(chatId, isPersonal, user.id);
            }
        });
        return () => unsubscribe();
    }, [chatId, isPersonal, user?.id]);

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
        messages,
        sendMessage,
        toggleReaction,
        replyingTo,
        handleReply,
        cancelReply,
        loading
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
