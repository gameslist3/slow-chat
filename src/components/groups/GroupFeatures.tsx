import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { Group } from '../../types';
import { getGroups, createGroup, subscribeToGroups, CATEGORIES, ICONS } from '../../services/firebaseGroupService';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Group Card ---
const GroupCard = ({ group, isJoined, onAction }: { group: Group, isJoined: boolean, onAction: () => void }) => (
    <div className="group relative glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col h-full overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-primary/5">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
            <Icon name="message" className="w-24 h-24 -rotate-12" />
        </div>

        <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-2xl md:rounded-[1.75rem] flex items-center justify-center text-3xl md:text-4xl shadow-lg border border-white/10 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-700">{group.image}</div>
            <div className="px-3 py-1 glass-card bg-foreground/[0.03] rounded-full text-[10px] font-bold tracking-wider text-primary uppercase border border-primary/10">{group.category}</div>
        </div>

        <div className="mb-6 md:mb-8 relative z-10">
            <h3 className="text-xl md:text-2xl font-black text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight leading-tight">{group.name}</h3>
            <p className="text-sm text-muted-foreground/60 line-clamp-2 font-medium leading-relaxed">Join the conversation.</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6 md:pt-8 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase opacity-40">
                <Icon name="users" className="w-3 h-3" />
                <span>{group.members} members</span>
            </div>
            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAction}
                className={`
                    px-6 md:px-8 h-10 md:h-11 rounded-1.5xl md:rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all
                    ${isJoined ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'btn-primary shadow-xl'}
                `}
            >
                {isJoined ? "open" : "join"}
            </motion.button>
        </div>
    </div>
);

// --- Discovery ---
export const GroupDiscovery = ({ onJoinGroup, onSelectGroup, joinedGroupIds }: any) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToGroups((data) => {
            setGroups(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filtered = groups.filter(g => {
        const matchesQuery = g.name.toLowerCase().includes(filter.toLowerCase()) ||
            g.category.toLowerCase().includes(filter.toLowerCase());
        const isAlreadyJoined = joinedGroupIds.includes(g.id);
        return matchesQuery && !isAlreadyJoined;
    });

    return (
        <div className="h-full overflow-y-auto w-full p-6 md:p-12 lg:p-16 custom-scrollbar text-foreground">
            <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
                <div className="text-center py-6 md:py-12 space-y-4 md:space-y-6">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.8] text-balance">Explore <br className="md:hidden" /><span className="text-primary">Groups</span></h1>
                    <p className="text-muted-foreground/60 font-medium text-sm md:text-xl max-w-2xl mx-auto text-balance">Join communities and start chatting.</p>
                </div>

                <div className="relative max-w-2xl mx-auto group">
                    <Icon name="search" className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-20 transition-opacity group-focus-within:opacity-100" />
                    <input
                        placeholder="Search groups..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="glass-input pl-16 h-16 md:h-20 bg-foreground/[0.02] text-sm md:text-lg font-bold rounded-2.5xl md:rounded-[2rem] border border-white/5 focus:bg-foreground/[0.04] transition-all"
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 md:h-72 w-full rounded-[2.5rem] glass-panel animate-pulse bg-foreground/5 opacity-50" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {filtered.map(g => (
                            <GroupCard
                                key={g.id}
                                group={g}
                                isJoined={joinedGroupIds.includes(g.id)}
                                onAction={() => joinedGroupIds.includes(g.id) ? onSelectGroup(g.id) : onJoinGroup(g.id)}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-24 md:py-32 text-center space-y-6">
                                <p className="text-xs md:text-sm font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">No groups found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Create Group ---
export const CreateGroup = ({ onGroupCreated }: { onGroupCreated: (id: string) => void }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [cat, setCat] = useState('');
    const [icon, setIcon] = useState(ICONS[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !cat) return;
        setLoading(true);
        const g = await createGroup(name, cat, icon, user?.username || 'User', user?.id || 'anon');
        setLoading(false);
        onGroupCreated(g.id);
    };

    return (
        <div className="w-full max-w-xl mx-auto glass-card p-6 md:p-10 lg:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden border-white/10 animate-in zoom-in-95 duration-700 bg-surface/50 backdrop-blur-3xl">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full" />

            <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
                <div className="w-1 md:w-1.5 h-10 md:h-14 bg-primary rounded-full shadow-[0_0_25px_rgba(var(--primary-rgb),0.6)]" />
                <div className="flex flex-col">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none">Create Group</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase ml-1">Icon</label>
                    <div className="grid grid-cols-6 gap-2 md:gap-3 p-3 md:p-4 glass-card bg-foreground/[0.03] rounded-2.5xl">
                        {ICONS.slice(0, 12).map(i => (
                            <motion.button
                                key={i}
                                type="button"
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIcon(i)}
                                className={`
                                    aspect-square rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl transition-all border
                                    ${icon === i ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-transparent hover:border-white/10'}
                                `}
                            >
                                {i}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="relative group">
                        <Icon name="message" className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-20 transition-opacity group-focus-within:opacity-100" />
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Cluster Name"
                            className="w-full bg-foreground/[0.02] h-14 md:h-16 pl-14 pr-6 rounded-2xl text-sm md:text-base font-bold outline-none border border-white/5 focus:border-primary/30 transition-all placeholder:text-muted-foreground/20"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase ml-1">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.slice(0, 5).map(c => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setCat(c)}
                                    className={`
                                        px-4 py-2 rounded-full text-[10px] font-bold tracking-wider border transition-all uppercase
                                        ${cat === c ? 'bg-primary border-primary text-white shadow-lg shadow-primary/10' : 'bg-foreground/[0.03] border-white/5 text-muted-foreground/60 hover:border-white/20'}
                                    `}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <input
                                value={cat}
                                onChange={e => setCat(e.target.value)}
                                placeholder="Custom Category..."
                                className="w-full bg-foreground/[0.01] h-12 px-6 rounded-1.5xl border border-white/5 text-[10px] md:text-xs uppercase tracking-wider font-bold outline-none focus:border-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full h-16 md:h-20 text-xs font-black tracking-[0.2em] shadow-2xl shadow-primary/30 disabled:opacity-30 rounded-2.5xl md:rounded-[2rem] uppercase mt-4"
                    disabled={!name || !cat || loading}
                >
                    {loading ? <Icon name="rotate" className="w-6 h-6 animate-spin" /> : "Create"}
                </motion.button>
            </form>
        </div>
    );
};
