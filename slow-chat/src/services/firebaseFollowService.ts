import {
    collection,
    doc,
    addDoc,
    getDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    writeBatch,
    runTransaction,
    limit,
    Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { FollowRequest, User } from '../types';
import { createNotification } from './firebaseNotificationService';

/**
 * Send a follow request
 */
export const sendFollowRequest = async (toUserId: string, toUsername: string): Promise<void> => {
    const fromUser = auth.currentUser;
    if (!fromUser) throw new Error("Auth required");
    if (fromUser.uid === toUserId) throw new Error("You cannot follow yourself");

    const requestsRef = collection(db, 'follow_requests');

    // Check if any request exists in either direction
    const q1 = query(requestsRef, where('fromId', '==', fromUser.uid), where('toId', '==', toUserId));
    const q2 = query(requestsRef, where('fromId', '==', toUserId), where('toId', '==', fromUser.uid));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    if (!snap1.empty || !snap2.empty) {
        throw new Error("A connection protocol is already active between these users.");
    }

    await addDoc(requestsRef, {
        fromId: fromUser.uid,
        fromUsername: fromUser.displayName || 'Someone',
        toId: toUserId,
        status: 'pending',
        timestamp: Date.now()
    });

    await createNotification(toUserId, {
        type: 'follow_request',
        senderName: fromUser.displayName || 'Someone',
        text: 'wants to connect with you.',
        groupId: fromUser.uid // Store requesterId
    });
};

/**
 * Accept a follow request
 */
export const acceptFollowRequest = async (requestId: string): Promise<void> => {
    const requestRef = doc(db, 'follow_requests', requestId);

    const res = await runTransaction(db, async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists()) throw new Error("Request no longer active.");

        const data = requestSnap.data() as FollowRequest;
        if (data.status !== 'pending') return null;

        const fromUserRef = doc(db, 'users', data.fromId);
        const toUserRef = doc(db, 'users', data.toId);

        // READ ALL DATA FIRST (required by Firestore transactions)
        const fromUserSnap = await transaction.get(fromUserRef);
        const toUserSnap = await transaction.get(toUserRef);

        if (!fromUserSnap.exists() || !toUserSnap.exists()) {
            throw new Error("User profiles not found.");
        }

        const fromUsername = fromUserSnap.data()?.username || 'User';
        const toUsername = toUserSnap.data()?.username || 'User';

        // PERFORM ALL WRITES SECOND
        // 1. Mark request as accepted
        transaction.update(requestRef, { status: 'accepted', updatedAt: Date.now() });

        // 2. Update social graph: fromUser gains a follower (toId follows fromId)
        //    i.e. fromId.followers += toId, toId.following += fromId
        transaction.update(fromUserRef, {
            followers: arrayUnion(data.toId)
        });
        transaction.update(toUserRef, {
            following: arrayUnion(data.fromId)
        });

        // 3. Create personal chat between the two
        const chatIds = [data.fromId, data.toId].sort();
        const chatId = chatIds.join('_');
        const chatRef = doc(db, 'personal_chats', chatId);

        transaction.set(chatRef, {
            id: chatId,
            userIds: chatIds,
            usernames: {
                [data.fromId]: fromUsername,
                [data.toId]: toUsername
            },
            lastActivity: Date.now(),
            unreadCounts: { [data.fromId]: 0, [data.toId]: 0 }
        }, { merge: true });

        return {
            fromId: data.fromId,
            toUsername,
            chatId
        };
    });

    if (res) {
        await createNotification(res.fromId, {
            type: 'follow_accept',
            senderName: res.toUsername,
            text: 'accepted your follow request!',
            groupId: res.chatId
        });
    }
};

/**
 * Decline a follow request
 */
export const declineFollowRequest = async (requestId: string): Promise<void> => {
    const requestRef = doc(db, 'follow_requests', requestId);
    const snap = await getDoc(requestRef);
    if (!snap.exists()) return;

    const data = snap.data() as FollowRequest;
    if (data.status !== 'pending') return;

    await updateDoc(requestRef, { status: 'declined' });

    // Notify requester
    await createNotification(data.fromId, {
        type: 'message',
        senderName: 'System',
        text: 'The other user isn’t accepting the follow request.',
    });
};

/**
 * Cancel a follow request (withdraw)
 */
export const cancelFollowRequest = async (toUserId: string): Promise<void> => {
    const fromUser = auth.currentUser;
    if (!fromUser) return;

    const requestsRef = collection(db, 'follow_requests');
    const q1 = query(requestsRef,
        where('fromId', '==', fromUser.uid),
        where('toId', '==', toUserId),
        where('status', '==', 'pending')
    );

    const snap = await getDocs(q1);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
};

/**
 * Get follow status between two users
 */
export const getFollowStatus = async (toUserId: string): Promise<'none' | 'pending' | 'accepted'> => {
    try {
        const fromUser = auth.currentUser;
        if (!fromUser) return 'none';
        if (fromUser.uid === toUserId) return 'none';

        const requestsRef = collection(db, 'follow_requests');
        const q1 = query(requestsRef, where('fromId', '==', fromUser.uid), where('toId', '==', toUserId));
        const q2 = query(requestsRef, where('fromId', '==', toUserId), where('toId', '==', fromUser.uid));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        const doc = snap1.docs[0] || snap2.docs[0];
        if (!doc) return 'none';

        const status = doc.data().status;
        if (status === 'declined') return 'none';
        return status as 'pending' | 'accepted';
    } catch (err) {
        console.error('[FollowService] getFollowStatus error:', err);
        return 'none';
    }
};

/**
 * Get pending follow requests for current user
 */
export const getPendingRequests = (callback: (requests: FollowRequest[]) => void) => {
    const user = auth.currentUser;
    if (!user) return () => { };

    const q = query(collection(db, 'follow_requests'),
        where('toId', '==', user.uid),
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snap) => {
        const reqs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as FollowRequest));
        callback(reqs);
    });
};
