import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Info, Share2, MoreVertical, X, Calendar, Users, BellOff, LogOut, Copy, Check, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { toggleMuteGroup, leaveGroup, isMuted } from '../../services/firebaseGroupService';
import { unfollowUser } from '../../services/firebaseFollowService';
import { useAuth } from '../../context/AuthContext';

interface AIChatHeaderProps {
    groupId: string;
    isPersonal: boolean;
    title: string;
    image: string;
    createdAt?: number;
    memberCount: number;
    memberIds?: string[];
    onLeave?: () => void;
}

export const AIChatHeader: React.FC<AIChatHeaderProps> = ({
    groupId,
    isPersonal,
    title,
    image,
    createdAt,
    memberCount,
    memberIds = [],
    onLeave
}) => {
    const [showInfo, setShowInfo] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
    const [muted, setMuted] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    React.useEffect(() => {
        if (!user) return;
        isMuted(groupId, user.id).then(setMuted);
    }, [groupId, user]);

    const handleShare = () => {
        const url = `${window.location.origin}/chat/${groupId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast("Link copied to clipboard", "success");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleMute = async () => {
        if (!user) return;
        try {
            await toggleMuteGroup(groupId, user.id, !muted);
            setMuted(!muted);
            setShowMore(false);
            toast(muted ? "Link Unmuted" : "Link Muted", "success");
        } catch (error) {
            toast("Failed to update settings", "error");
        }
    };

    const handleLeave = async () => {
        if (!user) return;
        try {
            await leaveGroup(groupId, user.id);
            toast("Connection Terminated", "success");
            onLeave?.();
        } catch (error) {
            toast("Failed to terminate", "error");
        }
    };

    const handleUnfollow = async () => {
        if (!user || !isPersonal) return;
        try {
            // Find the other user ID from the chat ID (userId_otherId)
            const ids = groupId.split('_');
            const otherId = ids.find(id => id !== user.id);
            if (otherId) {
                await unfollowUser(otherId);
                toast("Unfollowed user", "success");
                onLeave?.();
            }
        } catch (error) {
            console.error(error);
            toast("Failed to unfollow", "error");
        }
    };

    return (
        <header className="flex items-center justify-between px-6 py-6 md:px-12 md:py-8 border-b border-border/5 bg-background/5 backdrop-blur-xl sticky top-0 z-40 h-[100px] md:h-[120px]">
            <div className="flex items-center gap-6">
                <motion.button
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onLeave}
                    className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-primary transition-all active:scale-95"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-9-9 9-9" /></svg>
                </motion.button>

                <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="text-4xl drop-shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] cursor-default select-none"
                >
                    {image}
                </motion.div>

                <div className="flex flex-col">
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground truncate max-w-[180px] md:max-w-md leading-none mb-1">{title}</h2>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Connected Cluster</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 relative">
                {!isPersonal && (
                    <>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleShare}
                            className="bg-foreground/5 p-3 rounded-2xl hidden sm:flex text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                            title="Share Link"
                        >
                            {copied ? <Check className="w-5 h-5 text-secondary" /> : <Share2 className="w-5 h-5" />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowInfo(true)}
                            className="bg-foreground/5 p-3 rounded-2xl hidden sm:flex text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                            title="Details"
                        >
                            <Info className="w-5 h-5" />
                        </motion.button>
                        <div className="h-4 w-[1px] mx-1 bg-border/20 hidden sm:block" />
                    </>
                )}

                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowMore(!showMore)}
                        className={`p-3 rounded-2xl transition-all border ${showMore ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground hover:text-primary bg-foreground/5 border-transparent'}`}
                    >
                        <MoreVertical className="w-6 h-6" />
                    </motion.button>

                    <AnimatePresence>
                        {showMore && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.95, y: 10, filter: 'blur(10px)' }}
                                className="absolute right-0 mt-4 w-60 glass-panel rounded-[2rem] overflow-hidden z-50 py-3 p-2 shadow-2xl"
                            >
                                <button
                                    onClick={handleToggleMute}
                                    className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-2xl transition-all"
                                >
                                    {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                    {muted ? 'Unmute' : 'Mute'}
                                </button>
                                {isPersonal ? (
                                    <button
                                        onClick={() => setShowUnfollowConfirm(true)}
                                        className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-bold tracking-widest uppercase text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                                    >
                                        <LogOut className="w-4 h-4" /> Unfollow
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowLeaveConfirm(true)}
                                        className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-bold tracking-widest uppercase text-destructive hover:bg-destructive/10 rounded-2xl transition-all"
                                    >
                                        <LogOut className="w-4 h-4" /> Leave Group
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals Path */}
            {createPortal(
                <AnimatePresence>
                    {showLeaveConfirm && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                                onClick={() => setShowLeaveConfirm(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                                className="glass-panel w-full max-w-sm relative z-10 p-10 text-center space-y-8 border-destructive/20 shadow-[0_0_100px_-20px_rgba(239,68,68,0.2)]"
                            >
                                <div className="text-6xl mx-auto w-20 h-20 bg-destructive/10 flex items-center justify-center rounded-[2rem] text-destructive border border-destructive/20 shadow-inner">⚠️</div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-bold tracking-tight text-foreground">Leave Group?</h3>
                                    <p className="text-muted-foreground text-sm font-medium leading-relaxed opacity-60">Are you sure you want to leave this group?</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button onClick={handleLeave} className="btn-primary bg-destructive hover:bg-destructive shadow-destructive/20 h-16 rounded-3xl">LEAVE GROUP</button>
                                    <button onClick={() => setShowLeaveConfirm(false)} className="btn-ghost h-12 opacity-60">CANCEL</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                    {showUnfollowConfirm && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                                onClick={() => setShowUnfollowConfirm(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                                className="glass-panel w-full max-w-sm relative z-10 p-10 text-center space-y-8 border-destructive/20 shadow-[0_0_100px_-20px_rgba(239,68,68,0.2)]"
                            >
                                <div className="text-6xl mx-auto w-20 h-20 bg-destructive/10 flex items-center justify-center rounded-[2rem] text-destructive border border-destructive/20 shadow-inner">⚠️</div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-bold tracking-tight text-foreground">Unfollow User?</h3>
                                    <p className="text-muted-foreground text-sm font-medium leading-relaxed opacity-60">This will remove the user from your contacts and delete this private conversation.</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button onClick={handleUnfollow} className="btn-primary bg-destructive hover:bg-destructive shadow-destructive/20 h-16 rounded-3xl">UNFOLLOW</button>
                                    <button onClick={() => setShowUnfollowConfirm(false)} className="btn-ghost h-12 opacity-60">CANCEL</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {showInfo && !isPersonal && createPortal(
                <AnimatePresence>
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            onClick={() => setShowInfo(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="glass-panel w-full max-w-lg relative z-10 p-12 space-y-10 border-white/5"
                        >
                            <div className="flex justify-between items-start">
                                <div className="text-8xl drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] select-none">
                                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 5, repeat: Infinity }}>{image}</motion.div>
                                </div>
                                <button onClick={() => setShowInfo(false)} className="w-12 h-12 rounded-2xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all"><X className="w-6 h-6" /></button>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold tracking-widest text-primary opacity-60 mb-2 block uppercase">Group ID: {groupId.slice(0, 8)}</span>
                                <h3 className="text-5xl font-black tracking-tighter text-foreground leading-none">{title}</h3>
                                <div className="flex items-center gap-3 mt-4 text-muted-foreground text-[9px] font-bold tracking-widest opacity-40 uppercase">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Created: {new Date(createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between text-[9px] font-bold tracking-widest opacity-40 uppercase pb-2 border-b border-white/5">
                                    <span>Members ({memberCount})</span>
                                    <Users className="w-4 h-4" />
                                </div>
                                <div className="max-h-64 overflow-y-auto space-y-4 custom-scrollbar pr-4">
                                    {memberIds.map(id => (
                                        <div key={id} className="flex items-center gap-5 p-4 rounded-3xl bg-foreground/5 border border-white/5 group hover:bg-foreground/10 transition-all">
                                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform border border-white/10">
                                                {id.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-base tracking-tight text-foreground/90">Member_{id.slice(0, 5)}</p>
                                                <p className="text-[8px] font-bold text-primary tracking-widest uppercase opacity-40 mt-1">Member</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </AnimatePresence>,
                document.body
            )}
        </header>
    );
};
