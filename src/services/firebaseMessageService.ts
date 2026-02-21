import {
    collection,
    doc,
    addDoc,
    getDoc,
    updateDoc,
    getDocs,
    query,
    orderBy,
    onSnapshot,
    deleteDoc,
    where,
    writeBatch,
    runTransaction,
    Timestamp,
    arrayUnion,
    increment,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Message, ReplyMetadata, Reaction, FileMetadata, PersonalChat } from '../types';
import { createNotification } from './firebaseNotificationService';
import { CryptoUtils } from './crypto/CryptoUtils';
import { GroupEncryptionService } from './crypto/GroupEncryptionService';

/**
 * Universal Sender specifically for the 2026 UI Kit.
 * Handles both Group and Personal chats.
 */
export async function sendMessage(
    targetId: string, // groupId or chatId
    senderId: string,
    senderUsername: string,
    content: {
        text?: string,
        replyTo?: ReplyMetadata,
        media?: FileMetadata,
        type: Message['type'],
        isPersonal?: boolean,
        recipientId?: string // for notifications
    }
): Promise<Message> {
    try {
        if (!auth.currentUser) throw new Error("Authentication required");

        const collectionPath = content.isPersonal
            ? `personal_chats/${targetId}/messages`
            : `groups/${targetId}/messages`;

        // Connectivity Guard for Personal Chats
        if (content.isPersonal) {
            const chatRef = doc(db, 'personal_chats', targetId);
            const chatSnap = await getDoc(chatRef);
            if (!chatSnap.exists()) {
                throw new Error("No established connection protocol found. Connection required for direct messaging.");
            }
        }

        const messagesRef = collection(db, collectionPath);

        const messageData: any = {
            sender: senderUsername,
            senderId,
            text: content.text || '',
            timestamp: serverTimestamp(),
            type: content.type,
            reactions: []
        };

        // E2EE Logic for Personal Chats
        if (content.isPersonal && content.recipientId) {
            let sessionKey = await CryptoUtils.getSessionKey(content.recipientId);

            if (!sessionKey) {
                console.log(`[E2EE] No session for ${content.recipientId}. Establishing handshake...`);
                const recipientDoc = await getDoc(doc(db, 'users', content.recipientId));
                if (!recipientDoc.exists()) throw new Error("Recipient protocol unavailable.");

                const pubKeys = recipientDoc.data().publicKeys;
                if (!pubKeys?.identity) throw new Error("Recipient has not initialized E2EE protocol.");

                sessionKey = await CryptoUtils.establishSession(content.recipientId, pubKeys.identity);
            }

            const payload = {
                text: content.text || '',
                media: content.media,
                replyTo: content.replyTo
            };

            const { ciphertext, iv } = await CryptoUtils.encryptAES(JSON.stringify(payload), sessionKey);
            messageData.text = ciphertext;
            messageData.iv = iv;
            messageData.encrypted = true;
            // Clear binary metadata from root level as it's now in the encrypted payload
            delete messageData.media;
            delete messageData.replyTo;
        } else if (!content.isPersonal && content.text) {
            // Group E2EE Logic
            try {
                const groupDoc = await getDoc(doc(db, 'groups', targetId));
                if (groupDoc.exists()) {
                    const groupData = groupDoc.data();
                    const members = groupData.joinedMembers || [];

                    // Basic distribution check: distribute if members > 1
                    // In a real app, we'd throttle this or use a 'lastDistributed' timestamp
                    await GroupEncryptionService.distributeMyKey(targetId, members, senderId);

                    const mySenderKey = await GroupEncryptionService.getMySenderKey(targetId);

                    const payload = {
                        text: content.text || '',
                        media: content.media,
                        replyTo: content.replyTo
                    };

                    const { ciphertext, iv } = await CryptoUtils.encryptAES(JSON.stringify(payload), mySenderKey);

                    messageData.text = ciphertext;
                    messageData.iv = iv;
                    messageData.encrypted = true;
                    // Clear binary metadata from root level
                    delete messageData.media;
                    delete messageData.replyTo;
                    console.log(`[GroupE2EE] Message encrypted for group ${targetId}`);
                }
            } catch (err) {
                console.error("[GroupE2EE] Failed to encrypt message:", err);
                // Fallback to plain text for now, or throw error to block leak
                // User requirement is TRUE E2EE, so throwing error is safer.
                throw new Error("Group E2EE negotiation failed.");
            }
        }

        if (!messageData.encrypted) {
            if (content.replyTo) messageData.replyTo = content.replyTo;
            if (content.media) messageData.media = content.media;
        }

        if (content.isPersonal) {
            messageData.status = 'sent';
        } else {
            messageData.readBy = [senderId];
        }

        const docRef = await addDoc(messagesRef, messageData);

        // Update Activity
        if (content.isPersonal) {
            const chatRef = doc(db, 'personal_chats', targetId);
            await updateDoc(chatRef, {
                lastActivity: Date.now(),
                lastMessage: content.text || `[${content.type}]`,
                [`unreadCounts.${content.recipientId}`]: increment(1)
            });
        } else {
            // Update group's lastActivity and increment unread counts for other members
            const groupRef = doc(db, 'groups', targetId);
            const groupSnap = await getDoc(groupRef);
            if (groupSnap.exists()) {
                const memberIds = groupSnap.data().memberIds || [];
                const updates: any = { lastActivity: Date.now() };
                memberIds.forEach((mid: string) => {
                    if (mid !== senderId) {
                        updates[`unreadCounts.${mid}`] = increment(1);
                    }
                });
                await updateDoc(groupRef, updates);
            }
        }

        // --- Notifications Logic ---

        // Track who has been notified to prevent duplicates (e.g. Reply + Mention)
        const notifiedUserIds = new Set<string>();

        if (content.isPersonal) {
            // Personal chat alerts: Always notify recipient UNLESS they are active in the same chat
            if (content.recipientId) {
                const recipientDoc = await getDoc(doc(db, 'users', content.recipientId));
                const recipientActiveChat = recipientDoc.exists() ? recipientDoc.data().activeChatId : null;

                if (recipientActiveChat !== targetId) {
                    await createNotification(content.recipientId, {
                        type: 'message',
                        senderName: senderUsername,
                        text: `Sent a ${content.type === 'text' ? 'message' : content.type}`,
                        groupId: targetId,
                        messageId: docRef.id
                    });
                }
                notifiedUserIds.add(content.recipientId);
            }
        } else {
            // Group Chat: Filtered Notifications (Mentions & Replies Only)
            // Note: We could also check occupancy here if needed, but the user specifically asked for replies to NOT show if screen is open.

            // 1. Check for Replies
            if (content.replyTo) {
                const replyToUserId = await getUserIdByUsername(content.replyTo.sender);

                if (replyToUserId && replyToUserId !== senderId) {
                    const recipientDoc = await getDoc(doc(db, 'users', replyToUserId));
                    const recipientActiveChat = recipientDoc.exists() ? recipientDoc.data().activeChatId : null;

                    if (recipientActiveChat !== targetId) {
                        await createNotification(replyToUserId, {
                            type: 'message',
                            senderName: senderUsername,
                            text: `replied to your message`,
                            groupId: targetId,
                            messageId: docRef.id
                        });
                    }
                    notifiedUserIds.add(replyToUserId);
                }
            }

            // 2. Check for Mentions
            if (content.text) {
                const mentionMatches = content.text.match(/@\w+/g) || [];
                const mentionedUsernames = mentionMatches.map(m => m.slice(1));

                if (mentionedUsernames.length > 0) {
                    for (const username of mentionedUsernames) {
                        const uid = await getUserIdByUsername(username);
                        if (uid && uid !== senderId && !notifiedUserIds.has(uid)) {
                            const recipientDoc = await getDoc(doc(db, 'users', uid));
                            const recipientActiveChat = recipientDoc.exists() ? recipientDoc.data().activeChatId : null;

                            if (recipientActiveChat !== targetId) {
                                await createNotification(uid, {
                                    type: 'message',
                                    senderName: senderUsername,
                                    text: `mentioned you in a message`,
                                    groupId: targetId,
                                    messageId: docRef.id
                                });
                            }
                            notifiedUserIds.add(uid);
                        }
                    }
                }
            }
        }

        return { ...messageData, id: docRef.id };
    } catch (error) {
        console.error('[Firestore] SendMessage Error:', error);
        throw error;
    }
}

