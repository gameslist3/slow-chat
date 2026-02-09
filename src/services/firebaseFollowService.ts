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

    // Check for active connections (Pending or Accepted)
    const active1 = snap1.docs.find(d => d.data().status !== 'declined');
    const active2 = snap2.docs.find(d => d.data().status !== 'declined');

    if (active1 || active2) {
        throw new Error("A connection protocol is already active between these users.");
    }

    // Check for Cooldown: If the last request from this user was declined < 5 mins ago
    const declinedReq = snap1.docs
        .filter(d => d.data().status === 'declined')
        .sort((a, b) => b.data().timestamp - a.data().timestamp)[0];

    if (declinedReq) {
        const lastDeclinedTime = declinedReq.data().timestamp;
        const diff = (Date.now() - lastDeclinedTime) / 1000 / 60; // in minutes
        if (diff < 5) {
            const wait = Math.ceil(5 - diff);
            throw new Error(`Connection request declined. Protocol reset in ${wait} minute${wait > 1 ? 's' : ''}.`);
        }
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

        // READ ALL DATA FIRST
        const fromUserSnap = await transaction.get(fromUserRef);
        const toUserSnap = await transaction.get(toUserRef);

        if (!fromUserSnap.exists() || !toUserSnap.exists()) {
            throw new Error("User profiles not found.");
        }

        // PERFORM ALL WRITES SECOND
        transaction.update(requestRef, {
            status: 'accepted',
            updatedAt: Date.now()
        });

        const chatIds = [data.fromId, data.toId].sort();
        const chatId = chatIds.join('_');
        const chatRef = doc(db, 'personal_chats', chatId);

        transaction.set(chatRef, {
            id: chatId,
            userIds: chatIds,
            usernames: {
                [data.fromId]: fromUserSnap.data()?.username || 'User',
                [data.toId]: toUserSnap.data()?.username || 'User'
            },
            lastActivity: Date.now(),
            unreadCounts: { [data.fromId]: 0, [data.toId]: 0 }
        }, { merge: true });

        return {
            fromId: data.fromId,
            toUsername: toUserSnap.data()?.username || 'Someone',
            chatId: chatId
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

    await updateDoc(requestRef, {
        status: 'declined',
        updatedAt: Date.now()
    });

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
 * Unfollow a user (Delete connection and chat)
 */
export const unfollowUser = async (otherUserId: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Auth required");

    const batch = writeBatch(db);
    const requestsRef = collection(db, 'follow_requests');

    // 1. Delete ALL follow requests between these users (any status)
    const q1 = query(requestsRef, where('fromId', '==', currentUser.uid), where('toId', '==', otherUserId));
    const q2 = query(requestsRef, where('fromId', '==', otherUserId), where('toId', '==', currentUser.uid));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    snap1.docs.forEach(d => batch.delete(d.ref));
    snap2.docs.forEach(d => batch.delete(d.ref));

    // 2. Delete the personal chat
    const chatIds = [currentUser.uid, otherUserId].sort();
    const chatId = chatIds.join('_');
    const chatRef = doc(db, 'personal_chats', chatId);
    batch.delete(chatRef);

    // 3. Delete related notifications for CURRENT USER ONLY
    const notificationsRef = collection(db, 'notifications');
    const n1 = query(notificationsRef, where('userId', '==', currentUser.uid), where('groupId', '==', otherUserId));
    const n3 = query(notificationsRef, where('userId', '==', currentUser.uid), where('groupId', '==', chatId));

    const [sn1, sn3] = await Promise.all([getDocs(n1), getDocs(n3)]);

    sn1.docs.forEach(d => batch.delete(d.ref));
    sn3.docs.forEach(d => batch.delete(d.ref));

    await batch.commit();
};

/**
 * Get follow status between two users
 */
export const getFollowStatus = async (toUserId: string): Promise<'none' | 'pending' | 'accepted' | 'cooldown'> => {
    try {
        const fromUser = auth.currentUser;
        if (!fromUser) return 'none';
        if (fromUser.uid === toUserId) return 'none';

        const requestsRef = collection(db, 'follow_requests');
        const q1 = query(requestsRef, where('fromId', '==', fromUser.uid), where('toId', '==', toUserId));
        const q2 = query(requestsRef, where('fromId', '==', toUserId), where('toId', '==', fromUser.uid));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        const doc = snap1.docs.sort((a, b) => b.data().timestamp - a.data().timestamp)[0] || snap2.docs[0];
        if (!doc) return 'none';

        const data = doc.data();
        if (data.status === 'declined') {
            // Check if still in cooldown
            const diff = (Date.now() - data.timestamp) / 1000 / 60;
            if (diff < 5 && data.fromId === fromUser.uid) return 'cooldown';
            return 'none';
        }
        return data.status as 'pending' | 'accepted';
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
        orderBy('timestamp', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snap) => {
        const reqs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as FollowRequest));

        // Filter: Pending OR (Accepted/Declined AND updatedAt within 10 mins)
        const tenMins = 10 * 60 * 1000;
        const now = Date.now();
        const filtered = reqs.filter(r => {
            if (r.status === 'pending') return true;
            if (r.updatedAt && (now - r.updatedAt < tenMins)) return true;
            return false;
        });

        callback(filtered);
    });
};
/**
 * Subscribe to mutual friends (accepted follow requests)
 */
export const subscribeToFriends = (userId: string, callback: (friends: any[]) => void) => {
    const q1 = query(collection(db, 'follow_requests'),
        where('fromId', '==', userId),
        where('status', '==', 'accepted')
    );
    const q2 = query(collection(db, 'follow_requests'),
        where('toId', '==', userId),
        where('status', '==', 'accepted')
    );

    let results1: any[] = [];
    let results2: any[] = [];

    const update = () => {
        const friends1 = results1.map(d => {
            const data = d.data();
            return {
                requestId: d.id,
                uid: data.toId,
                username: data.toUsername || 'User',
                direction: 'outgoing'
            };
        });

        const friends2 = results2.map(d => {
            const data = d.data();
            return {
                requestId: d.id,
                uid: data.fromId,
                username: data.fromUsername || 'User',
                direction: 'incoming'
            };
        });

        const combined = [...friends1, ...friends2];
        const uniqueFriends = Array.from(new Map(combined.map(item => [item.uid, item])).values());

        callback(uniqueFriends);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
        results1 = snap.docs;
        update();
    });

    const unsub2 = onSnapshot(q2, (snap) => {
        results2 = snap.docs;
        update();
    });

    return () => {
        unsub1();
        unsub2();
    };
};

/**
 * Get all friends (Accepted connections)
 */
export const getFriends = async (userId: string): Promise<any[]> => {
    const requestsRef = collection(db, 'follow_requests');
    const q1 = query(requestsRef, where('fromId', '==', userId), where('status', '==', 'accepted'));
    const q2 = query(requestsRef, where('toId', '==', userId), where('status', '==', 'accepted'));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const friends: any[] = [];

    // I'll use a Map to avoid duplicates and handle user details
    const friendMap = new Map();

    for (const d of snap1.docs) {
        const data = d.data();
        friendMap.set(data.toId, { id: data.toId, username: '...' }); // Needs detail fetching
    }
    for (const d of snap2.docs) {
        const data = d.data();
        friendMap.set(data.fromId, { id: data.fromId, username: data.fromUsername });
    }

    return Array.from(friendMap.values());
};
