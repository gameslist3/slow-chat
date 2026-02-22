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
import { getUserById } from '../services/firebaseAuthService';
import { CryptoUtils } from '../services/crypto/CryptoUtils';
import { GroupEncryptionService } from '../services/crypto/GroupEncryptionService';

export const useChat = (chatId: string, isPersonal: boolean = false) => {
    const { user } = useAuth();
    const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
    const [history, setHistory] = useState<Message[]>([]);
    const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Initial window: Last 24 hours OR since user joined (for Clean Slate groups)
    const [startTime] = useState(() => {
        const window24h = Date.now() - 24 * 60 * 60 * 1000;
        if (!isPersonal && user?.groupJoinTimes?.[chatId]) {
            return Math.max(window24h, user.groupJoinTimes[chatId]);
        }
        return window24h;
    });

    // Messaging Subscription (Real-time for current window)
    useEffect(() => {
        if (!chatId || !user?.id) return;
        setLoading(true);

        const decryptMessages = async (msgs: Message[]) => {
            const processed = await Promise.all(msgs.map(async (m) => {
                if (!m.encrypted || !m.iv) return m;

                try {
                    const peerId = isPersonal
                        ? (m.senderId === user.id ? chatId.split('_').find(id => id !== user.id) : m.senderId)
                        : m.senderId;

                    if (!peerId) return m;

                    let sessionKey: CryptoKey | null = null;
                    if (isPersonal) {
                        sessionKey = await CryptoUtils.getSessionKey(peerId);
                        if (!sessionKey) {
                            const peerDoc = await getUserById(peerId);
                            const pubKey = peerDoc?.publicKeys?.identity;
                            if (pubKey) {
                                sessionKey = await CryptoUtils.establishSession(peerId, pubKey);
                            }
                        }
                    } else {
                        // FIX: If I am the sender, use my own sender key
                        if (m.senderId === user.id) {
                            sessionKey = await GroupEncryptionService.getMySenderKey(chatId);
                        } else {
                            sessionKey = await GroupEncryptionService.getPeerSenderKey(chatId, peerId, user.id);
                        }
                    }

                    if (sessionKey) {
                        const decrypted = await CryptoUtils.decryptAES(m.text, m.iv, sessionKey);
                        try {
                            const parsed = JSON.parse(decrypted);
                            return {
                                ...m,
                                text: parsed.text || '',
                                media: parsed.media,
                                replyTo: parsed.replyTo,
                                encrypted: false
                            };
                        } catch (e) {
                            // Fallback for legacy plain-text encryption
                            return { ...m, text: decrypted, encrypted: false };
                        }
                    } else {
                        if (!isPersonal) return { ...m, encrypted: false }; // Fallback for groups
                        return { ...m, text: "🔒 Decryption pending: Connecting to peer security identity..." };
                    }
                } catch (err) {
                    console.error("[useChat] Decryption failed for message:", m.id, err);
                    if (!isPersonal) return { ...m, encrypted: false };
                    return { ...m, text: "🔒 Decryption error: Secure channel corrupted or key mismatch." };
                }
            }));
            return processed;
        };

        const unsubscribe = subscribeToMessages(chatId, isPersonal, async (newMessages) => {
            const now = Date.now();
            const expiryThreshold = (user?.autoDeleteHours || 10) * 60 * 60 * 1000;

            const filtered = newMessages.filter(m => {
                if (m.type === 'system') return false;
                const ts = (m.timestamp as any)?.toMillis?.() || (typeof m.timestamp === 'number' ? m.timestamp : now);
                return (now - ts) < expiryThreshold;
            });

            const decrypted = await decryptMessages(filtered);
            setRealtimeMessages(decrypted);
            setLoading(false);

            if (user?.id) {
                markFirebaseSeen(chatId, isPersonal, user.id);
            }
        }, startTime);
        return () => unsubscribe();
    }, [chatId, isPersonal, user?.id, startTime]);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !chatId) return;

        // Find oldest message timestamp to fetch before it
        const oldest = history[0] || realtimeMessages[0];
        const oldestTs = oldest ? ((oldest.timestamp as any)?.toMillis?.() || Date.now()) : Date.now();

        if (!user) return;

        const decryptMessages = async (msgs: Message[]) => {
            const processed = await Promise.all(msgs.map(async (m) => {
                if (!m.encrypted || !m.iv) return m;

                try {
                    const peerId = isPersonal
                        ? (m.senderId === user.id ? chatId.split('_').find(id => id !== user.id) : m.senderId)
                        : m.senderId;

                    if (!peerId) return m;

                    let sessionKey: CryptoKey | null = null;
                    if (isPersonal) {
                        sessionKey = await CryptoUtils.getSessionKey(peerId);
                        if (!sessionKey) {
                            const peerDoc = await getUserById(peerId);
                            const pubKey = peerDoc?.publicKeys?.identity;
                            if (pubKey) {
                                sessionKey = await CryptoUtils.establishSession(peerId, pubKey);
                            }
                        }
                    } else {
                        // FIX: If I am the sender, use my own sender key
                        if (m.senderId === user.id) {
                            sessionKey = await GroupEncryptionService.getMySenderKey(chatId);
                        } else {
                            sessionKey = await GroupEncryptionService.getPeerSenderKey(chatId, peerId, user.id);
                        }
                    }

                    if (sessionKey) {
                        const decrypted = await CryptoUtils.decryptAES(m.text, m.iv, sessionKey);
                        try {
                            const parsed = JSON.parse(decrypted);
                            return {
                                ...m,
                                text: parsed.text || '',
                                media: parsed.media,
                                replyTo: parsed.replyTo,
                                encrypted: false
                            };
                        } catch (e) {
                            return { ...m, text: decrypted, encrypted: false };
                        }
                    } else {
                        if (!isPersonal) return { ...m, encrypted: false }; // Fallback for groups
                        return { ...m, text: "🔒 Decryption pending: Connecting to peer security identity..." };
                    }
                } catch (err) {
                    console.error("[useChat] Decryption failed for message:", m.id, err);
                    if (!isPersonal) return { ...m, encrypted: false };
                    return { ...m, text: "🔒 Decryption error: Secure channel corrupted or key mismatch." };
                }
            }));
            return processed;
        };

        // Enforce Clean Slate: Stop if we've reached the start of the allowed window
        if (oldestTs <= startTime) {
            setHasMore(false);
            return;
        }

        if (!user) return;

        setLoadingMore(true);
        try {
            const chunk = await fetchPreviousMessages(chatId, isPersonal, oldestTs);
            const decryptedChunk = await decryptMessages(chunk);

            // Filter chunk locally to respect startTime (safety floor)
            const validChunk = decryptedChunk.filter(m => {
                const ts = (m.timestamp as any)?.toMillis?.() || 0;
                return ts >= startTime;
            });

            if (validChunk.length === 0) {
                setHasMore(false);
            } else {
                setHistory(prev => [...validChunk, ...prev]);
                // If we hit the floor exactly, no more to load
                if (validChunk.some(m => ((m.timestamp as any)?.toMillis?.() || 0) <= startTime)) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error("[useChat] LoadMore error:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [chatId, isPersonal, history, realtimeMessages, loadingMore, hasMore, startTime]);

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
            if (!user?.id || !user?.username) throw new Error("User session invalid");

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

    const addOptimisticMessage = useCallback((msg: Message) => {
        setOptimisticMessages(prev => [...prev, msg]);
    }, []);

    const removeOptimisticMessage = useCallback((id: string) => {
        setOptimisticMessages(prev => prev.filter(m => m.id !== id));
    }, []);

    return {
        messages: [...history, ...realtimeMessages, ...optimisticMessages].sort((a, b) => {
            const timeA = (a.timestamp as any)?.toMillis?.() || (typeof a.timestamp === 'number' ? a.timestamp : 0);
            const timeB = (b.timestamp as any)?.toMillis?.() || (typeof b.timestamp === 'number' ? b.timestamp : 0);
            return timeA - timeB;
        }),
        sendMessage,
        addOptimisticMessage,
        removeOptimisticMessage,
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
