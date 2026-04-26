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
        <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center p-4 md:p-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-full max-w-xl">
                {/* Header Section */}
                <div className="text-center mb-8 space-y-1 relative">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="absolute -left-2 md:-left-12 top-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-[#A9B4D0] hover:text-white group"
                        >
                            <Icon name="arrowLeft" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                    )}
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-heading">
                        New <span className="text-primary">Group</span>
                    </h2>
                    <p className="text-[#7C89A6] font-medium tracking-wide text-xs">Set up your communication hub</p>
                </div>

                {/* Main Card */}
                <div className="glass-panel p-5 md:p-10 rounded-3xl border border-white/5 shadow-2xl relative bg-white/[0.01] backdrop-blur-2xl overflow-hidden group/card transition-all hover:border-white/10">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
                    
                    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 relative z-10">
                        {/* Avatar / Icon Selection */}
                        <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                            {ICONS.map(i => (
                                <motion.button
                                    key={i}
                                    type="button"
                                    whileHover={{ scale: 1.1, y: -1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIcon(i)}
                                    className={`
                                        w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl transition-all border
                                        ${icon === i
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-white/5 border-white/5 hover:border-white/20 text-white/40 hover:text-white'
                                        }
                                    `}
                                >
                                    <span>{i}</span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Fields */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-[#7C89A6] uppercase ml-2">Group Name</label>
                                <input
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter group name..."
                                    className="w-full h-14 px-6 rounded-xl bg-black/20 border border-white/5 text-white font-bold text-base focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-[#7C89A6] uppercase ml-2">Category</label>
                                <input
                                    required
                                    value={cat}
                                    onChange={e => setCat(e.target.value)}
                                    placeholder="e.g. Intelligence, Art, Tech..."
                                    className="w-full h-14 px-6 rounded-xl bg-black/20 border border-white/5 text-white font-bold text-base focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!name || !cat || loading}
                            className="w-full h-14 rounded-xl btn-primary text-white font-black uppercase tracking-[0.1em] text-xs shadow-xl disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Icon name="rotate" className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Create Group</span>
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
