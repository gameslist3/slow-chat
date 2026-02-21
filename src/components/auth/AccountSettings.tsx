import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../common/Icon';
import { generateAnonymousName } from '../../services/firebaseAuthService';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../ai-ui/ThemeToggle';
import { KeyBackup } from './KeyBackup';
import { MaintenanceService } from '../../services/MaintenanceService';
export const AccountSettings = ({ onBack, logout }: { onBack: () => void, logout: () => void }) => {
    const { user, updateUsername, resetPassword } = useAuth();
    const { toast } = useToast();

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState('');
    const [lockDate, setLockDate] = useState<Date | null>(null);
    const [showBackup, setShowBackup] = useState(false);

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
            // Fallback if context logic prevented it
            const nextDate = new Date((user?.lastUsernameChange || 0) + (7 * 24 * 60 * 60 * 1000));
            toast(`Locked until ${nextDate.toLocaleDateString()}`, "error");
        }
    };

    const handlePasswordReset = () => {
        resetPassword();
        toast("Password reset link sent to your email.", "success");
    };

    return (
        <div className="h-full flex flex-col bg-transparent animate-in fade-in duration-700">
            {/* Minimal Header */}
            <div className="p-4 md:p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack}
                        className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-primary transition-all hover:bg-white/10"
                    >
                        <Icon name="arrowLeft" className="w-5 h-5" />
                    </motion.button>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Settings</h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-24 py-8 custom-scrollbar">
                <div className="max-w-2xl mx-auto space-y-12">

                    {/* Identity Section */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">Profile</h2>

                        {!isEditing ? (
                            <div className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between group relative overflow-hidden gap-6">
                                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                    <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-primary/30">
                                        {user?.username?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-foreground tracking-tight">{user?.username}</h3>
                                        <p className="text-sm font-medium text-gray-500">{user?.email}</p>
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
                            <div className="glass-panel rounded-3xl p-8 space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden backdrop-blur-xl">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest">new name</h3>
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

                    {/* Security Section */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">Security & Preferences</h2>

                        <div className="space-y-4">
                            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl text-emerald-500 flex items-center justify-center">
                                        <Icon name="shield" className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold text-base text-foreground">Identity Backup</p>
                                        <p className="text-xs font-medium text-gray-500">Securely export or restore your E2EE keys.</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 h-10 glass-card bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-bold tracking-wider uppercase rounded-lg transition-all"
                                    onClick={() => setShowBackup(true)}
                                >
                                    Manage
                                </motion.button>
                            </div>

                            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl text-gray-400 flex items-center justify-center">
                                        <Icon name="key" className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold text-base text-foreground">Password</p>
                                        <p className="text-xs font-medium text-gray-500">Manage your access key.</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 h-10 glass-card bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-xs font-bold tracking-wider uppercase rounded-lg transition-all"
                                    onClick={handlePasswordReset}
                                >
                                    Reset
                                </motion.button>
                            </div>

                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 pb-20">
                        <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest pl-2">Danger Zone</h2>

                        <div className="glass-panel p-6 rounded-3xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-500/10 rounded-xl text-red-500 flex items-center justify-center">
                                        <Icon name="trash" className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold text-base text-red-500">Hard Reset</p>
                                        <p className="text-xs font-medium text-gray-500 max-w-sm">Wipes all users, groups, and global chat history. Use once to fix E2EE mismatch issues.</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        if (confirm("⚠️ WARNING: This will permanently WIPE all users, groups, and messages. This action is irreversible. Proceed?")) {
                                            await MaintenanceService.wipeDatabase();
                                            toast("Database Wiped. Refreshing app...", "info");
                                            setTimeout(() => window.location.reload(), 2000);
                                        }
                                    }}
                                    className="px-6 h-12 bg-red-500 text-white text-xs font-black tracking-widest uppercase rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                                >
                                    Wipe All Data
                                </motion.button>
                            </div>
                        </div>
                    </div>

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
