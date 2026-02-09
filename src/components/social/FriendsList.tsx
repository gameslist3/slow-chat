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
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<FollowRequest[]>([]);
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
        <div className="flex flex-col h-full rounded-xl overflow-hidden">
            {/* Header / Tabs */}
            <div className="flex items-center p-2 gap-2 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'friends'
                        ? 'bg-white/10 text-white shadow-sm border border-white/5'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <Icon name="users" className="w-4 h-4" />
                    Friends
                    <span className="ml-1 text-[9px] opacity-60">({friends.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${activeTab === 'requests'
                        ? 'bg-white/10 text-white shadow-sm border border-white/5'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <Icon name="userPlus" className="w-4 h-4" />
                    Requests
                    {requests.length > 0 && (
                        <span className="absolute top-1 right-2 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-2 space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Icon name="rotate" className="w-5 h-5 animate-spin" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'friends' ? (
                            <motion.div
                                key="friends-list"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-1"
                            >
                                {friends.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center border border-white/5">
                                            <Icon name="users" className="w-6 h-6 opacity-30" />
                                        </div>
                                        <p>No friends yet.</p>
                                        <p className="text-xs opacity-40 mt-1">Start connecting with people!</p>
                                    </div>
                                ) : (
                                    friends.map((friend) => (
                                        <div
                                            key={friend.uid}
                                            className="group w-full flex items-center justify-between p-4 rounded-2xl glass-card border border-white/5 hover:bg-white/10 transition-all text-left"
                                        >
                                            <button
                                                onClick={() => onSelectFriend?.(friend.uid)}
                                                className="flex flex-1 items-center gap-4 min-w-0"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-sm shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                                                    {friend.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-sm text-white/90 truncate">{friend.username}</span>
                                            </button>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onSelectFriend?.(friend.uid)}
                                                    className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                                                    title="Message"
                                                >
                                                    <Icon name="message" className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleUnfollowFriend(friend.uid, friend.username)}
                                                    className="p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                                                    title="Unfollow"
                                                >
                                                    <Icon name="userMinus" className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="requests-list"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-2"
                            >
                                {requests.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center border border-white/5">
                                            <Icon name="check" className="w-6 h-6 opacity-30" />
                                        </div>
                                        <p>No pending requests.</p>
                                    </div>
                                ) : (
                                    requests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="p-4 rounded-2xl glass-card flex flex-col gap-4 border border-white/5"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-black text-sm ring-1 ring-accent/30 shadow-lg">
                                                    {req.fromUsername.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate text-white/90">{req.fromUsername}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold opacity-60">Wants to connect</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAccept(req.id!)}
                                                    className="flex-1 py-3 bg-primary text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                                                >
                                                    <Icon name="check" className="w-4 h-4" /> Accept
                                                </button>
                                                <button
                                                    onClick={() => handleDecline(req.id!)}
                                                    className="flex-1 py-3 bg-foreground/5 text-muted-foreground hover:bg-destructive hover:text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest hover:scale-105 active:scale-95"
                                                >
                                                    <Icon name="x" className="w-4 h-4" /> Decline
                                                </button>
                                            </div>
                                        </div>
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
