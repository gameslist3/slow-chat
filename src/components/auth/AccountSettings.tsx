import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { generateAnonymousName, logoutUser } from '../../services/firebaseAuthService';
import { deleteMyAccount } from '../../services/deleteAccountService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { KeyBackup } from './KeyBackup';
import { vault } from '../../services/crypto/LocalVault';

export const AccountSettings = ({ onBack, logout }: { onBack: () => void, logout: () => void }) => {
    const { user, updateUsername, resetPassword } = useAuth();
    const { toast } = useToast();

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState('');
    const [lockDate, setLockDate] = useState<Date | null>(null);
    const [showBackup, setShowBackup] = useState(false);
    const [showDeleteInfo, setShowDeleteInfo] = useState(false);

    // Get current device info
    const currentSession = user?.sessions?.find(s => s.userAgent === navigator.userAgent);
    const lastLoginText = currentSession
        ? `This device (${navigator.userAgent.includes('Windows') ? 'Windows' : 'Mobile'})`
        : 'Unknown device';

    // Calculate lock state on mount or user update
    useEffect(() => {
        if (user?.lastUsernameChange) {
            const next = new Date(user.lastUsernameChange + (7 * 24 * 60 * 60 * 1000));
            if (next > new Date()) {
                setLockDate(next);
            } else {
                setLockDate(null);
            }
        }
    }, [user]);

    const startEditing = () => {
        if (lockDate) return;
        setTempName(generateAnonymousName());
        setIsEditing(true);
    };

    const handleShuffle = () => {
        setTempName(generateAnonymousName());
    };

    const handleSaveName = async () => {
        if (!tempName) return;
        if (tempName === user?.username) { setIsEditing(false); return; }

        const success = await updateUsername(tempName);
        if (success) {
            toast("Identity updated.", "success");
            setIsEditing(false);
        } else {
            const nextDate = new Date((user?.lastUsernameChange || 0) + (7 * 24 * 60 * 60 * 1000));
            toast(`Locked until ${nextDate.toLocaleDateString()}`, "error");
        }
    };

    const handlePasswordReset = () => {
        resetPassword();
        toast("Password reset link sent to your email.", "success");
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        const password = prompt("🧨 DANGER: Enter password to PERMANENTLY delete your account. This cannot be undone.");

        if (!password) {
            toast("Identity verification cancelled.", "info");
            return;
        }

        setIsDeleting(true);
        try {
            await deleteMyAccount(password);
            toast("Account terminated. Farewell.", "info");
        } catch (err: any) {
            console.error('[AccountSettings] Termination Error:', err);
            if (err.code === 'auth/wrong-password') {
                toast("Invalid security protocol. Access denied.", "error");
            } else if (err.code === 'auth/requires-recent-login') {
                toast("Session expired. Please re-login and try again.", "error");
            } else {
                toast("Critical failure during termination.", "error");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogoutAll = async () => {
        if (confirm("Log out from all devices?")) {
            await logoutUser();
            logout();
        }
    };

    const handleUpdateAutoDelete = async (hours: number) => {
        if (!user) return;
        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

        if (user.lastTimerChange && (now - user.lastTimerChange < THIRTY_DAYS)) {
            const nextAvail = new Date(user.lastTimerChange + THIRTY_DAYS);
            toast(`You can change auto-delete time again after 30 days. (Avail: ${nextAvail.toLocaleDateString()})`, "error");
            return;
        }

        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                autoDeleteHours: hours,
                lastTimerChange: now
            });
            toast(`Auto-delete set to ${hours} hours.`, "success");
        } catch (error) {
            toast("Failed to update message settings.", "error");
        }
    };

    if (!user) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-transparent">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing Protocol...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-transparent animate-in fade-in duration-700">
            {/* Minimal Header */}
            <div className="p-4 md:p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack}
                        className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-primary transition-all hover:bg-white/10 shrink-0"
                    >
                        <Icon name="arrowLeft" className="w-5 h-5" />
                    </motion.button>
                    <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Settings</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-24 py-6 custom-scrollbar">
                <div className="max-w-2xl mx-auto space-y-6">

                    {/* Identity Section */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest pl-2">Profile</h2>

                        {!isEditing ? (
                            <div className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between group relative overflow-hidden gap-6">
                                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-primary/30 shrink-0">
                                        {user?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold text-foreground tracking-tight truncate">{user?.username}</h3>
                                        <p className="text-sm font-medium text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                {lockDate ? (
                                    <div className="flex flex-col items-end gap-2 relative z-10">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Locked</span>
                                        <div className="px-3 py-1.5 bg-white/5 rounded-lg text-xs font-bold text-gray-400">
                                            Avail. {lockDate.toLocaleDateString()}
                                        </div>
                                    </div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={startEditing}
                                        className="btn-primary w-full md:w-auto px-6 h-12 rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg relative z-10"
                                    >
                                        change name
                                    </motion.button>
                                )}
                            </div>
                        ) : (
                            <div className="glass-panel rounded-3xl p-6 md:p-8 space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden backdrop-blur-xl">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[13px] font-bold text-primary uppercase tracking-widest">new name</h3>
                                    <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all text-gray-400 hover:text-white"><Icon name="x" className="w-4 h-4" /></button>
                                </div>

                                <div className="text-center py-4 space-y-2">
                                    <p className="text-4xl md:text-5xl font-black text-foreground tracking-tighter animate-in fade-in slide-in-from-bottom-2" key={tempName}>{tempName}</p>
                                </div>

                                <div className="flex gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleShuffle}
                                        className="flex-1 glass-card bg-white/5 h-14 rounded-xl flex items-center justify-center font-bold text-xs tracking-widest uppercase hover:bg-white/10 transition-all gap-2"
                                    >
                                        <Icon name="rotate" className="w-4 h-4" /> Shuffle
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSaveName}
                                        className="flex-1 btn-primary h-14 rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg"
                                    >
                                        Save
                                    </motion.button>
                                </div>
                                <p className="text-[10px] font-bold text-gray-500 text-center uppercase tracking-wider">7-Day cooldown applies</p>
                            </div>
                        )}
                    </div>

                    {/* Message Settings Section */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-75">
                        <div className="flex items-center gap-2 pl-2 text-primary">
                            <Icon name="messageSquare" className="w-5 h-5" />
                            <h2 className="text-[13px] font-bold uppercase tracking-widest">Message Settings</h2>
                        </div>

                        <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 relative">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-foreground text-lg">Auto Delete Messages</h3>
                                    <button
                                        onClick={() => setShowDeleteInfo(true)}
                                        className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                                    >
                                        <Icon name="info" className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">Messages will be removed after the selected duration.</p>

                                <div className="grid grid-cols-3 gap-3">
                                    {[5, 10, 20].map((h) => (
                                        <button
                                            key={h}
                                            onClick={() => handleUpdateAutoDelete(h)}
                                            className={`
                                                h-12 rounded-xl font-bold text-xs transition-all border-2
                                                ${user?.autoDeleteHours === h
                                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                                                }
                                            `}
                                        >
                                            {h}H
                                        </button>
                                    ))}
                                </div>

                                {/* Info Popup */}
                                <AnimatePresence>
                                    {showDeleteInfo && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                                                onClick={() => setShowDeleteInfo(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-sm z-[70] bg-[#0F1C34] border border-white/10 p-6 rounded-3xl shadow-2xl overflow-y-auto max-h-[80vh]"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">How it works</h4>
                                                    <button onClick={() => setShowDeleteInfo(false)} className="text-gray-500 hover:text-white">
                                                        <Icon name="x" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    Auto Delete Messages automatically removes your sent and received messages after the selected time (5hr / 10hr / 20hr).
                                                </p>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Account Safety Section */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        <div className="flex items-center gap-2 pl-2 text-emerald-500">
                            <Icon name="shield" className="w-5 h-5" />
                            <h2 className="text-[13px] font-bold uppercase tracking-widest">Account Safety</h2>
                        </div>
                        <p className="text-sm font-medium text-gray-500 pl-2">Keep your account safe and recover it anytime.</p>

                        <div className="space-y-4">
                            <div className="glass-panel p-6 rounded-3xl space-y-6">
                                {/* Backup Email */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-lg text-emerald-500 flex items-center justify-center">
                                            <Icon name="mail" className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Backup Email</p>
                                            <p className="text-xs font-medium text-emerald-500/80">{user?.email} (Verified)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Last Login */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-lg text-blue-500 flex items-center justify-center">
                                            <Icon name="monitor" className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Last used device</p>
                                            <p className="text-sm font-medium text-gray-500">{lastLoginText}</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleLogoutAll}
                                        className="w-full md:w-auto px-4 h-10 glass-card bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-[10px] font-bold tracking-wider uppercase rounded-xl transition-all"
                                    >
                                        Logout from all
                                    </motion.button>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-lg text-gray-400 flex items-center justify-center">
                                            <Icon name="key" className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Identity Recovery</p>
                                            <p className="text-sm font-medium text-gray-500 text-left">Advanced identity recovery options</p>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowBackup(true)}
                                        className="w-full md:w-auto px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg"
                                    >
                                        Manage
                                    </motion.button>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between hover:border-red-500/20 bg-red-500/5 transition-all cursor-pointer group" onClick={() => setShowDeleteConfirm(true)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-500/10 rounded-xl text-red-500 flex items-center justify-center">
                                        <Icon name="trash" className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold text-base text-red-500">Delete My Account</p>
                                        <p className="text-sm font-medium text-gray-500">Permanently remove only your account.</p>
                                    </div>
                                </div>
                                <Icon name="chevronRight" className="w-5 h-5 text-red-500/50" />
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showDeleteConfirm && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="relative w-full max-w-sm bg-[#152238] border border-red-500/20 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                                        <Icon name="trash" className="w-8 h-8" />
                                    </div>

                                    <h3 className="text-xl font-bold text-white text-center mb-2">Protocol Termination</h3>
                                    <p className="text-sm text-gray-400 text-center mb-8 leading-relaxed">
                                        This will permanently wipe your identity and all associated data. Enter password to confirm.
                                    </p>

                                    <div className="space-y-4">
                                        <input
                                            type="password"
                                            placeholder="Enter Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white focus:outline-none focus:border-red-500/50 transition-all font-mono"
                                            autoFocus
                                        />

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                disabled={isDeleting}
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all border border-white/5"
                                            >
                                                Abort
                                            </button>
                                            <button
                                                disabled={isDeleting || !confirmPassword}
                                                onClick={handleDeleteAccount}
                                                className="flex-1 h-14 rounded-2xl bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                            >
                                                {isDeleting ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    'Purge Account'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showBackup && (
                            <KeyBackup onClose={() => setShowBackup(false)} />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
