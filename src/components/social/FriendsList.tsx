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
        <div className="w-full h-full flex flex-col px-6 md:px-12 py-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        My <span className="text-primary">Network</span>
                    </h2>
                    <p className="text-blue-200/40 font-bold uppercase tracking-widest text-xs mt-2">
                        Active Connections & Sync Requests
                    </p>
                </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-8 custom-scrollbar space-y-12">

                {/* Pending Requests */}
                {requests.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                <Icon name="sparkles" className="w-4 h-4 text-secondary" />
                                Pending Uplinks
                            </h3>
                            <div className="px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] text-secondary font-black">
                                {requests.length}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {requests.map((req) => (
                                <div key={req.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between gap-4 border-l-2 border-l-secondary/50">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 shrink-0">
                                            <Icon name="user" className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-white truncate">{req.fromUsername}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Incoming Request</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAccept(req.id!)}
                                            className="w-8 h-8 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary hover:text-black flex items-center justify-center transition-colors"
                                            title="Accept"
                                        >
                                            <Icon name="check" className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDecline(req.id!)}
                                            className="w-8 h-8 rounded-lg bg-white/5 text-muted-foreground hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors"
                                            title="Decline"
                                        >
                                            <Icon name="x" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Friends Grid */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-3">
                            <Icon name="users" className="w-4 h-4 text-primary" />
                            Active Nodes
                        </h3>
                        <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-black">
                            {friends.length}
                        </div>
                    </div>

                    {friends.length === 0 ? (
                        <div className="py-20 text-center opacity-30">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon name="users" className="w-8 h-8" />
                            </div>
                            <p className="text-xs uppercase tracking-widest font-bold">Network Empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {friends.map((friend) => (
                                <motion.div
                                    key={friend.uid}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => onSelectFriend?.(friend.uid)}
                                    className="glass-card p-4 rounded-2xl flex items-center gap-4 cursor-pointer group hover:border-primary/30 hover:bg-primary/5 transition-all"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                        <Icon name="user" className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="font-bold text-white truncate group-hover:text-primary transition-colors">{friend.username}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Online
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleUnfollowFriend(friend.uid, friend.username); }}
                                        className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-transparent group-hover:text-red-500/50 hover:!text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        title="Disconnect"
                                    >
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