/**
 * Mark messages as seen
 */
export async function markAsSeen(
    targetId: string,
    isPersonal: boolean,
    userId: string
): Promise<void> {
    const path = isPersonal
        ? `personal_chats/${targetId}/messages`
        : `groups/${targetId}/messages`;

    const messagesRef = collection(db, path);

    if (isPersonal) {
        // Mark all messages from the other user as 'seen'
        // FIX: Firestore does not support multiple '!=' inequalities. 
        // We query for 'sent' status and filter senderId on client or just check senderId if status is available.
        const q = query(messagesRef, where('status', '==', 'sent'));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
            if (d.data().senderId !== userId) {
                batch.update(d.ref, { status: 'seen' });
            }
        });
        await batch.commit();

        // Reset unread counts on chat record
        const chatRef = doc(db, 'personal_chats', targetId);
        await updateDoc(chatRef, { [`unreadCounts.${userId}`]: 0 });
    } else {
        // Update group readBy for recent messages
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(20));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
            const readBy = d.data().readBy || [];
            if (!readBy.includes(userId)) {
                batch.update(d.ref, { readBy: arrayUnion(userId) });
            }
        });
        await batch.commit();

        const groupRef = doc(db, 'groups', targetId);
        await updateDoc(groupRef, { [`unreadCounts.${userId}`]: 0 });
    }
}

/**
 * Helper: Find UID by username (Needed for notifications)
 * In production, probably want a users_by_username index or small cache
 */
async function getUserIdByUsername(username: string): Promise<string | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id;
}

/**
 * Toggle reaction on a message (Messenger style)
 */
