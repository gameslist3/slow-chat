import React, { useState } from 'react';
import { Settings, Info, Share2, MoreVertical, BellOff, LogOut, Check, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { toggleMuteGroup, leaveGroup, isMuted } from '../../services/firebaseGroupService';
import { unfollowUser } from '../../services/firebaseFollowService';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';

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
    memberCount,
    onLeave
}) => {
    const [showMore, setShowMore] = useState(false);
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
        toast("Access link copied", "success");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleMute = async () => {
        if (!user) return;
        try {
            await toggleMuteGroup(groupId, user.id, !muted);
            setMuted(!muted);
            setShowMore(false);
            toast(muted ? "Alerts restored" : "Alerts suppressed", "success");
        } catch (error) {
            toast("Protocol failed", "error");
        }
    };

    const handleLeave = async () => {
        if (!user) return;
        try {
            if (isPersonal) {
                const ids = groupId.split('_');
                const otherId = ids.find(id => id !== user.id);
                if (otherId) await unfollowUser(otherId);
            } else {
                await leaveGroup(groupId, user.id);
            }
            toast("Connection terminated", "success");
            onLeave?.();
        } catch (error) {
            toast("Override failed", "error");
        }
    };

    return (
        <header className="h-20 border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40 transition-all">
            <div className="flex items-center gap-6">
                <button onClick={onLeave} className="md:hidden w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors">
                    <Icon name="arrowLeft" className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl shadow-lg border border-white/5">
                        {image}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black uppercase tracking-tight leading-none">{title}</h2>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">
                            {isPersonal ? 'Direct Message' : `${memberCount} Members`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={handleShare} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-colors group">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-muted-foreground group-hover:text-white" />}
                </button>

                <div className="relative">
                    <button onClick={() => setShowMore(!showMore)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showMore ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-muted-foreground'}`}>
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {showMore && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-56 bg-[#080808] border border-white/10 rounded-2xl shadow-2xl py-2 overflow-hidden z-50 ring-1 ring-white/5"
                            >
                                <button onClick={handleToggleMute} className="w-full h-12 flex items-center gap-3 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                                    {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                    {muted ? 'Restore Alerts' : 'Suppress Alerts'}
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                                <button onClick={handleLeave} className="w-full h-12 flex items-center gap-3 px-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all">
                                    <LogOut className="w-4 h-4" />
                                    {isPersonal ? 'End Chat' : 'Leave Group'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};
