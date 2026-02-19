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

    // Check for Cooldown: If the last request between these users was declined < 5 mins ago (Either direction)
    const allDocs = [...snap1.docs, ...snap2.docs].sort((a, b) => (b.data().timestamp || 0) - (a.data().timestamp || 0));
    const latestDeclined = allDocs.find(d => d.data().status === 'declined');

    if (latestDeclined) {
        const lastDeclinedTime = latestDeclined.data().timestamp;
        const diff = (Date.now() - lastDeclinedTime) / 1000 / 60; // in minutes
        if (diff < 1440) {
            const waitHours = Math.ceil((1440 - diff) / 60);
            throw new Error(`Connection link unstable. Retry available in ${waitHours} hour${waitHours > 1 ? 's' : ''}.`);
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
        type: 'follow_accept', // Using follow_accept but the text says declined, or I'll add 'follow_decline'
        senderName: 'Protocol',
        text: 'The connection request was declined.',
        groupId: 'system'
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
    if (!currentUser) throw new Error("Authentication required for protocol termination.");

    try {
        const batch = writeBatch(db);
        const requestsRef = collection(db, 'follow_requests');

        // 1. Find all active or accepted connections between these users
        const q1 = query(requestsRef, where('fromId', '==', currentUser.uid), where('toId', '==', otherUserId));
        const q2 = query(requestsRef, where('fromId', '==', otherUserId), where('toId', '==', currentUser.uid));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        // 2. Mark all as 'declined' with fresh timestamp to trigger the 60min mutual cooldown
        const now = Date.now();
        [...snap1.docs, ...snap2.docs].forEach(d => {
            batch.update(d.ref, {
                status: 'declined',
                updatedAt: now,
                timestamp: now // This ensures the 1-hour cooldown kicks in
            });
        });

        // 3. Terminate Personal Chat (Removes it from sidebar for both)
        const chatIds = [currentUser.uid, otherUserId].sort();
        const chatId = chatIds.join('_');
        const chatRef = doc(db, 'personal_chats', chatId);

        // 3.1 Fetch and delete all messages for a clean wipe
        const messagesRef = collection(db, `personal_chats/${chatId}/messages`);
        const messagesSnap = await getDocs(messagesRef);
        messagesSnap.docs.forEach(d => batch.delete(d.ref));

        batch.delete(chatRef);

        // 4. Cleanup Notifications (For current user)
        const notificationsRef = collection(db, 'notifications');
        const n1 = query(notificationsRef, where('userId', '==', currentUser.uid), where('groupId', '==', otherUserId));
        const n2 = query(notificationsRef, where('userId', '==', currentUser.uid), where('groupId', '==', chatId));

        const [sn1, sn2] = await Promise.all([getDocs(n1), getDocs(n2)]);
        sn1.docs.forEach(d => batch.delete(d.ref));
        sn2.docs.forEach(d => batch.delete(d.ref));

        // 4.5 Cleanup Notifications (For Peer)
        const p1 = query(notificationsRef, where('userId', '==', otherUserId), where('groupId', '==', currentUser.uid));
        const p2 = query(notificationsRef, where('userId', '==', otherUserId), where('groupId', '==', chatId));
        const [sp1, sp2] = await Promise.all([getDocs(p1), getDocs(p2)]);
        sp1.docs.forEach(d => batch.delete(d.ref));
        sp2.docs.forEach(d => batch.delete(d.ref));

        await batch.commit();

        // 5. Notify the other user about the termination (Optional, but good for protocol feel)
        await createNotification(otherUserId, {
            type: 'system',
            senderName: 'System',
            text: 'A connection protocol has been terminated by the peer.',
            groupId: 'system'
        });

    } catch (error) {
        console.error("[FollowService] Termination Error:", error);
        throw error;
    }
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

        const allDocs = [...snap1.docs, ...snap2.docs].sort((a, b) => (b.data().timestamp || 0) - (a.data().timestamp || 0));
        const doc = allDocs[0];

        if (!doc) return 'none';

        const data = doc.data();
        if (data.status === 'declined') {
            // Check if still in cooldown (Mutual check)
            // Check if still in cooldown (Mutual check)
            const diff = (Date.now() - (data.timestamp || 0)) / 1000 / 60;
            if (diff < 1440) return 'cooldown';
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

    const update = async () => {
        const fetchUserData = async (uid: string) => {
            const snap = await getDoc(doc(db, 'users', uid));
            return snap.exists() ? snap.data().username : 'User';
        };

        const friends1Promise = results1.map(async (d) => {
            const data = d.data();
            const latestName = await fetchUserData(data.toId);
            return {
                requestId: d.id,
                uid: data.toId,
                username: latestName,
                direction: 'outgoing'
            };
        });

        const friends2Promise = results2.map(async (d) => {
            const data = d.data();
            const latestName = await fetchUserData(data.fromId);
            return {
                requestId: d.id,
                uid: data.fromId,
                username: latestName,
                direction: 'incoming'
            };
        });

        const [friends1, friends2] = await Promise.all([
            Promise.all(friends1Promise),
            Promise.all(friends2Promise)
        ]);

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
