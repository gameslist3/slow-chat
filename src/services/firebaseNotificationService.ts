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
    limit,
    increment,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Notification } from '../types';

/**
 * Create a new notification for a specific user
 */
export const createNotification = async (
    userId: string,
    data: {
        type: Notification['type'],
        senderName: string,
        text: string,
        groupId?: string,
        messageId?: string
    }
): Promise<void> => {
    // Check if group is muted by user (if applicable)
    if (data.groupId) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const mutedGroups = userDoc.data().mutedGroups || [];
            if (mutedGroups.includes(data.groupId)) return; // Muted
        }
    }

    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
        ...data,
        userId,
        timestamp: Date.now(),
        read: false
    });
};

/**
 * Subscribe to notifications for the current user
 */
export const subscribeToNotifications = (callback: (notifications: Notification[]) => void) => {
    const user = auth.currentUser;
    if (!user) return () => { };

    const q = query(collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snap) => {
        const notices = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
        callback(notices);
    });
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
    const noticeRef = doc(db, 'notifications', notificationId);
    await updateDoc(noticeRef, { read: true });
};

/**
 * Mark all notifications as read for current user
 */
export const markAllAsRead = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false)
    );
    const snap = await getDocs(q);

    const batch = writeBatch(db);
    snap.docs.forEach(d => {
        batch.update(d.ref, { read: true });
    });

    await batch.commit();
};