export async function toggleReaction(
    targetId: string,
    messageId: string,
    userId: string,
    emoji: string,
    isPersonal: boolean
): Promise<void> {
    const path = isPersonal
        ? `personal_chats/${targetId}/messages/${messageId}`
        : `groups/${targetId}/messages/${messageId}`;

    const messageRef = doc(db, path);

    try {
        await runTransaction(db, async (transaction) => {
            const messageDoc = await transaction.get(messageRef);
            if (!messageDoc.exists()) throw new Error("Message not found");

            const currentReactions: Reaction[] = messageDoc.data().reactions || [];
            let newReactions = [...currentReactions];

            const existingEmojiIndex = newReactions.findIndex(r => r.emoji === emoji);

            if (existingEmojiIndex > -1) {
                const userIndex = newReactions[existingEmojiIndex].userIds.indexOf(userId);
                if (userIndex > -1) {
                    newReactions[existingEmojiIndex].userIds.splice(userIndex, 1);
                    if (newReactions[existingEmojiIndex].userIds.length === 0) {
                        newReactions.splice(existingEmojiIndex, 1);
                    }
                } else {
                    newReactions[existingEmojiIndex].userIds.push(userId);
                }
            } else {
                newReactions.push({ emoji, userIds: [userId] });
            }

            transaction.update(messageRef, { reactions: newReactions });
        });
    } catch (error) {
        console.error('[Firestore] ToggleReaction Error:', error);
        throw error;
    }
}

export function subscribeToMessages(
    targetId: string,
    isPersonal: boolean,
    callback: (messages: Message[]) => void,
    startTime?: number
): () => void {
    const path = isPersonal
        ? `personal_chats/${targetId}/messages`
        : `groups/${targetId}/messages`;

    const messagesRef = collection(db, path);
    let q = query(messagesRef, orderBy('timestamp', 'asc'));

    if (startTime) {
        // Important: orderBy + where on same field is fine.
        q = query(messagesRef,
            where('timestamp', '>=', Timestamp.fromMillis(startTime)),
            orderBy('timestamp', 'asc')
        );
    }

    return onSnapshot(q, (snapshot) => {
        if (!auth.currentUser) return;
        const messages = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as Message));
        callback(messages);
    }, (error) => {
        if (error.code === 'permission-denied') return;
        console.error('[Firestore] Message Subscription Error:', error);
    });
}

/**
 * Fetch a chunk of history before a certain timestamp
 */
export async function fetchPreviousMessages(
    targetId: string,
    isPersonal: boolean,
    beforeTimestamp: number,
    limitCount: number = 50
): Promise<Message[]> {
    const path = isPersonal
        ? `personal_chats/${targetId}/messages`
        : `groups/${targetId}/messages`;

    const messagesRef = collection(db, path);
    const q = query(messagesRef,
        where('timestamp', '<', Timestamp.fromMillis(beforeTimestamp)),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    const snap = await getDocs(q);
    // Reverse because we queried descending for the 'before' chunk
    return snap.docs
        .map(d => ({ ...d.data(), id: d.id } as Message))
        .sort((a, b) => {
            const tA = (a.timestamp as any)?.toMillis?.() || 0;
            const tB = (b.timestamp as any)?.toMillis?.() || 0;
            return tA - tB;
        });
}

/**
 * Terminate a personal chat and all its messages
 */
export async function terminatePersonalChat(chatId: string): Promise<void> {
    // 1. Delete the chat metadata first so UI updates instantly
    await deleteDoc(doc(db, 'personal_chats', chatId));

    // 2. Cleanup messages in the background/batches
    const messagesRef = collection(db, `personal_chats/${chatId}/messages`);
    const snap = await getDocs(messagesRef);

    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
}

/**
 * Get Personal Chats for the user
 */
export function subscribeToPersonalChats(userId: string, callback: (chats: PersonalChat[]) => void) {
    const q = query(collection(db, 'personal_chats'),
        where('userIds', 'array-contains', userId),
        orderBy('lastActivity', 'desc')
    );

    return onSnapshot(q, (snap) => {
        if (!auth.currentUser) return;
        const chats = snap.docs.map(d => ({ ...d.data(), id: d.id } as PersonalChat));
        callback(chats);
    }, (error) => {
        if (error.code === 'permission-denied') return;
        console.error('[Firestore] Personal Chats Subscription Error:', error);
    });
}

/**
 * Delete a personal chat permanently (Redo for Phase 22)
 * Removes all messages and the chat document itself instantly.
 */
export async function deletePersonalChat(chatId: string): Promise<void> {
    console.log("Deleting chat:", chatId);
    try {
        const messagesRef = collection(db, `personal_chats/${chatId}/messages`);
        const snap = await getDocs(messagesRef);

        const batch = writeBatch(db);

        // 1. Delete all messages first for a clean wipe
        snap.docs.forEach(d => {
            batch.delete(d.ref);
        });

        // 2. Delete the chat parent document
        const chatRef = doc(db, 'personal_chats', chatId);
        console.log('[Firebase] Deleting personal chat document for ID:', chatId);
        batch.delete(chatRef);

        // 3. Commit atomically
        await batch.commit();
        console.log('[Firestore] Chat and messages deleted successfully:', chatId);
    } catch (error) {
        console.error('[Firestore] DeletePersonalChat Error:', error);
        throw error;
    }
}
