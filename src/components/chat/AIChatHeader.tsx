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
        <header className="h-20 bg-[#0B1220]/60 backdrop-blur-md flex items-center justify-between px-6 md:px-8 sticky top-0 z-40 transition-all border-b border-white/5">
            <div className="flex items-center gap-4">
                <button
                    onClick={onLeave}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/5 group"
                >
                    <Icon name="arrowLeft" className="w-5 h-5 text-[#A9B4D0] group-hover:text-white transition-colors" />
                </button>

                <div className="flex items-center gap-4 py-1 px-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-[#FFFFFF0D] flex items-center justify-center text-lg border border-[#FFFFFF1F] shadow-sm text-white">
                        {image}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[#E6ECFF] tracking-wide leading-tight">{title}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Icon name="users" className="w-3 h-3 text-[#7C89A6]" />
                            <p className="text-[10px] font-bold text-[#7C89A6] uppercase tracking-wider">
                                {isPersonal ? 'Private' : `${memberCount} Members`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-xl bg-[#FFFFFF06] border border-[#FFFFFF12] hover:bg-[#FFFFFF0D] hover:border-[#FFFFFF26] hover:shadow-[0_0_15px_rgba(127,166,255,0.2)] flex items-center justify-center transition-all group"
                >
                    {copied ? <Check className="w-4 h-4 text-[#7ED957]" /> : <Share2 className="w-4 h-4 text-[#A9B4D0] group-hover:text-white" />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`w-10 h-10 rounded-xl bg-[#FFFFFF06] border border-[#FFFFFF12] flex items-center justify-center transition-all ${showMore ? 'bg-[#5B79B7] text-white shadow-[0_0_15px_rgba(91,121,183,0.4)] border-transparent' : 'hover:bg-[#FFFFFF0D] hover:border-[#FFFFFF26] text-[#A9B4D0] hover:text-white'}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {showMore && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-3 w-60 bg-[#0F1C34] border border-[#FFFFFF1F] rounded-2xl shadow-2xl py-2 overflow-hidden z-50 ring-1 ring-black/50"
                            >
                                <button onClick={handleToggleMute} className="w-full h-12 flex items-center gap-3 px-5 text-[10px] font-bold uppercase tracking-widest text-[#A9B4D0] hover:bg-white/5 hover:text-white transition-all">
                                    {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                    {muted ? 'Restore Alerts' : 'Mute Notifications'}
                                </button>
                                <div className="h-px bg-white/5 my-1" />
                                <button onClick={handleLeave} className="w-full h-12 flex items-center gap-3 px-5 text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-all">
                                    <LogOut className="w-4 h-4" />
                                    {isPersonal ? 'End Connection' : 'Leave Channel'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};
