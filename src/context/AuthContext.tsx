import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import * as firebaseAuth from '../services/firebaseAuthService';
import { leaveGroup as leaveGroupService } from '../services/firebaseGroupService';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen to Firebase Auth state changes
    useEffect(() => {
        let snapshotUnsubscribe: (() => void) | null = null;

        const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // 1. Subscribe to user document for core profile
                const userRef = doc(db, 'users', firebaseUser.uid);
                snapshotUnsubscribe = onSnapshot(userRef, (userSnap) => {
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
                                lastUsernameChange: userData.lastUsernameChange,
                                sessions: userData.sessions || []
                            };
                            return {
                                ...prev,
                                username: userData.username || '',
                                joinedGroups: userData.joinedGroups || [],
                                mutedGroups: userData.mutedGroups || [],
                                following: userData.following || [],
                                followers: userData.followers || []
                            };
                        });
                    }
                    setLoading(false);
                });

                // 2. Subscribe to notifications for accurate unreadCount (Client-side derivation)
                const notificationsRef = collection(db, 'notifications');
                const q = query(notificationsRef, where('userId', '==', firebaseUser.uid), where('read', '==', false));
                const noteUnsubscribe = onSnapshot(q, (snap) => {
                    const count = snap.size;
                    setUser(prev => prev ? { ...prev, unreadCount: count } : null);
                });

                return () => {
                    if (snapshotUnsubscribe) snapshotUnsubscribe();
                    noteUnsubscribe();
                };
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            authUnsubscribe();
            if (snapshotUnsubscribe) snapshotUnsubscribe();
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
            // Firestore update is now handled by firebaseGroupService.joinGroup called in App.tsx
            // We just update the local state to trigger UI changes immediately
            if (!user.joinedGroups.includes(groupId)) {
                // Note: Firestore listener in AuthProvider will 
                // handle the final state update. This is optimistic.
                setUser({
                    ...user,
                    joinedGroups: [...user.joinedGroups, groupId]
                });
            }
        } catch (e) {
            console.error("Context joinGroup failed", e);
        }
    };

    const leaveGroup = async (groupId: string) => {
        if (!user) return;

        // Clean up group data
        await leaveGroupService(groupId, user.id);

        // Update local state
        const updated = { ...user, joinedGroups: user.joinedGroups.filter(id => id !== groupId) };
        setUser(updated);
    };

    const logout = async () => {
        try {
            // Optimistically clear user state immediately to prevent UI flicker
            setUser(null);
            await firebaseAuth.logoutUser();
        } catch (error) {
            console.error("Logout error:", error);
            // Force clear if firebase fails
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
            loginWithData
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
