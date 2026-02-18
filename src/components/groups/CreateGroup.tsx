import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';
import { createGroup, ICONS } from '../../services/firebaseGroupService';
import { useAuth } from '../../context/AuthContext';

interface CreateGroupProps {
    onGroupCreated: (id: string) => void;
    onBack?: () => void;
}

export const CreateGroup: React.FC<CreateGroupProps> = ({ onGroupCreated, onBack }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [cat, setCat] = useState('');
    const [icon, setIcon] = useState(ICONS[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !cat) return;
        setLoading(true);
        try {
            const g = await createGroup(name, cat, icon, user?.username || 'User', user?.id || 'anon');
            onGroupCreated(g.id);
        } catch (error) {
            console.error("Failed to create group:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-2xl">
                {/* Header Section */}
                <div className="text-center mb-10 space-y-2 relative">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="absolute -left-2 md:-left-12 top-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-[#A9B4D0] hover:text-white"
                        >
                            <Icon name="arrowLeft" className="w-5 h-5" />
                        </button>
                    )}
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                        Initialize <span className="text-[#3B82F6]">Cluster</span>
                    </h2>
                    <p className="text-[#7C89A6] font-bold uppercase tracking-[0.3em] text-[10px]">New communication protocol deployment</p>
                </div>

                {/* Main Card */}
                <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl relative bg-white/[0.02] backdrop-blur-3xl overflow-hidden group/card transition-all hover:border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

                    <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                        {/* Avatar / Icon Selection */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-px flex-1 bg-white/5" />
                                <label className="text-[10px] font-extrabold tracking-widest text-[#7C89A6] uppercase">Identity Matrix</label>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>

                            <div className="flex flex-wrap gap-4 justify-center">
                                {ICONS.map(i => (
                                    <motion.button
                                        key={i}
                                        type="button"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIcon(i)}
                                        className={`
                                            w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl transition-all border
                                            ${icon === i
                                                ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                                                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/40 hover:text-white opacity-80'
                                            }
                                        `}
                                    >
                                        <span className={icon === i ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}>{i}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-extrabold tracking-widest text-[#7C89A6] uppercase ml-6">Node Identifier</label>
                                <div className="relative group/input">
                                    <input
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Enter cluster name..."
                                        className="w-full h-16 px-8 rounded-2xl bg-black/40 border border-white/5 text-white font-bold text-lg focus:outline-none focus:border-[#3B82F6]/50 focus:bg-black/60 transition-all placeholder:text-white/10 text-center"
                                    />
                                    <div className="absolute inset-0 rounded-2xl border border-[#3B82F6]/0 group-focus-within/input:border-[#3B82F6]/20 pointer-events-none transition-all" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-extrabold tracking-widest text-[#7C89A6] uppercase ml-6">Specialization Protocol</label>
                                <div className="relative group/input">
                                    <input
                                        required
                                        value={cat}
                                        onChange={e => setCat(e.target.value)}
                                        placeholder="e.g. Intelligence, Art, Tech..."
                                        className="w-full h-16 px-8 rounded-2xl bg-black/40 border border-white/5 text-white font-bold text-lg focus:outline-none focus:border-[#3B82F6]/50 focus:bg-black/60 transition-all placeholder:text-white/10 text-center"
                                    />
                                    <div className="absolute inset-0 rounded-2xl border border-[#3B82F6]/0 group-focus-within/input:border-[#3B82F6]/20 pointer-events-none transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!name || !cat || loading}
                            className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Icon name="rotate" className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Deploy Node</span>
                                    <Icon name="zap" className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
