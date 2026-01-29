import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../common/Icon';
import { generateAnonymousName } from '../../services/firebaseAuthService';
import { motion, AnimatePresence } from 'framer-motion';

export const AccountSettings = ({ onBack }: { onBack: () => void }) => {
    const { user, updateUsername, resetPassword } = useAuth();
    const { toast } = useToast();

    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState('');
    const [lockDate, setLockDate] = useState<Date | null>(null);

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
            <div className="p-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack}
                        className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-primary transition-all"
                    >
                        <Icon name="arrowLeft" className="w-5 h-5" />
                    </motion.button>
                    <div className="flex flex-col">
                        <span className="font-protocol text-[9px] tracking-[0.5em] text-primary opacity-50 uppercase">User_Control_Center</span>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase italic leading-none mt-1">Settings</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 md:px-24 py-12 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-16">

                    {/* Identity Section */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                                <h2 className="font-protocol text-[10px] text-primary uppercase tracking-[0.4em] opacity-60">Identity_Module</h2>
                            </div>

                            {!isEditing ? (
                                <div className="glass-panel p-10 rounded-[2.5rem] flex items-center justify-between group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Icon name="users" className="w-32 h-32 rotate-12" />
                                    </div>

                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-primary/40 transition-transform group-hover:scale-105">
                                            {user?.username?.[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-foreground tracking-tight uppercase italic">{user?.username}</h3>
                                            <p className="font-protocol text-[10px] tracking-[0.2em] text-primary opacity-60 mt-1 uppercase">{user?.email}</p>
                                        </div>
                                    </div>
                                    {lockDate ? (
                                        <div className="flex flex-col items-end gap-3 opacity-50 relative z-10">
                                            <span className="font-protocol text-[9px] tracking-[0.3em] uppercase text-primary">Nexus_Lock_Active</span>
                                            <div className="px-4 py-2 glass-card rounded-xl text-[9px] font-protocol tracking-widest text-muted-foreground uppercase bg-background/5">
                                                Available {lockDate.toLocaleDateString()}
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={startEditing}
                                            className="btn-primary px-8 h-14 rounded-2xl text-[10px] font-protocol tracking-[0.3em] uppercase shadow-2xl relative z-10"
                                        >
                                            Modify Alias
                                        </motion.button>
                                    )}
                                </div>
                            ) : (
                                <div className="glass-panel rounded-[3rem] p-12 space-y-12 animate-in zoom-in-95 duration-700 relative overflow-hidden backdrop-blur-2xl">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-protocol text-base text-primary tracking-[0.4em] uppercase">Protocol_Update</h3>
                                        <button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-xl hover:bg-foreground/5 flex items-center justify-center transition-all"><Icon name="x" className="w-4 h-4" /></button>
                                    </div>

                                    <div className="text-center py-6 space-y-4">
                                        <p className="font-protocol text-[9px] text-primary opacity-40 uppercase tracking-[0.5em]">NEW_TRANSMISSION_ID</p>
                                        <p className="text-5xl font-black text-primary tracking-tighter uppercase italic animate-in fade-in slide-in-from-bottom-4" key={tempName}>{tempName}</p>
                                    </div>

                                    <div className="flex gap-6">
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleShuffle}
                                            className="flex-1 glass-card bg-foreground/5 h-16 rounded-2xl flex items-center justify-center font-protocol text-[10px] tracking-[0.3em] uppercase hover:border-primary/40 transition-all border-border/10"
                                        >
                                            <Icon name="shuffle" className="w-4 h-4 mr-3" /> Re-Scan
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSaveName}
                                            className="flex-1 btn-primary h-16 rounded-2xl text-[10px] font-protocol tracking-[0.3em] uppercase shadow-primary/30"
                                        >
                                            Confirm_Sync
                                        </motion.button>
                                    </div>
                                    <p className="font-protocol text-[8px] text-center text-muted-foreground tracking-[0.4em] opacity-40 uppercase">7-Day cooldown applied on success</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-1 h-8 bg-secondary rounded-full shadow-[0_0_15px_rgba(var(--ui-secondary),0.5)]" />
                            <h2 className="font-protocol text-[10px] text-secondary uppercase tracking-[0.4em] opacity-60">Security_Protocols</h2>
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] flex items-center justify-between hover:border-secondary/20 transition-all duration-700">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-secondary/10 rounded-2xl text-secondary flex items-center justify-center border border-secondary/10 shadow-inner">
                                    <Icon name="key" className="w-7 h-7" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-bold text-xl tracking-tight text-foreground/90 uppercase">Passkey_Auth</p>
                                    <p className="font-protocol text-[9px] text-secondary opacity-40 tracking-[0.2em] mt-1 uppercase">Secure transmission layer</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 h-12 glass-card bg-secondary/5 text-secondary border-secondary/20 hover:bg-secondary/10 font-protocol text-[9px] tracking-[0.3em] uppercase rounded-xl transition-all"
                                onClick={handlePasswordReset}
                            >
                                Reset_Key
                            </motion.button>
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 pb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-1 h-8 bg-muted-foreground/40 rounded-full" />
                            <h2 className="font-protocol text-[10px] text-muted-foreground uppercase tracking-[0.4em] opacity-60">Network_Support</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <motion.a
                                whileHover={{ y: -6, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}
                                href="mailto:support@slowchat.com"
                                className="glass-panel p-8 flex flex-col items-center justify-center gap-4 rounded-[2.5rem] transition-all group border-border/10"
                            >
                                <div className="w-14 h-14 glass-card bg-foreground/5 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all border border-transparent group-hover:border-primary/20">
                                    <Icon name="mail" className="w-6 h-6" />
                                </div>
                                <span className="font-protocol text-[10px] tracking-[0.3em] uppercase opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all">Email_Link</span>
                            </motion.a>
                            <motion.a
                                whileHover={{ y: -6, backgroundColor: 'rgba(var(--ui-secondary), 0.05)' }}
                                href="tel:+18005550123"
                                className="glass-panel p-8 flex flex-col items-center justify-center gap-4 rounded-[2.5rem] transition-all group border-border/10"
                            >
                                <div className="w-14 h-14 glass-card bg-foreground/5 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-secondary group-hover:bg-secondary/10 transition-all border border-transparent group-hover:border-secondary/20">
                                    <Icon name="phone" className="w-6 h-6" />
                                </div>
                                <span className="font-protocol text-[10px] tracking-[0.3em] uppercase opacity-60 group-hover:opacity-100 group-hover:text-secondary transition-all">Voice_Link</span>
                            </motion.a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
