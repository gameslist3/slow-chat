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
        <div className="w-full h-full relative">
            {/* Title: Global 80px -> Local 20px */}
            <div className="absolute top-[20px] left-0">
                <h2 className="text-4xl md:text-5xl font-normal text-white tracking-tight">My <span className="font-bold">Friends</span></h2>
            </div>
            {/* Subtitle not explicitly positioned in prompt but keeping it close to title */}

            {/* Friends Grid: Global 160px -> Local 100px */}
            <div className="absolute top-[100px] left-0 right-0 h-[200px]"> {/* Fixed height or just top? Prompt says "Friends grid top 160px... Pending section top 360px". So grid height limited or specific? 3 per row. I'll let it flow but pending is absolute. */}
                {/* Wait, if Pending is Top 360px, Grid must fit between 160px and 360px (200px height). That's small. 
                   "Friends grid top 160px ... Pending section top 360px".
                   Maybe the Grid pushes pending down? No, "Positioning ... Pending section top 360px" implies fixed.
                   I will treat Pending as Fixed Top 360px.
                   The Grid will start at Top 100px (Local).
                   If Grid content overlaps Pending, it will overlap. 
                   I will assume standard desktop view.
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {friends.map((friend) => (
                        <div
                            key={friend.uid}
                            onClick={() => onSelectFriend?.(friend.uid)}
                            className="bg-[#1A2333]/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-[#1A2333]/60 transition-all cursor-pointer group h-[80px]" // Height approx
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-transparent border border-white/10 flex items-center justify-center text-slate-300">
                                    <Icon name="user" className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-white text-lg">{friend.username}</span>
                            </div>
                            <div className="bg-[#151a23] border border-white/5 rounded-full px-3 py-1 text-xs font-medium text-slate-400">
                                2 New
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Section: Global 360px -> Local 300px */}
            <div className="absolute top-[300px] left-0 right-0 bottom-0">
                <div className="flex items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-slate-200">Pending Requests</h3>
                    <div className="px-2.5 py-0.5 rounded-full bg-[#151a23] border border-white/5 text-xs text-slate-400 font-bold">
                        {requests.length}
                    </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4">
                    {requests.map((req) => (
                        <div key={req.id} className="min-w-[300px] bg-[#1A2333]/40 border border-white/5 rounded-2xl p-5">
                            {/* Card content matches design */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Icon name="sparkles" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{req.fromUsername}</h4>
                                        <p className="text-xs text-slate-500">Wants to connect</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 bg-[#151a23] px-2 py-1 rounded-md border border-white/5">2 D</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleAccept(req.id!)}
                                    className="flex-1 bg-[#4C6B2F]/80 hover:bg-[#4C6B2F] text-[#B8E986] py-2 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleDecline(req.id!)}
                                    className="flex-1 bg-[#1A2333] border border-white/5 hover:bg-white/5 text-slate-400 py-2 rounded-lg text-sm font-bold transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
