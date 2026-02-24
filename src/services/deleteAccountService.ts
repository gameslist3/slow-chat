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
        // STEP 5: DELETE PERSONAL CHATS
        // -----------------------------
        const chatSnap = await getDocs(collection(db, "personal_chats"));

        for (const chatDoc of chatSnap.docs) {
            const data = chatDoc.data();
            if (data.userIds?.includes(uid)) {

                // delete messages
                const msgSnap = await getDocs(
                    collection(db, `personal_chats/${chatDoc.id}/messages`)
                );
                msgSnap.forEach(m => batch.delete(m.ref));

                batch.delete(chatDoc.ref);
            }
        }

        // -----------------------------
        // STEP 6: REMOVE USER FROM GROUPS
        // -----------------------------
        const groupsSnap = await getDocs(collection(db, "groups"));
        groupsSnap.forEach(g => {
            const members = g.data().members || [];
            if (members.includes(uid)) {
                batch.update(g.ref, {
                    members: members.filter((m: string) => m !== uid)
                });
            }
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
