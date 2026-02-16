import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import {
    getPendingRequests,
    subscribeToFriends,
    acceptFollowRequest,
    declineFollowRequest,
    unfollowUser
} from '../../services/firebaseFollowService';
import { auth } from '../../config/firebase';
import { FollowRequest } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

interface Friend {
    requestId: string;
    uid: string;
    username: string;
    direction: 'incoming' | 'outgoing';
}

export const FriendsList: React.FC<{ onSelectFriend?: (friendId: string) => void }> = ({ onSelectFriend }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [showRequests, setShowRequests] = useState(false);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    useEffect(() => {
        if (!currentUser) return;

        // Subscribe to friends
        const unsubFriends = subscribeToFriends(currentUser.uid, (data) => {
            setFriends(data);
            setLoading(false);
        });

        // Subscribe to pending requests
        const unsubRequests = getPendingRequests((data) => {
            setRequests(data);
        });

        return () => {
            unsubFriends();
            unsubRequests();
        };
    }, [currentUser]);

    const handleAccept = async (reqId: string) => {
        const originalRequests = [...requests];
        setRequests(prev => prev.filter(r => r.id !== reqId));
        try {
            await acceptFollowRequest(reqId);
        } catch (error) {
            console.error("Failed to accept request:", error);
            setRequests(originalRequests);
        }
    };

    const handleDecline = async (reqId: string) => {
        const originalRequests = [...requests];
        setRequests(prev => prev.filter(r => r.id !== reqId));
        try {
            await declineFollowRequest(reqId);
        } catch (error) {
            console.error("Failed to decline request:", error);
            setRequests(originalRequests);
        }
    };

    const handleUnfollowFriend = async (friendId: string, username: string) => {
        if (!confirm(`Are you sure you want to terminate connection with ${username}?`)) return;

        try {
            await unfollowUser(friendId);
            toast(`Connection with ${username} terminated.`, 'info');
        } catch (error) {
            console.error("Failed to unfollow:", error);
            toast("Failed to terminate sync", 'error');
        }
    };

    if (!currentUser) return null;

    return (
        <div className="w-full h-full flex flex-col min-h-full">
            {/* Header */}
            <header className="flex flex-col items-center justify-center pt-24 pb-20 text-center px-6">
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-6xl font-semibold tracking-tight text-[#E6ECFF]"
                >
                    My <span className="font-bold">Friends</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#A9B4D0] font-medium text-lg opacity-60 mt-4"
                >
                    Pick up where you left off or find something new.
                </motion.p>
            </header>

            {/* Content Section */}
            <div className="flex-1 px-8 md:px-16 lg:px-24 pb-20">
                {/* Friends Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 max-w-[1400px] mx-auto mb-24">
                    {friends.map((friend) => (
                        <motion.div
                            key={friend.uid}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                            onClick={() => onSelectFriend?.(friend.uid)}
                            className="group flex items-center justify-between p-5 rounded-3xl bg-[#FFFFFF08] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-full bg-[#FFFFFF05] border border-white/5 flex items-center justify-center text-3xl">
                                    🍦
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[#E6ECFF] font-bold text-lg truncate mb-1">
                                        {friend.username}
                                    </h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[#A9B4D0] text-[9px] font-black uppercase tracking-widest">
                                <Icon name="mail" className="w-3 h-3" />
                                <span>2 New</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Pending Requests Section */}
                <section className="max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-xl font-bold text-[#E6ECFF]">Pending Friend Follow Requests</h3>
                        <div className="px-3 py-1 rounded-full bg-[#5B79B7]/20 border border-[#5B79B7]/40 text-[#7FA6FF] text-[10px] font-black leading-none">
                            <Icon name="users" className="w-3.5 h-3.5 inline mr-1" /> {requests.length}
                        </div>
                        <Icon name="arrowRight" className="w-5 h-5 text-[#A9B4D0] opacity-50" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                        {requests.map((req) => (
                            <div key={req.id} className="p-5 rounded-3xl bg-[#FFFFFF08] border border-white/5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#FFFFFF05] border border-white/5 flex items-center justify-center text-3xl">
                                            🍦
                                        </div>
                                        <div>
                                            <h4 className="text-[#E6ECFF] font-bold text-lg">{req.fromUsername}</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[#A9B4D0] text-[10px] font-black opacity-50">
                                        <Icon name="clock" className="w-3 h-3" />
                                        <span>2 D</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleAccept(req.id!)}
                                        className="flex-1 h-10 rounded-full bg-[#7ED957]/20 border border-[#7ED957]/40 text-[#7ED957] text-[10px] font-black uppercase tracking-widest hover:bg-[#7ED957] hover:text-[#0B1220] transition-all"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleDecline(req.id!)}
                                        className="flex-1 h-10 rounded-full bg-white/5 border border-white/10 text-[#A9B4D0] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
