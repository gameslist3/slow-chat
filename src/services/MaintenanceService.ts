import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const MaintenanceService = {
    /**
     * WIPES ALL DATA (Development use only)
     * Collections: users, groups, personal_chats, follow_requests, notifications
     */
    async wipeDatabase() {
        console.warn("[Maintenance] WIPING ALL DATABASE COLLECTIONS...");
        const collections = ['users', 'groups', 'personal_chats', 'follow_requests', 'notifications'];

        for (const collName of collections) {
            try {
                const collRef = collection(db, collName);
                const snapshot = await getDocs(collRef);

                if (snapshot.empty) {
                    console.log(`[Maintenance] Collection ${collName} is already empty.`);
                    continue;
                }

                console.log(`[Maintenance] Deleting ${snapshot.size} docs from ${collName}...`);

                const docs = snapshot.docs;
                // Delete in batches of 400
                for (let i = 0; i < docs.length; i += 400) {
                    const batch = writeBatch(db);
                    const chunk = docs.slice(i, i + 400);

                    for (const d of chunk) {
                        // If it's a personal_chat or group, we should ideally wipe subcollections too
                        // But for a "Hard Reset", wiping the primary docs is usually enough to 
                        // break all pointers and start fresh.
                        batch.delete(d.ref);
                    }
                    await batch.commit();
                }
                console.log(`[Maintenance] Collection ${collName} wiped.`);
            } catch (err) {
                console.error(`[Maintenance] Failed to wipe ${collName}:`, err);
            }
        }

        console.log("[Maintenance] DATABASE WIPE COMPLETE. PLEASE REFRESH ALL CLIENTS.");
    },

    /**
     * Enforce Auto-Delete Group Rules
     * Runs periodically to delete groups that violate the rules:
     * 1. 24 hours of inactivity
     * 2. < 2 members for 12 hours
     */
    async enforceGroupAutoDelete() {
        console.log("[Maintenance] Running Group Auto-Delete Check...");
        try {
            const groupsRef = collection(db, 'groups');
            const snapshot = await getDocs(groupsRef);

            const now = Date.now();
            const ONE_HOUR = 60 * 60 * 1000;
            const INACTIVITY_LIMIT = 24 * ONE_HOUR;
            const LOW_MEMBER_LIMIT = 12 * ONE_HOUR;

            let deletedCount = 0;

            for (const groupDoc of snapshot.docs) {
                const data = groupDoc.data();
                const createdAt = data.createdAt || now;
                const lastActivity = data.lastActivity || createdAt;
                const memberCount = data.memberCount || 0;

                // Rule 1: 24h Inactivity
                const inactiveTime = now - lastActivity;
                const rulesViolated = [];

                if (inactiveTime > INACTIVITY_LIMIT) {
                    rulesViolated.push(`Inactive for ${(inactiveTime / ONE_HOUR).toFixed(1)}h (Limit: 24h)`);
                }

                // Rule 2: < 2 members for 12 hours
                // To safely implement this without tracking exact drop times per group,
                // we assume if a group has 1 member AND was created > 12h ago, it violates.
                const age = now - createdAt;
                if (memberCount < 2 && age > LOW_MEMBER_LIMIT) {
                    rulesViolated.push(`Underpopulated (<2 users) for ${(age / ONE_HOUR).toFixed(1)}h (Limit: 12h)`);
                }

                if (rulesViolated.length > 0) {
                    console.log(`[Maintenance] Deleting Group ${groupDoc.id} due to: ${rulesViolated.join(', ')}`);

                    // In a production environment with Cloud Functions, we'd also delete subcollections (messages, media).
                    // For client-side maintenance, we delete the parent doc which severs access.
                    await deleteDoc(doc(db, 'groups', groupDoc.id));
                    deletedCount++;
                }
            }

            console.log(`[Maintenance] Group Auto-Delete Complete. Removed ${deletedCount} groups.`);
        } catch (err) {
            console.error("[Maintenance] Group Auto-Delete failed:", err);
        }
    }
};
