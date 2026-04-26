import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { generateAnonymousName, logoutUser } from '../../services/firebaseAuthService';
import { deleteAccount } from '../../services/deleteAccountService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { vault } from '../../services/crypto/LocalVault';

export const AccountSettings = ({ onBack, logout }: { onBack: () => void, logout: () => void }) => {
    const { user, updateUsername, resetPassword } = useAuth();
    const { toast } = useToast();

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState('');
    const [lockDate, setLockDate] = useState<Date | null>(null);
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

    const handleDeleteAccount = async () => {
        const password = prompt("Enter your password to delete account permanently");

        if (!password) return;

        try {
            await deleteAccount(password);
        } catch (err: any) {
            alert(err.message);
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
            <div className="px-6 py-6 md:py-10 flex items-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack}
                    className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center text-primary transition-all hover:bg-white/10 shrink-0"
                >
                    <Icon name="arrowLeft" className="w-5 h-5" />
                </motion.button>
                <h1 className="text-2xl font-black text-foreground tracking-tight">Settings</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
                <div className="max-w-xl mx-auto space-y-10">

                    {/* Identity Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Identity</h2>
                            {lockDate && (
                                <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                                    Locked until {lockDate.toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {!isEditing ? (
                <div className="glass-panel p-5 md:p-6 rounded-3xl flex items-center gap-4 md:gap-5">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary flex items-center justify-center text-xl font-black text-white shadow-lg shadow-primary/20 shrink-0">
                        {user?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold text-foreground tracking-tight truncate">{user?.username}</h3>
                        <p className="text-[10px] md:text-xs font-medium text-gray-500 truncate">{user?.email}</p>
                    </div>
                    {!lockDate && (
                        <button
                            onClick={startEditing}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-primary transition-all"
                        >
                            <Icon name="rotate" className="w-4 h-4" />
                        </button>
                    )}
                </div>
                        ) : (
                            <div className="glass-panel rounded-3xl p-6 space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">New Identity</h3>
                                    <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors">
                                        <Icon name="x" className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="text-center py-2">
                                    <p className="text-2xl md:text-3xl font-black text-foreground tracking-tighter" key={tempName}>{tempName}</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleShuffle}
                                        className="flex-1 h-12 rounded-xl bg-white/5 font-bold text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon name="rotate" className="w-3.5 h-3.5" /> Shuffle
                                    </button>
                                    <button
                                        onClick={handleSaveName}
                                        className="flex-1 btn-primary h-12 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-lg shadow-primary/20"
                                    >
                                        Apply
                                    </button>
                                </div>
                                <p className="text-[9px] font-medium text-gray-500 text-center uppercase tracking-wider">7-Day cooldown applies after change</p>
                            </div>
                        )}
                    </div>

                    {/* Message Settings Section */}
                    <div className="space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-2">Privacy Controls</h2>
                        <div className="glass-panel p-5 md:p-6 rounded-3xl space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-foreground text-sm">Auto-Delete Protocol</h3>
                                    <p className="text-[10px] text-gray-500">Messages vanish after set duration</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteInfo(true)}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"
                                >
                                    <Icon name="info" className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[5, 10, 20].map((h) => (
                                    <button
                                        key={h}
                                        onClick={() => handleUpdateAutoDelete(h)}
                                        className={`
                                            h-10 rounded-xl font-bold text-[10px] transition-all border
                                            ${user?.autoDeleteHours === h
                                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10 hover:text-white'
                                            }
                                        `}
                                    >
                                        {h} HOURS
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Security & Sessions */}
                    <div className="space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-2">Security</h2>
                        <div className="glass-panel p-2 rounded-3xl divide-y divide-white/5">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <Icon name="mail" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Backup Email</p>
                                        <p className="text-[10px] text-emerald-500/80 font-medium">Verified</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-gray-500 truncate max-w-[120px]">{user?.email}</span>
                            </div>

                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                        <Icon name="monitor" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">Active Session</p>
                                        <p className="text-[10px] text-gray-500 font-medium">This device</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogoutAll}
                                    className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                                >
                                    End All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4">
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-500/10 rounded-xl text-red-500 flex items-center justify-center">
                                    <Icon name="trash" className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-red-500">Delete Account</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Remove all data permanently</p>
                                </div>
                            </div>
                            <Icon name="chevronRight" className="w-4 h-4 text-red-500/30 group-hover:text-red-500/60 transition-colors" />
                        </button>
                    </div>

                </div>
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
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-sm z-[70] bg-[#0F1C34] border border-white/10 p-6 rounded-3xl shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest">How it works</h4>
                                <button onClick={() => setShowDeleteInfo(false)} className="text-gray-500 hover:text-white">
                                    <Icon name="x" className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Messages automatically vanish after the selected time (5hr / 10hr / 20hr). This applies to both sent and received messages to ensure maximum privacy.
                            </p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
