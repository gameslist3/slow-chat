import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    Timestamp,
    writeBatch,
    runTransaction,
    increment,
    limit
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Group } from '../types';

export const CATEGORIES = [
    "Philosophy", "Technology", "Art", "Music", "Mindfulness",
    "Books", "Cinema", "Food", "Travel", "Nature"
];

export const ICONS = ["🌟", "🔥", "💧", "🍀", "🎭", "🎨", "🚀", "🌙", "🎵", "📚", "☕", "🍕"];

/**
 * Check if a group has expired based on business rules:
 * - 1 Member AND Inactive for > 5 hours = Expired
 * - >1 Member AND Inactive for > 10 hours = Expired
 */
const isGroupExpired = (g: Group): boolean => {
    // System Groups don't expire
    if (g.id === 'system-updates') return false;

    const now = Date.now();
    const inactivityTime = now - (g.lastActivity || g.createdAt);
    const mCount = g.memberIds?.length || g.memberCount || 0;

    const hours5 = 5 * 60 * 60 * 1000;
    const hours10 = 10 * 60 * 60 * 1000;

    if (mCount <= 1 && inactivityTime > hours5) return true;
    if (mCount > 1 && inactivityTime > hours10) return true;

    return false;
};

/**
 * Lazily removes an expired group from Firestore
 */
const performLazyCleanup = async (groupId: string) => {
    try {
        const groupRef = doc(db, 'groups', groupId);
        await deleteDoc(groupRef);
        console.log(`[Auto-Delete] Expired group ${groupId} pruned.`);
    } catch (e) {
        console.warn(`[Auto-Delete] Could not prune group ${groupId}.`);
    }
};

/**
 * Get all groups (Snapshot)
 */
export const getGroups = async (): Promise<Group[]> => {
    try {
        const q = query(collection(db, 'groups'), orderBy('lastActivity', 'desc'));
        const snap = await getDocs(q);
        const groups = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Group));

        return groups.filter(g => {
            if (isGroupExpired(g)) {
                performLazyCleanup(g.id);
                return false;
            }
            return true;
        });
    } catch (error) {
        console.error('Error getting groups:', error);
        return [];
    }
};

/**
 * Subscribe to groups (Real-time)
 */
export const subscribeToGroups = (callback: (groups: Group[]) => void) => {
    const q = query(collection(db, 'groups'), orderBy('lastActivity', 'desc'));
    return onSnapshot(q, (snapshot) => {
        if (!auth.currentUser) return;

        const validGroups: Group[] = [];
        snapshot.docs.forEach(doc => {
            const g = { ...doc.data(), id: doc.id } as Group;
            if (isGroupExpired(g)) {
                performLazyCleanup(g.id);
            } else {
                validGroups.push(g);
            }
        });

        callback(validGroups);
    }, (error) => {
        if (error.code === 'permission-denied') return;
        console.error('[Firestore] Groups Subscription Error:', error);
    });
};

/**
 * Subscribe specifically to groups where user is a member
 */
export const subscribeToJoinedGroups = (userId: string, callback: (groups: Group[]) => void) => {
    const q = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', userId)
    );
    return onSnapshot(q, (snapshot) => {
        const validGroups: Group[] = [];

        snapshot.docs.forEach(doc => {
            const g = { ...doc.data(), id: doc.id } as Group;
            if (isGroupExpired(g)) {
                performLazyCleanup(g.id);
            } else {
                validGroups.push(g);
            }
        });

        validGroups.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
        callback(validGroups);
    }, (error) => {
        if (error.code === 'permission-denied') return;
        console.error('[Firestore] Joined Groups Subscription Error:', error);
    });
};

/**
 * Create a new group
 */
export const createGroup = async (
    name: string,
    category: string,
    image: string,
    creatorName: string,
    creatorId: string
): Promise<Group> => {
    const groupId = crypto.randomUUID();
    const now = Date.now();

    const newGroup: Group = {
        id: groupId,
        name,
        category,
        image,
        members: 1,
        memberCount: 1, // Explicit field for auto-delete rules
        memberIds: [creatorId],
        createdAt: now,
        createdBy: creatorId,
        description: '',
        lastActivity: now,
        mutedBy: []
    };

    await setDoc(doc(db, 'groups', groupId), newGroup);

    // Add creator to group membership list in user doc
    const userRef = doc(db, 'users', creatorId);
    await updateDoc(userRef, { joinedGroups: arrayUnion(groupId) });

    return newGroup;
};

/**
 * Join a group
 */
export const joinGroup = async (groupId: string, userId: string): Promise<void> => {
    const groupRef = doc(db, 'groups', groupId);
    const userRef = doc(db, 'users', userId);

    await runTransaction(db, async (transaction) => {
        const groupSnap = await transaction.get(groupRef);
        if (!groupSnap.exists()) throw new Error("Group not found");

        const groupData = groupSnap.data() as Group;
        if (groupData.memberIds.includes(userId)) return;

        const newCount = (groupData.memberIds?.length || 0) + 1;

        transaction.update(groupRef, {
            members: newCount,
            memberCount: newCount,
            memberIds: arrayUnion(userId),
            lastActivity: Date.now()
        });

        transaction.update(userRef, {
            joinedGroups: arrayUnion(groupId),
            [`groupJoinTimes.${groupId}`]: Date.now()
        });
    });
};

