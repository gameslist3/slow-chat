import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import {
    subscribeToFriends,
    unfollowUser
} from '../../services/firebaseFollowService';
import { auth } from '../../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

import { PersonalChat } from '../../types';

interface Friend {
    requestId: string;
    uid: string;
    username: string;
    direction: 'incoming' | 'outgoing';
}

interface FriendsListProps {
    onSelectFriend?: (friendId: string) => void;
    personalChats?: PersonalChat[];
}

export const FriendsList: React.FC<FriendsListProps> = ({ onSelectFriend, personalChats = [] }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const currentUser = auth.currentUser;
    const { toast } = useToast();

    useEffect(() => {
        if (!currentUser) return;

        // Subscribe to friends
        const unsubFriends = subscribeToFriends(currentUser.uid, (data) => {
            setFriends(data);
        });

        return () => unsubFriends();
    }, [currentUser]);

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
                    My Friends
                </motion.h1>
                <p className="text-[#A9B4D0] font-medium text-lg tracking-wide opacity-80">
                    Your circle of trust
                </p>
            </header>

            {/* Content Section */}
            <div className="flex-1 px-4 md:px-12 lg:px-20 pb-20 max-w-[1400px] mx-auto w-full">

                {/* Friends Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="text-xl font-bold text-[#A9B4D0]">All Friends</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#7C89A6] text-xs font-bold">
                            {friends.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {friends.map((friend) => (
                            <motion.div
                                key={friend.uid}
                                whileHover={{ y: -4, boxShadow: '0 4px 20px -2px rgba(0,0,0,0.2)' }}
                                onClick={() => onSelectFriend?.(friend.uid)}
                                className="group relative flex items-center p-4 gap-4 rounded-[1.25rem] bg-[#152238]/60 border border-white/5 hover:border-[#5B79B7]/30 hover:bg-[#152238]/80 transition-all cursor-pointer backdrop-blur-sm"
                            >
                                {/* Left: Icon */}
                                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg text-white font-bold shrink-0">
                                    {friend.username[0].toUpperCase()}
                                </div>

                                {/* Center: Name */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[#E6ECFF] font-bold text-base truncate mb-0.5 group-hover:text-white transition-colors">
                                        {friend.username}
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                                        <span className="text-[#7C89A6] text-[10px] font-medium uppercase tracking-wide opacity-60">Online</span>
                                    </div>
                                </div>

                                {/* Right: Action/Badge */}
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const chat = personalChats.find(c => c.userIds.includes(friend.uid));
                                        const unread = chat?.unreadCounts?.[currentUser.uid] || 0;
                                        if (unread > 0) {
                                            return (
                                                <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                                    {unread}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#7FA6FF] group-hover:bg-[#3B82F6] group-hover:text-white transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow-lg">
                                        <Icon name="message" className="w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
