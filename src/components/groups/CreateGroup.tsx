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
                            className="absolute -left-2 md:-left-12 top-0 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-[#A9B4D0] hover:text-white group"
                        >
                            <Icon name="arrowLeft" className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                    )}
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-heading">
                        Create New <span className="text-[#5B79B7]">Group</span>
                    </h2>
                    <p className="text-[#7C89A6] font-medium tracking-wide text-sm">Set up your communication hub</p>
                </div>

                {/* Main Card */}
                <div className="glass-panel p-8 md:p-14 rounded-[2.5rem] border border-white/5 shadow-2xl relative bg-white/[0.02] backdrop-blur-3xl overflow-hidden group/card transition-all hover:border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />

                    <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                        {/* Avatar / Icon Selection */}
                        <div className="space-y-8">
                            <div className="flex flex-wrap gap-5 justify-center">
                                {ICONS.map(i => (
                                    <motion.button
                                        key={i}
                                        type="button"
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIcon(i)}
                                        className={`
                                            w-14 h-14 md:w-16 md:h-16 rounded-3xl flex items-center justify-center text-2xl md:text-3xl transition-all border
                                            ${icon === i
                                                ? 'bg-[#5B79B7] border-[#5B79B7] text-white shadow-[0_0_20px_rgba(91,121,183,0.4)]'
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
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold tracking-widest text-[#7C89A6] uppercase ml-4">group name</label>
                                <div className="relative group/input">
                                    <input
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="What should we call this group?"
                                        className="w-full h-16 px-8 rounded-2xl bg-black/20 border border-white/5 text-white font-bold text-lg focus:outline-none focus:border-[#5B79B7]/50 focus:bg-black/40 transition-all placeholder:text-white/10 text-center"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold tracking-widest text-[#7C89A6] uppercase ml-4">category name</label>
                                <div className="relative group/input">
                                    <input
                                        required
                                        value={cat}
                                        onChange={e => setCat(e.target.value)}
                                        placeholder="e.g. Intelligence, Art, Tech..."
                                        className="w-full h-16 px-8 rounded-2xl bg-black/20 border border-white/5 text-white font-bold text-lg focus:outline-none focus:border-[#5B79B7]/50 focus:bg-black/40 transition-all placeholder:text-white/10 text-center"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!name || !cat || loading}
                            className="w-full h-16 rounded-[1.5rem] btn-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Icon name="rotate" className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>create Group</span>
                                    <Icon name="plus" className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
