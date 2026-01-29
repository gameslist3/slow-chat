import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import {
    getPendingRequests,
    subscribeToFriends,
    acceptFollowRequest,
    declineFollowRequest
} from '../../services/firebaseFollowService';
import { auth } from '../../config/firebase';
import { FollowRequest } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

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
        try {
            await acceptFollowRequest(reqId);
        } catch (error) {
            console.error("Failed to accept request:", error);
        }
    };

    const handleDecline = async (reqId: string) => {
        try {
            await declineFollowRequest(reqId);
        } catch (error) {
            console.error("Failed to decline request:", error);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="flex flex-col h-full bg-card/50 rounded-xl overflow-hidden border border-border/50">
            {/* Header / Tabs */}
            <div className="flex items-center p-2 gap-2 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'friends'
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                        }`}
                >
                    <Icon name="users" className="w-4 h-4" />
                    Friends
                    <span className="ml-1 text-xs opacity-60">({friends.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all relative ${activeTab === 'requests'
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                        }`}
                >
                    <Icon name="userPlus" className="w-4 h-4" />
                    Requests
                    {requests.length > 0 && (
                        <span className="absolute top-1 right-2 w-2 h-2 bg-accent rounded-full animate-pulse" />
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
                                        <div className="w-12 h-12 rounded-full bg-secondary/30 mx-auto mb-3 flex items-center justify-center">
                                            <Icon name="users" className="w-6 h-6 opacity-50" />
                                        </div>
                                        <p>No friends yet.</p>
                                        <p className="text-xs opacity-60 mt-1">Start connecting with people!</p>
                                    </div>
                                ) : (
                                    friends.map((friend) => (
                                        <div
                                            key={friend.uid}
                                            className="group flex items-center justify-between p-3 rounded-lg bg-card hover:bg-secondary/40 transition-all border border-transparent hover:border-border/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                    {friend.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-sm text-foreground">{friend.username}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onSelectFriend?.(friend.uid)}
                                                    className="p-2 rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                                    title="Message"
                                                >
                                                    <Icon name="message" className="w-4 h-4" />
                                                </button>
                                                {/* Future: Unfollow/Block menu */}
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
                                        <div className="w-12 h-12 rounded-full bg-secondary/30 mx-auto mb-3 flex items-center justify-center">
                                            <Icon name="check" className="w-6 h-6 opacity-50" />
                                        </div>
                                        <p>No pending requests.</p>
                                    </div>
                                ) : (
                                    requests.map((req) => (
                                        <div
                                            key={req.id}
                                            className="p-3 rounded-lg bg-card/80 border border-border/50 flex flex-col gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs ring-1 ring-accent/30">
                                                    {req.fromUsername.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{req.fromUsername}</p>
                                                    <p className="text-xs text-muted-foreground">Wants to be friends</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAccept(req.id!)}
                                                    className="flex-1 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Icon name="check" className="w-3 h-3" /> Accept
                                                </button>
                                                <button
                                                    onClick={() => handleDecline(req.id!)}
                                                    className="flex-1 py-1.5 bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Icon name="x" className="w-3 h-3" /> Decline
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
