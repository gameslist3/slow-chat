import React, { useState, useEffect } from 'react';
import { User, Check, X, UserPlus, Clock, ArrowLeft } from 'lucide-react';
import { getPendingRequests, acceptFollowRequest, declineFollowRequest } from '../../services/firebaseFollowService';
import { FollowRequest } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

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
            <header className="px-8 py-10 border-b border-border/5">
                <motion.button
                    whileHover={{ x: -4, color: 'var(--primary)' }}
                    onClick={onBack}
                    className="font-protocol text-[9px] tracking-[0.4em] text-muted-foreground uppercase flex items-center gap-3 mb-10 transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back_to_Workspace
                </motion.button>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 glass-panel rounded-2xl flex items-center justify-center text-primary shadow-2xl shadow-primary/20">
                        <UserPlus className="w-7 h-7" />
                    </div>
                    <div>
                        <span className="font-protocol text-[9px] tracking-[0.5em] text-primary opacity-50 uppercase">Network_Integrity</span>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none mt-1">Connection_Protocols</h1>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                    <AnimatePresence mode="popLayout">
                        {requests.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-32 text-center flex flex-col items-center gap-6 opacity-30"
                            >
                                <div className="w-20 h-20 glass-card rounded-full flex items-center justify-center">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <p className="font-protocol text-[11px] uppercase tracking-[0.4em] italic">All_Transmissions_Synchronized</p>
                            </motion.div>
                        ) : (
                            requests.map(req => (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                    className="glass-panel flex items-center justify-between p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-primary/30 transition-transform group-hover:scale-110">
                                            {req.fromUsername.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl uppercase tracking-tight italic leading-none mb-2">{req.fromUsername}</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                <p className="font-protocol text-[9px] font-bold text-primary opacity-40 uppercase tracking-[0.3em]">Identity_Scanned // Sync_Pending</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleAction(req.id, 'accept')}
                                            disabled={loadingId === req.id}
                                            className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 hover:brightness-110 transition-all"
                                            title="Accept Sync"
                                        >
                                            {loadingId === req.id ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-6 h-6" />}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1, y: -2 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleAction(req.id, 'decline')}
                                            disabled={loadingId === req.id}
                                            className="w-14 h-14 rounded-2xl glass-card bg-foreground/5 text-muted-foreground flex items-center justify-center hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all border border-border/10"
                                            title="Terminate Request"
                                        >
                                            <X className="w-6 h-6" />
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
