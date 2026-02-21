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
    }
};
