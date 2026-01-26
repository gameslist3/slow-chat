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
    limit
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Message, ReplyMetadata, Reaction, FileMetadata, PersonalChat } from '../types';
import { createNotification } from './firebaseNotificationService';

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
            timestamp: Date.now(),
            type: content.type,
            reactions: []
        };

        if (content.replyTo) messageData.replyTo = content.replyTo;
        if (content.media) messageData.media = content.media;

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
            const groupRef = doc(db, 'groups', targetId);
            // Increment unread for all members EXCEPT sender
            // Note: In real production with huge groups, we'd use a different approach
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

        if (content.isPersonal) {
            // Personal chat alerts
            if (content.recipientId) {
                await createNotification(content.recipientId, {
                    type: 'message',
                    senderName: senderUsername,
                    text: content.text || `Sent a ${content.type}`,
                    groupId: targetId,
                    messageId: docRef.id
                });
            }
        } else {
            // Group chat alerts for all members (except sender)
            const groupSnap = await getDoc(doc(db, 'groups', targetId));
            if (groupSnap.exists()) {
                const memberIds = groupSnap.data().memberIds || [];
                const notificationPromises = memberIds
                    .filter((mid: string) => mid !== senderId)
                    .map((mid: string) => createNotification(mid, {
                        type: 'message',
                        senderName: senderUsername,
                        text: content.text || `shared a ${content.type}`,
                        groupId: targetId,
                        messageId: docRef.id
                    }));
                await Promise.all(notificationPromises);
            }
        }

        // Special alerts: Reply & Mention (These can overlap with basic message alerts)
        if (content.replyTo) {
            const replyToUserId = await getUserIdByUsername(content.replyTo.sender);
            if (replyToUserId && replyToUserId !== senderId) {
                // If it's a group, the generic message notification above already exists
                // We could add a more specific 'reply' notification if we want, 
                // but for now, the generic one covers the unread badge.
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
        const q = query(messagesRef, where('senderId', '!=', userId), where('status', '!=', 'seen'));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.update(d.ref, { status: 'seen' }));
        await batch.commit();

        // Reset unread counts on chat record
        const chatRef = doc(db, 'personal_chats', targetId);
        await updateDoc(chatRef, { [`unreadCounts.${userId}`]: 0 });
    } else {
        // Update group readBy and Reset unread count for user
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
    callback: (messages: Message[]) => void
): () => void {
    const path = isPersonal
        ? `personal_chats/${targetId}/messages`
        : `groups/${targetId}/messages`;

    const messagesRef = collection(db, path);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as Message));
        callback(messages);
    });
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
        const chats = snap.docs.map(d => ({ ...d.data(), id: d.id } as PersonalChat));
        callback(chats);
    });
}
