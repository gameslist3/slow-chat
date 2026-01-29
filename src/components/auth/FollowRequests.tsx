import React, { useState, useEffect } from 'react';
import { getPendingRequests, acceptFollowRequest, declineFollowRequest } from '../../services/firebaseFollowService';
import { FollowRequest } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';

interface FollowRequestsProps {
    onBack: () => void;
}

export const FollowRequests: React.FC<FollowRequestsProps> = ({ onBack }) => {
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = getPendingRequests(setRequests);
        return () => unsubscribe();
    }, []);

    const handleAction = async (id: string, action: 'accept' | 'decline') => {
        setLoadingId(id);
        try {
            if (action === 'accept') await acceptFollowRequest(id);
            else await declineFollowRequest(id);
        } catch (error) {
            console.error('Follow action failed:', error);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent animate-in fade-in duration-700">
            <header className="px-4 md:px-8 py-8 border-b border-white/5">
                <motion.button
                    whileHover={{ x: -4, color: 'var(--primary)' }}
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors mb-6"
                >
                    <Icon name="arrowLeft" className="w-5 h-5" /> Back
                </motion.button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 glass-panel rounded-xl flex items-center justify-center text-primary shadow-lg">
                        <Icon name="userPlus" className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Follow Requests</h1>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-4">
                    <AnimatePresence mode="popLayout">
                        {requests.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-20 text-center flex flex-col items-center gap-4 opacity-50"
                            >
                                <div className="w-16 h-16 glass-card rounded-full flex items-center justify-center">
                                    <Icon name="checkCircle" className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">All caught up</p>
                            </motion.div>
                        ) : (
                            requests.map(req => (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                    className="glass-panel flex items-center justify-between p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-300 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-black text-lg text-white shadow-lg">
                                            {req.fromUsername.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground tracking-tight mb-1">{req.fromUsername}</h3>
                                            <p className="text-xs font-medium text-primary">Wants to follow you</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleAction(req.id, 'accept')}
                                            disabled={loadingId === req.id}
                                            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg hover:shadow-primary/30 transition-all"
                                            title="Accept"
                                        >
                                            {loadingId === req.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="check" className="w-5 h-5" />}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleAction(req.id, 'decline')}
                                            disabled={loadingId === req.id}
                                            className="w-10 h-10 rounded-xl glass-card bg-white/5 text-gray-400 flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 transition-all"
                                            title="Decline"
                                        >
                                            <Icon name="x" className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
