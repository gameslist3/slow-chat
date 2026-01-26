import React, { useState } from 'react';
import { Settings, Info, Share2, MoreVertical, X, Calendar, Users, BellOff, LogOut, Copy, Check, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { toggleMuteGroup, leaveGroup, isMuted } from '../../services/firebaseGroupService';
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
            toast(muted ? "Unmuted" : "Notifications muted", "success");
        } catch (error) {
            toast("Failed to update settings", "error");
        }
    };

    const handleLeave = async () => {
        if (!user) return;
        try {
            await leaveGroup(groupId, user.id);
            toast("Left group", "success");
            onLeave?.();
        } catch (error) {
            toast("Failed to leave group", "error");
        }
    };

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-40 h-[72px]">
            <div className="flex items-center gap-4">
                <div className="text-3xl drop-shadow-sm transition-transform hover:scale-110 cursor-default">{image}</div>
                <div>
                    <h2 className="font-black text-lg leading-tight tracking-tight uppercase italic">{title}</h2>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${muted ? 'bg-muted' : 'bg-secondary animate-pulse'}`} />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                            {isPersonal ? 'Active' : `${memberCount} members`} {muted && '• Muted'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 relative">
                {!isPersonal && (
                    <>
                        <button
                            onClick={handleShare}
                            className="ui-button-ghost p-2 rounded-xl hidden sm:flex text-muted-foreground hover:text-primary transition-colors"
                            title="Share Group"
                        >
                            {copied ? <Check className="w-4 h-4 text-secondary" /> : <Share2 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowInfo(true)}
                            className="ui-button-ghost p-2 rounded-xl hidden sm:flex text-muted-foreground hover:text-primary transition-colors"
                            title="Group Info"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                        <div className="ui-divider h-4 w-[1px] mx-2 bg-border hidden sm:block" />
                    </>
                )}

                <div className="relative">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`ui-button-ghost p-2 rounded-xl transition-all ${showMore ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {showMore && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-3 w-56 bg-surface border-2 border-border shadow-2xl rounded-[1.5rem] overflow-hidden z-50 py-2"
                            >
                                <button
                                    onClick={handleToggleMute}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                                >
                                    {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                    {muted ? 'Unmute notifications' : 'Mute notifications'}
                                </button>
                                {!isPersonal && (
                                    <button
                                        onClick={() => setShowLeaveConfirm(true)}
                                        className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-danger hover:bg-danger/5 transition-all"
                                    >
                                        <LogOut className="w-4 h-4" /> Leave Group
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Leave Confirm Modal */}
            <AnimatePresence>
                {showLeaveConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/90 backdrop-blur-md"
                            onClick={() => setShowLeaveConfirm(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="ui-card w-full max-w-sm relative z-10 p-8 text-center space-y-6 border-2 border-danger/30"
                        >
                            <div className="text-5xl mx-auto w-16 h-16 bg-danger/10 flex items-center justify-center rounded-2xl text-danger mb-2">🚿</div>
                            <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Leave Group?</h3>
                            <p className="text-muted-foreground text-sm font-medium">You will no longer receive messages from this group. You can rejoin at any time from the discovery page.</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleLeave} className="ui-button-primary bg-danger text-white border-danger shadow-lg shadow-danger/20 h-14 font-black uppercase tracking-widest text-xs">Confirm</button>
                                <button onClick={() => setShowLeaveConfirm(false)} className="ui-button-ghost h-12 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Info Modal */}
            <AnimatePresence>
                {showInfo && !isPersonal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setShowInfo(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="ui-card w-full max-w-md relative z-10 p-10 space-y-8 border-2"
                        >
                            <div className="flex justify-between items-start">
                                <div className="text-6xl drop-shadow-xl">{image}</div>
                                <button onClick={() => setShowInfo(false)} className="ui-button-ghost p-3 rounded-full"><X className="w-6 h-6" /></button>
                            </div>

                            <div>
                                <h3 className="text-4xl font-black tracking-tighter mb-2 uppercase italic leading-none">{title}</h3>
                                <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] italic">
                                    <Calendar className="w-3 h-3" />
                                    <span>Sync Initialized {new Date(createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">
                                    <span>Sync Participants ({memberCount})</span>
                                    <Users className="w-4 h-4" />
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-3 custom-scrollbar pr-3">
                                    {memberIds.map(id => (
                                        <div key={id} className="flex items-center gap-4 p-3 rounded-[1.5rem] bg-surface2/50 border border-border/30 group">
                                            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                                                {id.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-sm uppercase tracking-tight">Sync_{id.slice(0, 4)}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-40">Verified Identity</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </header>
    );
};
