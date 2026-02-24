import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from "firebase/auth";

import {
    doc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
    writeBatch
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

export const deleteAccount = async (password: string) => {
    const user = auth.currentUser;

    if (!user || !user.email) {
        throw new Error("User not authenticated");
    }

    try {
        // 🔐 STEP 1 — REAUTHENTICATE
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        const uid = user.uid;
        const batch = writeBatch(db);

        // 🧹 STEP 2 — DELETE USER DOC
        batch.delete(doc(db, "users", uid));

        // 🧹 DELETE NOTIFICATIONS
        const notifSnap = await getDocs(
            query(collection(db, "notifications"), where("userId", "==", uid))
        );
        notifSnap.forEach(docSnap => batch.delete(docSnap.ref));

        // 🧹 DELETE FOLLOW REQUESTS
        const fr1 = await getDocs(
            query(collection(db, "follow_requests"), where("fromId", "==", uid))
        );
        fr1.forEach(d => batch.delete(d.ref));

        const fr2 = await getDocs(
            query(collection(db, "follow_requests"), where("toId", "==", uid))
        );
        fr2.forEach(d => batch.delete(d.ref));

        // 🧹 DELETE PERSONAL CHATS
        const chats = await getDocs(collection(db, "personal_chats"));
        for (const chat of chats.docs) {
            const data = chat.data();
            if (data.userIds?.includes(uid)) {

                const messages = await getDocs(
                    collection(db, `personal_chats/${chat.id}/messages`)
                );

                messages.forEach(msg => batch.delete(msg.ref));
                batch.delete(chat.ref);
            }
        }

        // 🧹 REMOVE FROM GROUPS
        const groups = await getDocs(collection(db, "groups"));
        groups.forEach(group => {
            const members = group.data().members || [];
            if (members.includes(uid)) {
                batch.update(group.ref, {
                    members: members.filter((m: string) => m !== uid)
                });
            }
        });

        // 💥 COMMIT FIRESTORE DELETE
        await batch.commit();

        // 🔥 STEP 3 — DELETE AUTH USER
        await deleteUser(user);

        // 🧼 CLEAN SESSION
        localStorage.clear();
        sessionStorage.clear();

        // 🔄 REDIRECT
        window.location.href = "/signup";

    } catch (error: any) {
        console.error("Delete account error:", error);

        if (error.code === "auth/wrong-password") {
            throw new Error("Wrong password");
        }

        if (error.code === "auth/requires-recent-login") {
            throw new Error("Please login again before deleting.");
        }

        throw error;
    }
};
