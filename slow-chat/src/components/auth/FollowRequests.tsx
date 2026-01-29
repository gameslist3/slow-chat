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
        <div className="flex flex-col h-full bg-background animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="px-6 py-8 border-b border-border/50">
                <button onClick={onBack} className="ui-button-ghost mb-6 -ml-2 text-muted-foreground flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Workspace
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Connection Protocols</h1>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Pending Follow Requests</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-2xl mx-auto space-y-4">
                    <AnimatePresence mode="popLayout">
                        {requests.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                className="py-20 text-center flex flex-col items-center gap-4"
                            >
                                <Clock className="w-12 h-12" />
                                <p className="font-bold uppercase tracking-[0.3em] text-sm italic">All transmission protocols synchronized</p>
                            </motion.div>
                        ) : (
                            requests.map(req => (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="ui-card flex items-center justify-between p-6 border-2 hover:border-primary/30 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-surface2 flex items-center justify-center font-black text-primary border border-border/50">
                                            {req.fromUsername.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg uppercase tracking-tight leading-none mb-1">{req.fromUsername}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wants to initiate sync</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAction(req.id, 'accept')}
                                            disabled={loadingId === req.id}
                                            className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'decline')}
                                            disabled={loadingId === req.id}
                                            className="w-10 h-10 rounded-xl bg-surface2 text-muted-foreground flex items-center justify-center hover:bg-danger/10 hover:text-danger hover:border-danger/20 transition-all border border-border/30"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
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
