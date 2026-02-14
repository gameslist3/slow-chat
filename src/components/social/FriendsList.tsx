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
        <div className="flex flex-col h-full rounded-xl">
            {/* Minimal Header */}
            <div className="flex items-center justify-between p-2 mb-6">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Friends</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowRequests(!showRequests)}
                        className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showRequests ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface2 hover:bg-surface text-muted-foreground hover:text-foreground'}`}
                    >
                        <Icon name="userPlus" className="w-5 h-5" />
                        {requests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-white ring-2 ring-background animate-in zoom-in">
                                {requests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-1">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Icon name="rotate" className="w-5 h-5 animate-spin" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {showRequests ? (
                            <motion.div
                                key="requests-list"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-4"
                            >
                                <div className="p-6 md:p-8 glass-panel rounded-[2.5rem] border-primary/20">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-lg ring-1 ring-primary/20">
                                            <Icon name="userPlus" className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">Pending Requests</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {requests.length === 0 ? (
                                            <div className="text-center py-12 text-muted-foreground text-sm opacity-40 uppercase font-black tracking-widest">
                                                No pending requests
                                            </div>
                                        ) : (
                                            requests.map((req) => (
                                                <div
                                                    key={req.id}
                                                    className="p-4 rounded-2xl bg-white/5 flex items-center justify-between border border-white/5"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-sm">
                                                            {req.fromUsername.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-white/90">{req.fromUsername}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40">Wants to connect</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleAccept(req.id!)}
                                                            className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                                        >
                                                            <Icon name="check" className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecline(req.id!)}
                                                            className="w-10 h-10 bg-surface2 text-muted-foreground hover:text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                                                        >
                                                            <Icon name="x" className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowRequests(false)}
                                        className="w-full mt-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-colors"
                                    >
                                        Back to friends
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="friends-list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {friends.length === 0 ? (
                                    <div className="col-span-full text-center py-20 text-muted-foreground">
                                        <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center border border-white/5 opacity-20">
                                            <Icon name="users" className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold uppercase tracking-widest text-sm opacity-40">No friends yet.</p>
                                    </div>
                                ) : (
                                    friends.map((friend) => (
                                        <motion.div
                                            key={friend.uid}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group relative glass-panel p-6 border border-white/5 hover:border-primary/40 transition-all text-left cursor-pointer overflow-hidden"
                                            onClick={() => onSelectFriend?.(friend.uid)}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/20 border border-white/10 group-hover:scale-105 transition-transform">
                                                    {friend.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-xl text-white truncate">{friend.username}</h4>
                                                    <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">Active Peer</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 relative z-10">
                                                <button
                                                    className="flex-1 h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Open Channel
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUnfollowFriend(friend.uid, friend.username); }}
                                                    className="w-12 h-12 rounded-xl bg-white/5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all flex items-center justify-center"
                                                    title="Terminate connection"
                                                >
                                                    <Icon name="x" className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};
