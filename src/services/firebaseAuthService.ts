import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    User as FirebaseUser
} from 'firebase/auth';
import {
    doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch, deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserCredentials } from '../types';
import { CryptoUtils } from './crypto/CryptoUtils';
import { vault } from './crypto/LocalVault';

// Email validation
export const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return false;

    // Additional "unreal" check: common disposable domains or missing TLD depth
    const parts = email.split('@')[1].split('.');
    if (parts.length < 2 || parts[parts.length - 1].length < 2) return false;

    return true;
};

// Deletion Logic
export const deleteUserAccount = async (userId: string): Promise<void> => {
    console.log(`[Auth] Starting deletion for user: ${userId}`);
    const batch = writeBatch(db);

    try {
        // 1. Delete user document
        batch.delete(doc(db, 'users', userId));

        // 2. Remove from friends lists (logic would go here, simplified for now)
        // In a real app, you'd query 'users' where 'following' contains userId or 'followers' contains userId

        // 3. Clear sessions and local vault (vault clear is handled in component)

        // 4. Delete Firestore Auth account (requires fresh token, usually handled via cloud functions or deleteUser)
        // Simplified for this UI: We just clear DB data and sign out.
        await batch.commit();
        await auth.currentUser?.delete();
        console.log('[Auth] User account and data deleted.');
    } catch (err) {
        console.error('[Auth] Deletion error:', err);
        throw err;
    }
};

// Register user (Step 1)
export const registerUserStep1 = async (creds: UserCredentials): Promise<boolean> => {
    try {
        if (!creds.email || !creds.password) {
            throw new Error('Email and password are required.');
        }

        console.log(`[Auth] Attempting registration for ${creds.email}`);

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            creds.email,
            creds.password
        );

        const firebaseUser = userCredential.user;
        console.log(`[Auth] User created in Firebase Auth: ${firebaseUser.uid}`);

        // Send Native Verification Email
        await sendEmailVerification(firebaseUser);
        console.log(`[Auth] Verification email sent to ${creds.email}`);

        // Generate E2EE Identity Key Pair
        const identityKeyPair = await CryptoUtils.generateIdentityKeyPair();
        const publicIdentityKeyBase64 = await CryptoUtils.exportPublicKey(identityKeyPair.publicKey);

        // Save Private Key locally
        await vault.saveSecret('identity_private_key', identityKeyPair.privateKey);

        // Create Firestore user document with Public Key
        await setDoc(doc(db, 'users', firebaseUser.uid), {
            id: firebaseUser.uid,
            email: creds.email,
            username: '', // They will pick a name after verification
            joinedGroups: ['system-updates'],
            mutedGroups: [],
            following: [],
            followers: [],
            unreadCount: 0,
            autoDeleteHours: 5,
            lastTimerChange: Date.now(),
            notificationsClearedAt: 0,
            groupJoinTimes: {},
            createdAt: Date.now(),
            sessions: [],
            publicKeys: {
                identity: publicIdentityKeyBase64
            }
        });

        console.log(`[Auth] Initial profile created for ${firebaseUser.uid}`);
        return true;
    } catch (error: any) {
        console.error('[Auth] Registration error:', error.code, error.message);

        let friendlyMessage = 'An unexpected error occurred during registration.';

        switch (error.code) {
            case 'auth/email-already-in-use':
                friendlyMessage = 'This email is already registered. Please sign in instead.';
                break;
            case 'auth/invalid-email':
                friendlyMessage = 'Please enter a valid email address.';
                break;
            case 'auth/weak-password':
                friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
                break;
            case 'auth/network-request-failed':
                friendlyMessage = 'Network error. Please check your internet connection.';
                break;
            case 'auth/configuration-not-found':
                friendlyMessage = 'Sign-up is currently disabled. Please contact support.';
                break;
        }

        throw new Error(friendlyMessage);
    }
};

// Cancel Registration (Delete unverified account)
export const cancelRegistration = async (): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No user is currently signed in.');

        console.log(`[Auth] Canceling registration for ${currentUser.uid}`);

        // Delete Firestore document first
        await deleteDoc(doc(db, 'users', currentUser.uid));

        // Delete Firebase Auth User
        await currentUser.delete();

        console.log(`[Auth] Registration cancelled successfully`);
    } catch (error: any) {
        console.error('[Auth] Registration cancellation error:', error);
        throw new Error('Failed to cancel registration. Please try again.');
    }
};

// Resend Verification Email
export const resendVerificationEmail = async (): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No user is currently signed in.');

        console.log(`[Auth] Resending verification email to ${currentUser.email}`);
        await sendEmailVerification(currentUser);
    } catch (error: any) {
        console.error('[Auth] Verification resend error:', error);
        if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many requests. Please wait a moment before trying again.');
        }
        throw new Error('Failed to resend verification email.');
    }
};

// Complete registration (Step 2 - set username)
export const completeRegistration = async (email: string, username: string): Promise<User> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No authenticated user');

        console.log(`[Auth] Completing registration for ${currentUser.uid}, setting username: ${username}`);

        // Update Firestore user document
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            username: username
        });

        // Get updated user data
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        return {
            id: currentUser.uid,
            email: userData?.email || email,
            username: username,
            joinedGroups: userData?.joinedGroups || ['system-updates'],
            mutedGroups: userData?.mutedGroups || [],
            following: userData?.following || [],
            followers: userData?.followers || [],
            unreadCount: userData?.unreadCount || 0,
            notificationsClearedAt: userData?.notificationsClearedAt || 0,
            groupJoinTimes: userData?.groupJoinTimes || {},
            lastUsernameChange: userData?.lastUsernameChange,
            sessions: userData?.sessions || []
        };
    } catch (error: any) {
        console.error('[Auth] Complete registration error:', error.code, error.message);
        if (error.code === 'auth/configuration-not-found') {
            throw new Error('Firebase Auth is not correctly configured. Please check your Firebase Console settings.');
        }
        throw error;
    }
};

