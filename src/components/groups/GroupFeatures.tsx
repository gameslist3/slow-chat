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
export const GroupDiscovery = ({ onJoinGroup, onSelectGroup, joinedGroupIds, onCreateGroup }: any) => {
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.8]">Explore <span className="text-primary">Groups</span></h1>
                        <p className="text-muted-foreground/60 font-medium text-sm md:text-xl">Join communities and start chatting.</p>
                    </div>

                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="hidden md:flex h-14 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs items-center gap-3 transition-all whitespace-nowrap"
                        >
                            Create New <Icon name="plus" className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="relative max-w-2xl mx-auto group w-full">
                    <Icon name="search" className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-20 transition-opacity group-focus-within:opacity-100" />
                    <input
                        placeholder="Search groups..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="glass-input pl-16 h-16 md:h-20 bg-foreground/[0.02] text-sm md:text-lg font-bold rounded-2.5xl md:rounded-[2rem] border border-white/5 focus:bg-foreground/[0.04] transition-all w-full"
                    />
                </div>

                <div className="flex text-sm font-bold uppercase tracking-widest text-muted-foreground/50 items-center gap-4">
                    <span className="shrink-0">Explore Groups</span>
                    <div className="h-px bg-white/5 flex-1" />
                    <Icon name="arrowRight" className="w-4 h-4 opacity-50" />
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
export const CreateGroup = ({ onGroupCreated, onBack }: { onGroupCreated: (id: string) => void, onBack?: () => void }) => {
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
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full max-w-xl glass-panel p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/10 animate-in zoom-in-95 duration-700 bg-[#05050A]/80 backdrop-blur-3xl">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex items-center gap-6 mb-12 relative z-10">
                    {onBack && (
                        <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 active:scale-95">
                            <Icon name="arrowLeft" className="w-5 h-5 text-white" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none text-white">Create Group</h2>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mt-2">Choose name, icon for your Group</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase ml-1">Choose Icon</label>

                        {/* Scrollable Icon Row */}
                        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mask-linear-fade">
                            {ICONS.map(i => (
                                <motion.button
                                    key={i}
                                    type="button"
                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIcon(i)}
                                    className={`
                                        shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all border
                                        ${icon === i ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-white/5 border-transparent hover:border-white/10 opacity-70 hover:opacity-100'}
                                    `}
                                >
                                    {i}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase ml-1">Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="glass-input w-full h-16 px-6 rounded-2xl bg-white/[0.03] border-white/5 text-white font-bold focus:bg-white/[0.05] focus:border-primary/30 transition-all placeholder:text-muted-foreground/20"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase ml-1">Category</label>
                            <input
                                value={cat}
                                onChange={e => setCat(e.target.value)}
                                className="glass-input w-full h-16 px-6 rounded-2xl bg-white/[0.03] border-white/5 text-white font-bold focus:bg-white/[0.05] focus:border-primary/30 transition-all placeholder:text-muted-foreground/20"
                            />
                        </div>
                    </div>

                    <button
                        disabled={!name || !cat || loading}
                        className="w-full h-20 rounded-[2rem] bg-secondary text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-secondary/20 hover:shadow-secondary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4 border border-white/10"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : "Create Group"}
                    </button>
                </form>
            </div>
        </div>
    );
};
