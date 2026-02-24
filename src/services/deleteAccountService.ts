import {
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "firebase/auth";
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    writeBatch
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import * as firebaseGroupService from "./firebaseGroupService";
import * as firebaseMessageService from "./firebaseMessageService";

/**
 * PRODUCTION-REFINED ACCOUNT DELETION
 * Following the user's required automated behavior.
 */
export const deleteMyAccount = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("User not logged in or session expired.");

    try {
        console.log("🧨 Initializing FULL automated account purge...");

        // 1. REAUTHENTICATE USER (Required for security-sensitive delete)
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        console.log("✅ Identity verified.");

        const uid = user.uid;
        const batch = writeBatch(db);

        // 2. SOCIAL & NOTIFICATION CLEANUP (Batched)
        console.log("🔥 Purging notifications and social links...");

        // Notifications
        const notifSnap = await getDocs(query(collection(db, "notifications"), where("userId", "==", uid)));
        notifSnap.forEach(d => batch.delete(d.ref));

        // Follow Requests (Inbound)
        const fr1 = await getDocs(query(collection(db, "follow_requests"), where("fromId", "==", uid)));
        fr1.forEach(d => batch.delete(d.ref));

        // Follow Requests (Outbound)
        const fr2 = await getDocs(query(collection(db, "follow_requests"), where("toId", "==", uid)));
        fr2.forEach(d => batch.delete(d.ref));

        // 3. SERVICE-BASED CLEANUP (Complex logic)
        // Note: These use their own batches/transactions for integrity

        // Exiting Groups (Purges messages + decrements member counts)
        console.log("🔥 Exiting group memberships...");
        const groupsSnap = await getDocs(query(collection(db, "groups"), where("memberIds", "array-contains", uid)));
        for (const g of groupsSnap.docs) {
            await firebaseGroupService.leaveGroup(g.id, uid).catch((e: any) => console.warn(`Group cleanup skip: ${g.id}`, e));
        }

        // Personal Chats (Full wipe of messages + chat records)
        console.log("🔥 Terminating personal conversations...");
        const chatsSnap = await getDocs(query(collection(db, "personal_chats"), where("userIds", "array-contains", uid)));
        for (const c of chatsSnap.docs) {
            await firebaseMessageService.terminatePersonalChat(c.id).catch((e: any) => console.warn(`Chat cleanup skip: ${c.id}`, e));
        }

        // 4. FINAL IDENTITY PURGE
        // Sessions / Sync protocols
        const syncSnap = await getDocs(collection(db, 'sync_sessions'));
        syncSnap.docs.forEach(d => {
            const data = d.data();
            if (data.ownerId === uid || data.newDeviceId === uid || d.id.includes(uid)) {
                batch.delete(d.ref);
            }
        });

        // The Root User Document
        batch.delete(doc(db, "users", uid));

        // COMMIT FIRESTORE CHANGES
        await batch.commit();
        console.log("✅ Firestore data wiped.");

        // 5. TERMINATE AUTH USER (Releases email for reuse)
        await deleteUser(user);
        console.log("💀 Firebase Authentication user deleted.");

        // 6. LOCAL SANITIZATION
        localStorage.clear();
        sessionStorage.clear();
        // Clear E2EE Vault if possible (handled in UI usually, but adding for safety)

        console.log("✨ Deletion complete. Redirecting...");
        window.location.href = "/signup";

    } catch (err: any) {
        console.error("❌ Critical termination failure:", err);
        throw err;
    }
};
