import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '../ui/Button';
import { getUserById } from '../../services/firebaseAuthService';
import { getFollowStatus, sendFollowRequest, unfollowUser } from '../../services/firebaseFollowService';
import { useToast } from '../../context/ToastContext';

interface UserProfileModalProps {
    userId: string;
    currentUserId: string;
    onClose: () => void;
    onMessage?: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
    userId,
    currentUserId,
    onClose,
    onMessage
}) => {
    const [user, setUser] = useState<any>(null);
    const [status, setStatus] = useState<string>('none');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const isMe = userId === currentUserId;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [u, s] = await Promise.all([
                    getUserById(userId),
                    getFollowStatus(userId)
                ]);
                setUser(u);
                setStatus(s || 'none');
            } catch (e) {
                toast("Failed to load profile", "error");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        if (userId) load();
    }, [userId]);

    const handleFollow = async () => {
        try {
            await sendFollowRequest(userId, user?.username || 'User');
            setStatus('pending');
            toast("Request sent", "success");
        } catch (e) {
            toast("Failed to follow", "error");
        }
    };

    const handleUnfollow = async () => {
        try {
            await unfollowUser(userId);
            setStatus('none');
            toast("Unfollowed", "success");
        } catch (e) {
            toast("Failed to unfollow", "error");
        }
    };

    if (!user && !loading) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm bg-[#0F1C34] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {loading ? (
                        <div className="min-h-[300px] flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center pt-4">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-4xl font-black text-[#E6ECFF] shadow-xl border border-white/10 mb-6">
                                {user.username.charAt(0).toUpperCase()}
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{user.username}</h2>
                            <p className="text-sm text-gray-400 mb-8">{user.bio || 'Member of the Cluster'}</p>

                            {!isMe && (
                                <div className="flex flex-col gap-3 w-full">
                                    {status === 'accepted' && (
                                        <Button
                                            className="w-full gap-2 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
                                            onClick={() => onMessage?.(userId)}
                                        >
                                            <MessageSquare className="w-4 h-4" /> Message Now
                                        </Button>
                                    )}
                                    <div className="flex gap-3 w-full">
                                        {status === 'accepted' ? (
                                            <Button
                                                variant="outline"
                                                className="flex-1 gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
                                                onClick={handleUnfollow}
                                            >
                                                <UserMinus className="w-4 h-4" /> End Chat
                                            </Button>
                                        ) : status === 'pending' ? (
                                            <Button
                                                variant="secondary"
                                                className="flex-1 gap-2 opacity-70 cursor-not-allowed"
                                                disabled
                                            >
                                                Requested
                                            </Button>
                                        ) : status === 'cooldown' ? (
                                            <Button
                                                variant="secondary"
                                                className="flex-1 gap-2 opacity-50 cursor-not-allowed"
                                                disabled
                                            >
                                                Protocol Unstable
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                className="flex-1 gap-2"
                                                onClick={handleFollow}
                                            >
                                                <UserPlus className="w-4 h-4" /> Follow
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
