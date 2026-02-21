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
    const [loading, setLoading] = useState(false);
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
                // 1. Subscribe to user document for core profile
                const userRef = doc(db, 'users', firebaseUser.uid);
                snapshotUnsubscribe = onSnapshot(userRef, (userSnap) => {
                    // Auth Guard
                    if (!auth.currentUser) return;

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        setUser(prev => {
                            if (!prev) return {
                                id: firebaseUser.uid,
                                email: userData.email,
                                username: userData.username || '',
                                joinedGroups: userData.joinedGroups || [],
                                mutedGroups: userData.mutedGroups || [],
                                following: userData.following || [],
                                followers: userData.followers || [],
                                unreadCount: 0,
                                // Include the new field
                                notificationsClearedAt: userData.notificationsClearedAt,
                                groupJoinTimes: userData.groupJoinTimes || {},
                                sessions: userData.sessions || []
                            };
                            return {
                                ...prev,
                                username: userData.username || '',
                                joinedGroups: userData.joinedGroups || [],
                                mutedGroups: userData.mutedGroups || [],
                                following: userData.following || [],
                                followers: userData.followers || [],
                                // Also update on subsequent snapshots
                                notificationsClearedAt: userData.notificationsClearedAt,
                                groupJoinTimes: userData.groupJoinTimes || {}
                            };
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
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            authUnsubscribe();
            if (snapshotUnsubscribe) snapshotUnsubscribe();
            if (noteUnsubscribe) noteUnsubscribe();
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
        // Mock email service
        return true;
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user?.username,
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