/**
 * Leave a group
 */
export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
    const groupRef = doc(db, 'groups', groupId);
    const userRef = doc(db, 'users', userId);

    try {
        // 1. Data Privacy: Delete all messages sent by this user in this group
        const messagesRef = collection(db, `groups/${groupId}/messages`);
        const q = query(messagesRef, where('senderId', '==', userId));
        const messagesSnap = await getDocs(q);

        const docs = messagesSnap.docs;
        for (let i = 0; i < docs.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + 400);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }

        // 2. Remove user from group (Transaction)
        await runTransaction(db, async (transaction) => {
            const groupSnap = await transaction.get(groupRef);
            if (!groupSnap.exists()) return;

            const groupData = groupSnap.data() as Group;
            const newCount = Math.max(0, (groupData.memberIds?.length || 1) - 1);

            transaction.update(groupRef, {
                members: newCount,
                memberCount: newCount,
                memberIds: arrayRemove(userId)
            });

            // Clean up groupJoinTimes record completely upon leaving
            transaction.update(userRef, {
                joinedGroups: arrayRemove(groupId),
                mutedGroups: arrayRemove(groupId),
                [`groupJoinTimes.${groupId}`]: 0 // Resetting or deleting is fine, 0 works as a flag
            });
        });
    } catch (error) {
        console.error("Error leaving group:", error);
        throw error;
    }
};

/**
 * Mute / Unmute a group
 */
export const toggleMuteGroup = async (groupId: string, userId: string, mute: boolean): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const groupRef = doc(db, 'groups', groupId);

    if (mute) {
        await updateDoc(userRef, { mutedGroups: arrayUnion(groupId) });
        await updateDoc(groupRef, { mutedBy: arrayUnion(userId) });
    } else {
        await updateDoc(userRef, { mutedGroups: arrayRemove(groupId) });
        await updateDoc(groupRef, { mutedBy: arrayRemove(userId) });
    }
};

/**
 * Check if group is muted by user
 */
export const isMuted = async (groupId: string, userId: string): Promise<boolean> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;
    const mutedGroups = userSnap.data().mutedGroups || [];
    return mutedGroups.includes(groupId);
};

/**
 * Initialize a global system group for announcements
 */
export const initializeSystemGroup = async (): Promise<void> => {
    const sysId = 'system-updates';
    const sysRef = doc(db, 'groups', sysId);
    const snap = await getDoc(sysRef);

    if (!snap.exists()) {
        const now = Date.now();
        await setDoc(sysRef, {
            id: sysId,
            name: 'Gapes Team',
            category: 'Updates',
            image: '📡',
            members: 0,
            memberIds: [],
            createdAt: now,
            createdBy: 'system',
            description: 'Core system synchronization and protocol updates.',
            lastActivity: now,
            mutedBy: []
        });
    }
};

/**
 * Seed initial groups if none exist
 */
export const initializeSeedGroups = async (): Promise<void> => {
    const q = query(collection(db, 'groups'), limit(1));
    const snap = await getDocs(q);

    // Only seed if we only have the system group or none at all
    if (snap.size <= 1) {
        const now = Date.now();
        const seeds = [
            { id: 'nexus-philosophy', name: 'Philosophy', category: 'Philosophy', image: '🎭' },
            { id: 'nexus-tech', name: 'Future Tech', category: 'Technology', image: '🚀' },
            { id: 'nexus-art', name: 'Digital Art', category: 'Art', image: '🎨' },
            { id: 'nexus-music', name: 'Deep Beats', category: 'Music', image: '🎵' }
        ];

        for (const s of seeds) {
            await setDoc(doc(db, 'groups', s.id), {
                ...s,
                members: 0,
                memberIds: [],
                createdAt: now,
                createdBy: 'system',
                description: `A place for asynchronous ${s.category.toLowerCase()} coordination.`,
                lastActivity: now,
                mutedBy: []
            });
        }
    }
};

/**
 * DANGER: ONE-TIME CLEANUP
 * Removes all groups, their messages, and clears user membership.
 */
export const dangerouslyNukeAllGroups = async (): Promise<void> => {
    try {
        const groupsSnap = await getDocs(collection(db, 'groups'));
        const usersSnap = await getDocs(collection(db, 'users'));
        const batch = writeBatch(db);

        // 1. Delete all groups and messages
        for (const groupDoc of groupsSnap.docs) {
            const groupId = groupDoc.id;
            // Delete messages subcollection
            const messagesSnap = await getDocs(collection(db, `groups/${groupId}/messages`));
            messagesSnap.docs.forEach(m => batch.delete(m.ref));
            // Delete group doc
            batch.delete(groupDoc.ref);
        }

        // 2. Clear user group references
        usersSnap.docs.forEach(u => {
            batch.update(u.ref, {
                joinedGroups: [],
                mutedGroups: [],
                unreadCount: 0
            });
        });

        await batch.commit();
        console.log("SUCCESS: Database purged of legacy group data.");

        // 3. Re-initialize system group
        await initializeSystemGroup();
    } catch (error) {
        console.error("Cleanup failed:", error);
    }
};

// --- End of Service ---

/**
 * Update group last activity (and potentially other metadata)
 */
export const updateGroupLastActivity = async (groupId: string): Promise<void> => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, { lastActivity: Date.now() });
};
