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
import { db } from '../config/firebase';
import { Group } from '../types';

export const CATEGORIES = [
    "Philosophy", "Technology", "Art", "Music", "Mindfulness",
    "Books", "Cinema", "Food", "Travel", "Nature"
];

export const ICONS = ["🌟", "🔥", "💧", "🍀", "🎭", "🎨", "🚀", "🌙", "🎵", "📚", "☕", "🍕"];

/**
 * Get all groups (Snapshot)
 */
export const getGroups = async (): Promise<Group[]> => {
    try {
        const q = query(collection(db, 'groups'), orderBy('lastActivity', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Group));
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
        const groups = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Group));
        callback(groups);
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

        transaction.update(groupRef, {
            members: increment(1),
            memberCount: increment(1),
            memberIds: arrayUnion(userId),
            lastActivity: Date.now()
        });

        transaction.update(userRef, {
            joinedGroups: arrayUnion(groupId)
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

        const batch = writeBatch(db);
        messagesSnap.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // 2. Remove user from group (Transaction)
        await runTransaction(db, async (transaction) => {
            const groupSnap = await transaction.get(groupRef);
            if (!groupSnap.exists()) return;

            transaction.update(groupRef, {
                members: increment(-1),
                memberCount: increment(-1),
                memberIds: arrayRemove(userId)
            });

            transaction.update(userRef, {
                joinedGroups: arrayRemove(groupId),
                mutedGroups: arrayRemove(groupId)
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
            name: 'System Intelligence',
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
