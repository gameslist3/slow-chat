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
        <header className="h-20 flex items-center justify-between px-4 md:px-8 absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#0B1221]/90 to-transparent">
            {/* Left: Back + Group Label */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onLeave}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors group"
                >
                    <Icon name="arrowLeft" className="w-6 h-6 text-[#E6ECFF] group-hover:scale-110 transition-transform" />
                </button>

                <div className="flex items-center gap-3 px-2 py-1.5 rounded-full bg-[#FFFFFF06] border border-[#FFFFFF12] backdrop-blur-md pr-6">
                    <div className="w-8 h-8 rounded-full bg-[#FFFFFF0D] flex items-center justify-center text-sm border border-[#FFFFFF1F] text-white">
                        {image}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-[#E6ECFF] leading-none">{title}</h2>
                            {!isPersonal && (
                                <span className="text-[10px] font-medium text-[#7C89A6]">{memberCount}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Share + Options */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-xl bg-[#FFFFFF06] border border-[#FFFFFF12] flex items-center justify-center hover:bg-[#FFFFFF0D] hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all group"
                >
                    {copied ? <Check className="w-5 h-5 text-[#7ED957]" /> : <Share2 className="w-5 h-5 text-[#E6ECFF]" />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`w-10 h-10 rounded-xl bg-[#FFFFFF06] border border-[#FFFFFF12] flex items-center justify-center transition-all ${showMore ? 'bg-[#5B79B7] border-[#5B79B7] text-white' : 'hover:bg-[#FFFFFF0D] text-[#E6ECFF]'}`}
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {showMore && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-56 bg-[#0F1C34] border border-white/10 rounded-2xl shadow-2xl py-2 overflow-hidden z-50 backdrop-blur-xl"
                            >
                                <button onClick={handleToggleMute} className="w-full h-12 flex items-center gap-3 px-4 text-xs font-bold uppercase tracking-wider text-[#A9B4D0] hover:bg-white/5 hover:text-white transition-all">
                                    {muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                    {muted ? 'Unmute' : 'Mute'}
                                </button>
                                <div className="h-px bg-white/5 mx-4 my-1" />
                                <button onClick={handleLeave} className="w-full h-12 flex items-center gap-3 px-4 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition-all">
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
