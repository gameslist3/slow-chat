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
        <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
            {/* Header */}
            <header className="flex flex-col items-center justify-center pt-20 pb-12 text-center px-6">
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-semibold tracking-tight text-[#E6ECFF] mb-2"
                >
                    Friends
                </motion.h1>
                <div className="h-1 w-12 bg-[#5B79B7] rounded-full opacity-50" />
            </header>

            {/* Content Section */}
            <div className="flex-1 px-6 md:px-12 lg:px-20 pb-20 max-w-[1400px] mx-auto w-full">

                {/* Pending Requests Section */}
                {requests.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-xl font-bold text-[#E6ECFF]">Follow Requests</h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6] text-white text-xs font-bold shadow-lg shadow-blue-900/20">
                                {requests.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {requests.map((req) => (
                                <div key={req.id} className="p-5 rounded-[1.5rem] bg-[#152238]/60 border border-white/5 flex flex-col gap-4 shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#1E3A8A] flex items-center justify-center text-xl text-white font-bold border-2 border-[#152238] ring-2 ring-[#3B82F6]/20">
                                            {req.fromUsername[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-[#E6ECFF] font-bold text-lg leading-tight">{req.fromUsername}</h4>
                                            <p className="text-[#7C89A6] text-xs font-medium">Follows you</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2.5 mt-auto">
                                        <button
                                            onClick={() => handleAccept(req.id!)}
                                            className="flex-1 h-9 rounded-full bg-[#3B82F6] text-white text-xs font-bold hover:bg-[#2563EB] transition-colors shadow-lg shadow-blue-900/20"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => handleDecline(req.id!)}
                                            className="flex-1 h-9 rounded-full bg-white/5 border border-white/10 text-[#A9B4D0] text-xs font-bold hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Friends Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-[#A9B4D0]">All Friends</h3>
                        {/* Search or Filter could go here */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {friends.map((friend) => (
                            <motion.div
                                key={friend.uid}
                                whileHover={{ y: -4 }}
                                onClick={() => onSelectFriend?.(friend.uid)}
                                className="group relative flex items-center justify-between p-5 rounded-[1.5rem] bg-[#152238]/40 border border-white/5 hover:border-[#5B79B7]/30 hover:bg-[#152238]/80 transition-all cursor-pointer shadow-sm hover:shadow-xl"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#0F1C34] border border-white/10 flex items-center justify-center text-lg text-white font-bold">
                                            {friend.username[0].toUpperCase()}
                                        </div>
                                        {/* Status Dot */}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] rounded-full border-2 border-[#152238] shadow-[0_0_8px_#10B981]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[#E6ECFF] font-bold text-base truncate mb-0.5 group-hover:text-white transition-colors">
                                            {friend.username}
                                        </h4>
                                        <p className="text-[#7C89A6] text-xs font-medium truncate opacity-60">Online</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#7FA6FF] group-hover:bg-[#3B82F6] group-hover:text-white transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
                                    <Icon name="message" className="w-4 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
