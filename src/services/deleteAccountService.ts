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
    writeBatch,
    arrayRemove,
    increment,
    deleteDoc
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export const deleteAccount = async (password: string) => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("User not logged in");

    try {
        console.log("🧨 Starting FULL account deletion...");

        // -----------------------------
        // STEP 1: REAUTHENTICATE USER
        // -----------------------------
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        console.log("✅ Re-authentication success");

        const uid = user.uid;
        const batch = writeBatch(db);

        // -----------------------------
        // STEP 2: DELETE USER DOC
        // -----------------------------
        batch.delete(doc(db, "users", uid));

        // -----------------------------
        // STEP 3: DELETE NOTIFICATIONS
        // -----------------------------
        const notifSnap = await getDocs(
            query(collection(db, "notifications"), where("userId", "==", uid))
        );
        notifSnap.forEach(d => batch.delete(d.ref));

        // -----------------------------
        // STEP 4: DELETE FOLLOW REQUESTS
        // -----------------------------
        const fr1 = await getDocs(
            query(collection(db, "follow_requests"), where("fromId", "==", uid))
        );
        fr1.forEach(d => batch.delete(d.ref));

        const fr2 = await getDocs(
            query(collection(db, "follow_requests"), where("toId", "==", uid))
        );
        fr2.forEach(d => batch.delete(d.ref));

        // -----------------------------
        // STEP 5: DELETE PERSONAL CHATS (only those the user is in)
        // -----------------------------
        const chatSnap = await getDocs(
            query(collection(db, "personal_chats"), where("userIds", "array-contains", uid))
        );

        for (const chatDoc of chatSnap.docs) {
            // delete messages
            const msgSnap = await getDocs(
                collection(db, `personal_chats/${chatDoc.id}/messages`)
            );
            msgSnap.forEach(m => batch.delete(m.ref));

            batch.delete(chatDoc.ref);
        }

        // -----------------------------
        // STEP 6: REMOVE USER FROM GROUPS
        // -----------------------------
        const groupsSnap = await getDocs(
            query(collection(db, "groups"), where("memberIds", "array-contains", uid))
        );
        groupsSnap.forEach(g => {
            batch.update(g.ref, {
                memberIds: arrayRemove(uid),
                members: increment(-1)
            });
        });

        // -----------------------------
        // COMMIT FIRESTORE DELETE
        // -----------------------------
        await batch.commit();
        console.log("🔥 Firestore data deleted");

        // -----------------------------
        // STEP 7: DELETE AUTH USER
        // -----------------------------
        await deleteUser(user);
        console.log("💀 Auth user deleted");

        // -----------------------------
        // STEP 8: CLEAR SESSION
        // -----------------------------
        localStorage.clear();
        sessionStorage.clear();

        window.location.href = "/signup";

    } catch (err: any) {
        console.error("❌ Delete account error:", err);

        if (err.code === "auth/wrong-password") {
            throw new Error("Wrong password");
        } else {
            throw new Error("Account deletion failed");
        }
    }
};
