import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { User } from '../../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { sendFollowRequest, unfollowUser, acceptFollowRequest } from '../../services/firebaseFollowService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface GroupMemberPopupProps {
    groupId: string;
    onClose: () => void;
}

export const GroupMemberPopup: React.FC<GroupMemberPopupProps> = ({ groupId, onClose }) => {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [members, setMembers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Real-time listener for group members
    useEffect(() => {
        const groupRef = doc(db, 'groups', groupId);

        const unsubscribe = onSnapshot(groupRef, async (snapshot) => {
            if (snapshot.exists()) {
                const memberIds: string[] = snapshot.data().memberIds || [];

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

        return () => unsubscribe();
    }, [groupId]);

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
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-3 text-primary">
                            <Icon name="users" className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-widest text-sm text-[#E6ECFF]">Group Roster</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                            <Icon name="x" className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Auto-Delete Info Banner */}
                    <div className="p-4 bg-primary/10 border-b border-primary/20 flex gap-3 text-sm">
                        <Icon name="info" className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-[#A9B4D0] leading-relaxed">
                            <span className="font-bold text-[#E6ECFF]">Auto-Delete Rules:</span> Groups inactive for 24 hours, or with fewer than 2 users for 12 hours, will be permanently deleted along with all media and messages.
                        </div>
                    </div>

                    {/* Member List */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <Icon name="rotate" className="w-8 h-8 animate-spin text-primary mb-4" />
                                <span className="text-xs uppercase tracking-widest font-bold text-primary">Loading roster...</span>
                            </div>
                        ) : (
                            members.map(member => {
                                const isMe = currentUser?.id === member.id;
                                const isFollowing = currentUser?.following?.includes(member.id);

                                return (
                                    <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#E6ECFF] truncate max-w-[150px]">{member.username}</span>
                                            {isMe && <span className="text-[10px] uppercase font-bold text-primary tracking-widest mt-0.5">You</span>}
                                        </div>

                                        {!isMe && (
                                            <button
                                                onClick={() => handleFollowAction(member)}
                                                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg ${isFollowing
                                                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
                                                        : 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20'
                                                    }`}
                                            >
                                                {isFollowing ? 'Unfollow' : 'Connect'}
                                            </button>
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