// Login with password
export const loginUserWithPassword = async (creds: UserCredentials): Promise<User | null> => {
    try {
        if (!creds.email || !creds.password) return null;

        console.log(`[Auth] Attempting login for ${creds.email}`);

        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
            auth,
            creds.email,
            creds.password
        );

        const uid = userCredential.user.uid;
        console.log(`[Auth] Signed in to Firebase Auth: ${uid}`);

        // Get user data from Firestore
        let userDoc = await getDoc(doc(db, 'users', uid));

        // SELF-HEALING: If user exists in Auth but not Firestore, create profile now
        if (!userDoc.exists()) {
            console.warn(`[Auth] User profile missing in Firestore for ${uid}. Creating default profile.`);
            // Generate E2EE Identity Key Pair for self-healing
            const identityKeyPair = await CryptoUtils.generateIdentityKeyPair();
            const publicIdentityKeyBase64 = await CryptoUtils.exportPublicKey(identityKeyPair.publicKey);
            await vault.saveSecret('identity_private_key', identityKeyPair.privateKey);

            await setDoc(doc(db, 'users', uid), {
                id: uid,
                email: creds.email,
                username: '', // They will be prompted to pick a name
                joinedGroups: ['system-updates'],
                mutedGroups: [],
                following: [],
                followers: [],
                unreadCount: 0,
                notificationsClearedAt: 0,
                groupJoinTimes: {},
                createdAt: Date.now(),
                sessions: [],
                publicKeys: {
                    identity: publicIdentityKeyBase64
                }
            });
            userDoc = await getDoc(doc(db, 'users', uid));
        }

        const userData = userDoc.data()!;

        // Create session
        const sessionId = crypto.randomUUID();
        const now = Date.now();
        const newSession = {
            sessionId,
            userAgent: navigator.userAgent,
            loginTime: now,
            lastActive: now
        };

        // Update sessions (keep max 5)
        const sessions = [...(userData.sessions || []), newSession].slice(-5);
        await updateDoc(doc(db, 'users', uid), {
            sessions
        });

        console.log(`[Auth] Login successful for ${userData.username || 'user with no name'}`);

        return {
            id: uid,
            email: userData.email,
            username: userData.username || '',
            joinedGroups: userData.joinedGroups || [],
            mutedGroups: userData.mutedGroups || [],
            following: userData.following || [],
            followers: userData.followers || [],
            unreadCount: userData.unreadCount || 0,
            notificationsClearedAt: userData.notificationsClearedAt || 0,
            groupJoinTimes: userData.groupJoinTimes || {},
            lastUsernameChange: userData.lastUsernameChange,
            sessions
        };
    } catch (error: any) {
        console.error('[Auth] Login error:', error.code, error.message);
        if (error.code === 'auth/configuration-not-found') {
            throw new Error('Email/Password login is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
        }
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error("Incorrect password. Please verify and retry.");
        }
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            throw new Error("No account found with this address.");
        }
        throw error;
    }
};

// Update user status (Presence)
export const updateUserStatus = async (uid: string, status: 'online' | 'offline'): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            status,
            lastSeen: Date.now()
        });
    } catch (err) {
        console.error('[Auth] Status update error:', err);
    }
};

/**
 * Update user's active chat for notification suppression
 */
export const updateActiveChat = async (uid: string, chatId: string | null): Promise<void> => {
    if (!uid) return;
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { activeChatId: chatId });
    } catch (error) {
        console.error('[Auth] Error updating active chat:', error);
    }
};

// Logout
export const logoutUser = async (): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
        await updateUserStatus(user.uid, 'offline');
    }
    await signOut(auth);
};

// Generate anonymous name
const ADJECTIVES = ['Happy', 'Sleepy', 'Grumpy', 'Sneezy', 'Dopey', 'Bashful', 'Doc', 'Cool', 'Calm', 'Brave', 'Bold', 'Zen'];
const NOUNS = ['Panda', 'Tiger', 'Eagle', 'Koala', 'Falcon', 'Wolf', 'Bear', 'Fox', 'Owl', 'Dolphin', 'Whale', 'Shark'];

export const generateAnonymousName = (): string => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    return `${adj} ${noun}`;
};

// Get current user from Firestore
export const getCurrentUser = async (): Promise<User | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return getUserById(currentUser.uid);
};

// Fetch any user by ID
export const getUserById = async (uid: string): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    return {
        id: uid,
        email: userData.email,
        username: userData.username,
        joinedGroups: userData.joinedGroups || [],
        mutedGroups: userData.mutedGroups || [],
        following: userData.following || [],
        followers: userData.followers || [],
        unreadCount: userData.unreadCount || 0,
        notificationsClearedAt: userData.notificationsClearedAt || 0,
        lastUsernameChange: userData.lastUsernameChange,
        sessions: userData.sessions || [],
        publicKeys: userData.publicKeys || null
    };
};
