import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Users, CheckCircle2 } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Group } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface GroupInviteCardProps {
    groupId: string;
    onJoinSuccess?: () => void;
}

export const GroupInviteCard: React.FC<GroupInviteCardProps> = ({ groupId, onJoinSuccess }) => {
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, joinGroup } = useAuth();
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const snap = await getDoc(doc(db, 'groups', groupId));
                if (snap.exists()) {
                    setGroup({ ...snap.data(), id: snap.id } as Group);
                }
            } catch (err) {
                console.error("Failed to fetch invite group:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGroup();
    }, [groupId]);

    const handleJoin = async () => {
        if (!user || !group || joining) return;
        setJoining(true);
        try {
            await joinGroup(groupId);
            onJoinSuccess?.();
        } catch (err) {
            console.error("Invite join failed:", err);
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-sm p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-1/2" />
                        <div className="h-3 bg-white/10 rounded w-1/4" />
                    </div>
                </div>
            </div>
        );
    }

    if (!group) return null;

    const isJoined = user?.joinedGroups.includes(groupId);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#152238]/80 border border-white/10 backdrop-blur-xl group transition-all hover:border-[#5B79B7]/50"
        >
            <div className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1F2937] to-[#111827] flex items-center justify-center text-2xl border border-white/10 shadow-lg">
                    {group.image || '🌟'}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#E6ECFF] truncate tracking-tight">{group.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-[#7C89A6] uppercase tracking-wider">
                        <Users className="w-3 h-3" />
                        <span>{group.members} Members</span>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-white/5 flex items-center justify-end">
                <button
                    onClick={handleJoin}
                    disabled={isJoined || joining}
                    className={`
                        h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-tighter transition-all
                        ${isJoined
                            ? 'bg-[#7ED957]/20 text-[#7ED957] cursor-default'
                            : 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-blue-500/20 active:scale-95'
                        }
                    `}
                >
                    {joining ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isJoined ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Joined
                        </>
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" />
                            Join Protocol
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};
