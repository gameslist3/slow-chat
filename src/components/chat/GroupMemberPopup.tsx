import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { User } from '../../types';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { sendFollowRequest, unfollowUser } from '../../services/firebaseFollowService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface GroupMemberPopupProps {
    groupId: string;
    onClose: () => void;
    onMessageClick?: (userId: string) => void;
}

export const GroupMemberPopup: React.FC<GroupMemberPopupProps> = ({ groupId, onClose, onMessageClick }) => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [members, setMembers] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Real-time listener for group members and pending requests
    useEffect(() => {
        if (!currentUser?.id) return;

        const groupRef = doc(db, 'groups', groupId);

        // 1. Subscribe to Pending Sent Requests to show 'Pending' state
        const q = query(collection(db, 'follow_requests'),
            where('fromId', '==', currentUser.id),
            where('status', '==', 'pending')
        );
        const unsubPending = onSnapshot(q, (snapshot) => {
            setPendingRequests(snapshot.docs.map((d: any) => d.data().toId));
        });

        // 2. Subscribe to Group for Member List
        const unsubscribe = onSnapshot(groupRef, async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const memberIds: string[] = data.memberIds || [];

                if (memberIds.length === 0 && (data.memberCount > 0 || data.members > 0)) {
                    // Legacy group with no array but has members
                    setMembers([]);
                    setLoading(false);
                    return;
                }

                // Fetch user data for all members
                const memberPromises = memberIds.map(id => {
                    return new Promise<User | null>((resolve) => {
                        const userRef = doc(db, 'users', id);
                        onSnapshot(userRef, (userSnap) => {
                            if (userSnap.exists()) {
                                resolve({ id: userSnap.id, ...userSnap.data() } as User);
                            } else {
                                resolve(null);
                            }
                        });
                    });
                });

                const users = (await Promise.all(memberPromises)).filter(Boolean) as User[];
                setMembers(users);
                setLoading(false);
            }
        });

        return () => {
            unsubPending();
            unsubscribe();
        };
    }, [groupId, currentUser?.id]);

    const handleFollowAction = async (targetUser: User) => {
        if (!currentUser) return;

        try {
            if (currentUser.following?.includes(targetUser.id)) {
                await unfollowUser(targetUser.id);
                toast(`Unfollowed ${targetUser.username}`, 'info');
            } else {
                await sendFollowRequest(targetUser.id, targetUser.username);
                toast(`Follow request sent to ${targetUser.username}`, 'success');
            }
        } catch (error: any) {
            toast(error.message || 'Action failed', 'error');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[#0F1C34]/80 backdrop-blur-sm" onClick={onClose} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[#152238] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                        <div className="flex flex-col">
                            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary mb-0.5">Community Roster</h3>
                            <div className="flex items-center gap-2 text-xs font-bold text-white/90">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 group-hover:bg-emerald-400 transition-colors animate-[pulse_2s_ease-in-out_infinite]" />
                                {members.length} {members.length === 1 ? 'Member' : 'Members'} Listed
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all text-gray-400 hover:text-white border border-white/5">
                            <Icon name="x" className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Auto-Delete Info Banner */}
                    <div className="p-5 bg-white/[0.02] border-b border-white/5 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <Icon name="info" className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#E6ECFF] mb-1">Global Directives</div>
                            <p className="text-xs text-[#A9B4D0] leading-relaxed">
                                Be respectful. No spam. Auto-delete rules apply to all inactive sectors.
                            </p>
                        </div>
                    </div>

                    {/* Member List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <Icon name="rotate" className="w-8 h-8 animate-spin text-primary mb-4" />
                                <span className="text-xs uppercase tracking-widest font-bold text-primary">Loading roster...</span>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-60 text-center px-4">
                                <Icon name="users" className="w-10 h-10 text-[#7C89A6] mb-4 opacity-50" />
                                <p className="text-sm font-bold text-[#A9B4D0] mb-2">Legacy Cluster Format</p>
                                <p className="text-xs text-[#7C89A6]">
                                    This cluster was created before roster tracking was implemented. Detailed member list is unavailable.
                                </p>
                            </div>
                        ) : (
                            members.map(member => {
                                const isMe = currentUser?.id === member.id;
                                const isFollowing = currentUser?.following?.includes(member.id);
                                const isPending = pendingRequests.includes(member.id);

                                return (
                                    <div key={member.id} className="flex items-center justify-between p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary font-black text-xs uppercase">
                                                {member.username.slice(0, 2)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-[#E6ECFF] truncate text-sm">{member.username}</span>
                                                {isMe ? (
                                                    <span className="text-[9px] uppercase font-bold text-primary tracking-[0.2em] mt-0.5 opacity-60">You</span>
                                                ) : (
                                                    <span className="text-[9px] uppercase font-bold text-white/20 tracking-[0.2em] mt-0.5">External Identity</span>
                                                )}
                                            </div>
                                        </div>

                                        {!isMe && (
                                            <div className="flex gap-2">
                                                {isFollowing && onMessageClick && (
                                                    <button
                                                        onClick={() => onMessageClick(member.id)}
                                                        className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all border border-white/5"
                                                    >
                                                        <Icon name="messageSquare" className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => !isPending && handleFollowAction(member)}
                                                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all shadow-xl ${isFollowing
                                                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white'
                                                        : isPending
                                                            ? 'bg-white/5 text-white/30 border border-white/10 cursor-default'
                                                            : 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20'
                                                        }`}
                                                >
                                                    {isFollowing ? 'Prune' : isPending ? 'Pending' : 'Sync'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
