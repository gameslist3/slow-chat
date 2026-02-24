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
    writeBatch,
    arrayRemove,
    increment
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

        // 🧹 DELETE PERSONAL CHATS (only those the user is in)
        const chats = await getDocs(
            query(collection(db, "personal_chats"), where("userIds", "array-contains", uid))
        );
        for (const chat of chats.docs) {
            const messages = await getDocs(
                collection(db, `personal_chats/${chat.id}/messages`)
            );
            messages.forEach(msg => batch.delete(msg.ref));
            batch.delete(chat.ref);
        }

        // 🧹 REMOVE FROM GROUPS (only groups the user is a member of)
        const groups = await getDocs(
            query(collection(db, "groups"), where("memberIds", "array-contains", uid))
        );
        groups.forEach(group => {
            batch.update(group.ref, {
                memberIds: arrayRemove(uid),
                members: increment(-1)
            });
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
        console.error("❌ Delete account error:", error.code, error.message);

        if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
            throw new Error("Wrong password. Please try again.");
        }

        if (error.code === "auth/requires-recent-login") {
            throw new Error("Please log out and log back in before deleting your account.");
        }

        throw new Error(error.message || "Account deletion failed. Please try again.");
    }
};
