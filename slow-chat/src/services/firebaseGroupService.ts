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
    } catch (error: any) {
        console.warn('[Groups] Ordered query failed, trying unordered fallback:', error?.code);
        try {
            // Fallback: fetch without ordering (works even if lastActivity is missing on some docs)
            const snap = await getDocs(collection(db, 'groups'));
            return snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Group));
        } catch (fallbackError) {
            console.error('[Groups] Error getting groups:', fallbackError);
            return [];
        }
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

    await runTransaction(db, async (transaction) => {
        const groupSnap = await transaction.get(groupRef);
        if (!groupSnap.exists()) return;

        transaction.update(groupRef, {
            members: increment(-1),
            memberIds: arrayRemove(userId)
        });

        transaction.update(userRef, {
            joinedGroups: arrayRemove(groupId),
            mutedGroups: arrayRemove(groupId)
        });
    });
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
    // Disabled per user request: We no longer auto-generate seed groups.
    return;
};

// --- End of Service ---
