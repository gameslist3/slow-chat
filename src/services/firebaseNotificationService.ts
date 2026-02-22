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
        groupName?: string,
        groupImage?: string,
        messageId?: string
    }
): Promise<void> => {
    // Check if group is muted by user (if applicable)
    // CRITICAL: Friend requests bypass mute checks
    if (data.groupId && data.type !== 'follow_request') {
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
 * Subscribe to notifications with diagnostic logging
 */
export const subscribeToNotifications = (uid: string, callback: (notifications: Notification[]) => void) => {
    if (!uid) return () => { };

    console.log("[NotificationService] Subscribing for UID:", uid);

    const q = query(collection(db, 'notifications'),
        where('userId', '==', uid),
        orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snap) => {
        if (!auth.currentUser) return;
        const notices = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
        console.log(`[NotificationService] Sync complete. Count: ${notices.length}`);
        callback(notices);
    }, (error) => {
        console.error("Critical: Notification sync failed. Check Firestore Indexes.", error);
    });
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId: string, extra?: { followStatus?: 'accepted' | 'declined' }): Promise<void> => {
    const noticeRef = doc(db, 'notifications', notificationId);
    await updateDoc(noticeRef, {
        read: true,
        updatedAt: Date.now(),
        ...extra
    });
};

/**
 * Mark all notifications as read for current user
 */
export const markAllAsRead = async (uid: string): Promise<void> => {
    if (!uid) return;

    try {
        const batch = writeBatch(db);

        // 1. Update user document cleared timestamp
        const userRef = doc(db, 'users', uid);
        batch.update(userRef, {
            notificationsClearedAt: Date.now()
        });
        await batch.commit(); // Commit the user document update separately

        // 2. Mark existing unread notifications as read (Chunked for batch limits)
        const q = query(collection(db, 'notifications'),
            where('userId', '==', uid),
            where('read', '==', false)
        );
        const snap = await getDocs(q);
        const docs = snap.docs;

        for (let i = 0; i < docs.length; i += 450) {
            const b = writeBatch(db);
            const chunk = docs.slice(i, i + 450);
            chunk.forEach(d => {
                const data = d.data();
                if (data.type === 'follow_request') {
                    // Keep friend requests, maybe mark as read? 
                    // User says "Pending friend requests stay until accepted/declined"
                    // If we mark as read, they won't show in unread count.
                    // Let's just skip them to keep them unread and visible.
                } else {
                    b.delete(d.ref);
                }
            });
            await b.commit();
        }

        console.log("[NotificationService] Everything marked read and cleared barrier updated.");
    } catch (error) {
        console.error("[NotificationService] markAllAsRead Error:", error);
    }
};

/**
 * Permanent cleanup of expired notifications from DB
 */
export const cleanupNotifications = async (uid: string, autoDeleteHours: number): Promise<void> => {
    if (!uid) return;
    const threshold = Date.now() - (autoDeleteHours * 60 * 60 * 1000);

    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', uid),
            where('timestamp', '<=', threshold)
        );
        const snap = await getDocs(q);

        // Don't delete friend requests during auto-cleanup
        const toDelete = snap.docs.filter(d => d.data().type !== 'follow_request');

        if (toDelete.length === 0) return;

        const batch = writeBatch(db);
        toDelete.forEach(d => batch.delete(d.ref));
        await batch.commit();
        console.log(`[NotificationService] Auto-cleanup: Removed ${toDelete.length} expired records.`);
    } catch (error) {
        console.error("[NotificationService] Cleanup Error:", error);
    }
};
