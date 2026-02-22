import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import * as firebaseAuth from '../services/firebaseAuthService';
import * as firebaseGroupService from '../services/firebaseGroupService';
import { vault } from '../services/crypto/LocalVault';

interface AuthContextType {
    user: User | null;
    isVerified: boolean;
    needsNameSetup: boolean;
    isAuthenticated: boolean;
    loading: boolean;
    loginEmail: (email: string) => void;
    completeLogin: (username: string) => Promise<void>;
    joinGroup: (groupId: string) => Promise<void>;
    leaveGroup: (groupId: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUsername: (newUsername: string) => Promise<boolean>;
    resetPassword: () => boolean;
    loginWithData: (user: User) => void;
    isE2EEReady: boolean;
    checkE2EEStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isE2EEReady, setIsE2EEReady] = useState(false);

    const checkE2EEStatus = async () => {
        const key = await vault.getSecret('identity_private_key');
        setIsE2EEReady(!!key);
    };

    useEffect(() => {
        if (user) checkE2EEStatus();
    }, [user]);

    // Listen to Firebase Auth state changes
    useEffect(() => {
        let snapshotUnsubscribe: (() => void) | null = null;
        let noteUnsubscribe: (() => void) | null = null;

        const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setIsVerified(firebaseUser.emailVerified);
                setLoading(true);
                // 1. Subscribe to user document for core profile
                const userRef = doc(db, 'users', firebaseUser.uid);
                snapshotUnsubscribe = onSnapshot(userRef, (userSnap) => {
                    // Auth Guard
                    if (!auth.currentUser) return;

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        setIsVerified(auth.currentUser.emailVerified);
                        setUser(prev => {
                            const base = {
                                id: firebaseUser.uid,
                                email: userData.email,
                                username: userData.username || '',
                                joinedGroups: userData.joinedGroups || [],
                                mutedGroups: userData.mutedGroups || [],
                                following: userData.following || [],
                                followers: userData.followers || [],
                                unreadCount: prev?.unreadCount || 0,
                                notificationsClearedAt: userData.notificationsClearedAt,
                                groupJoinTimes: userData.groupJoinTimes || {},
                                sessions: userData.sessions || [],
                                autoDeleteHours: userData.autoDeleteHours || 5,
                                lastTimerChange: userData.lastTimerChange || 0
                            };
                            return base;
                        });
                    }
                    setLoading(false);
                }, (err) => {
                    if (err.code === 'permission-denied') return;
                    console.error('[AuthContext] Snapshot error:', err);
                    setLoading(false);
                });

                // 2. Subscribe to notifications for accurate unreadCount (Client-side derivation)
                const notificationsRef = collection(db, 'notifications');
                const q = query(notificationsRef, where('userId', '==', firebaseUser.uid), where('read', '==', false));
                noteUnsubscribe = onSnapshot(q, (snap) => {
                    // Auth Guard
                    if (!auth.currentUser) return;

                    const count = snap.size;
                    setUser(prev => prev ? { ...prev, unreadCount: count } : null);
                }, (err) => {
                    if (err.code === 'permission-denied') return;
                    console.error('[AuthContext] Notifications Snapshot error:', err);
                });
                setIsVerified(false);
                setUser(null);
                setLoading(false);
            } else {
                // EXPLICIT LOGOUT CLEANUP
                if (snapshotUnsubscribe) {
                    snapshotUnsubscribe();
                    snapshotUnsubscribe = null;
                }
                if (noteUnsubscribe) {
                    noteUnsubscribe();
                    noteUnsubscribe = null;
                }
                setIsVerified(false);
                setUser(null);
                setLoading(false);
            }
        });

        // Verification Polling
        let pollingInterval: any = null;
        if (auth.currentUser && !auth.currentUser.emailVerified) {
            pollingInterval = setInterval(async () => {
                if (auth.currentUser) {
                    await auth.currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                        setIsVerified(true);
                        clearInterval(pollingInterval);
                    }
                }
            }, 3000);
        }

        return () => {
            authUnsubscribe();
            if (snapshotUnsubscribe) snapshotUnsubscribe();
            if (noteUnsubscribe) noteUnsubscribe();
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, []);

    const loginEmail = (email: string) => {
        // Temporary state before username selection
        setUser({
            id: '',
            username: '',
            email,
            joinedGroups: [],
            mutedGroups: [],
            following: [],
            followers: [],
            unreadCount: 0
        });
    };

    const completeLogin = async (username: string) => {
        if (!user?.email) return;
        try {
            const finalUser = await firebaseAuth.completeRegistration(user.email, username);
            setUser(finalUser);
        } catch (e) {
            console.error("Registration completion failed", e);
        }
    };

    const joinGroup = async (groupId: string) => {
        if (!user) return;

        try {
            // 1. Update Firestore
            await firebaseGroupService.joinGroup(groupId, user.id);

            // 2. Optimistic UI Update
            if (!user.joinedGroups.includes(groupId)) {
                setUser({
                    ...user,
                    joinedGroups: [...user.joinedGroups, groupId]
                });
            }
        } catch (e) {
            console.error("Context joinGroup failed", e);
            throw e;
        }
    };

    const leaveGroup = async (groupId: string) => {
        if (!user) return;

        // Clean up group data
        await firebaseGroupService.leaveGroup(groupId, user.id);

        // Update local state
        const updated = { ...user, joinedGroups: user.joinedGroups.filter(id => id !== groupId) };
        setUser(updated);
    };

    const logout = async () => {
        // Optimistically clear user state immediately to prevent UI flicker and force immediate unmount
        setUser(null);
        try {
            await firebaseAuth.logoutUser();
        } catch (error) {
            console.error("Logout error:", error);
            // State is already cleared, but just to be safe
            setUser(null);
        }
    };

    const updateUsername = async (newUsername: string): Promise<boolean> => {
        if (!user) return false;

        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        if (user.lastUsernameChange && (now - user.lastUsernameChange < SEVEN_DAYS)) {
            return false;
        }

        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                username: newUsername,
                lastUsernameChange: now
            });

            setUser({ ...user, username: newUsername, lastUsernameChange: now });
            return true;
        } catch (error) {
            console.error('Update username error:', error);
            return false;
        }
    };

    const loginWithData = (userData: User) => {
        setUser(userData);
    };

    const resetPassword = () => {
        if (!auth.currentUser?.email) return false;
        // In native Firebase, we use sendPasswordResetEmail
        return true;
    };

    const needsNameSetup = isVerified && !!user && !user.username;
    const isAuthenticated = isVerified && !!user && !!user.username;

    return (
        <AuthContext.Provider value={{
            user,
            isVerified,
            needsNameSetup,
            isAuthenticated,
            loading,
            loginEmail,
            completeLogin,
            joinGroup,
            leaveGroup,
            logout,
            updateUsername,
            resetPassword,
            loginWithData,
            isE2EEReady,
            checkE2EEStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
