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
        <div className="w-full h-full relative font-sans text-foreground">
            {/* Title: Global 80px -> Local 20px */}
            <div className="absolute top-[20px] left-0">
                <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.8]">Explore <span className="text-primary">Groups</span></h1>
            </div>

            {/* Search: Global 140px -> Local 80px. Center width 420px */}
            {/* Prompt says "Search bar: top 140px center width 420px". 
                "Center" relative to Content Area? Content Area is width ~1180px (1440-260). 
                Center of text area is ~590px. 
                I will center it relative to the container. */}
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[420px]">
                <div className="relative group w-full">
                    <Icon name="search" className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-20 transition-opacity group-focus-within:opacity-100" />
                    <input
                        placeholder="Search..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="glass-input pl-16 h-12 bg-white/5 text-sm font-bold rounded-full border border-white/5 focus:bg-white/10 transition-all w-full shadow-lg"
                    />
                </div>
            </div>

            {/* Create New: Global 140px, Right 80px -> Local 80px, Right 20px */}
            {onCreateGroup && (
                <button
                    onClick={onCreateGroup}
                    className="absolute top-[80px] right-[20px] h-12 px-6 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs flex items-center gap-3 transition-all"
                >
                    Create New <Icon name="plus" className="w-4 h-4" />
                </button>
            )}

            {/* Grid: Global 220px -> Local 160px */}
            <div className="absolute top-[160px] left-0 right-0 bottom-0 overflow-y-auto pr-2 pb-10">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 w-full rounded-[2.5rem] glass-panel animate-pulse bg-white/5 opacity-20" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {filtered.map(g => (
                            <GroupCard
                                key={g.id}
                                group={g}
                                isJoined={joinedGroupIds.includes(g.id)}
                                onAction={() => joinedGroupIds.includes(g.id) ? onSelectGroup(g.id) : onJoinGroup(g.id)}
                            />
                        ))}
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
        <div className="w-full h-full relative">
            {/* Title: Global 140px -> Local 80px. Center */}
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 text-center">
                {onBack && (
                    <button onClick={onBack} className="absolute -left-16 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                        <Icon name="arrowLeft" className="w-5 h-5 text-white" />
                    </button>
                )}
                <h2 className="text-3xl font-black tracking-tighter uppercase leading-none text-white">Create Group</h2>
            </div>

            {/* Icon Selector: Global 240px -> Local 180px. Center */}
            <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[380px] flex flex-col items-center gap-2">
                <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">Choose Icon</label>
                <div className="flex gap-3 overflow-x-auto w-full justify-center pb-2 no-scrollbar">
                    {ICONS.map(i => (
                        <motion.button
                            key={i}
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIcon(i)}
                            className={`
                                shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all border
                                ${icon === i ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10 opacity-50 hover:opacity-100'}
                            `}
                        >
                            {i}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Inputs: Global 320px -> Local 260px. Center Width 380px */}
            <div className="absolute top-[260px] left-1/2 -translate-x-1/2 w-[380px]">
                <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase ml-2">Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="glass-input w-full h-[48px] px-6 rounded-full bg-white/[0.03] border-white/5 text-white font-bold focus:bg-white/[0.05] focus:border-primary/30 transition-all placeholder:text-muted-foreground/20"
                            placeholder="Group Name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase ml-2">Category</label>
                        <input
                            value={cat}
                            onChange={e => setCat(e.target.value)}
                            className="glass-input w-full h-[48px] px-6 rounded-full bg-white/[0.03] border-white/5 text-white font-bold focus:bg-white/[0.05] focus:border-primary/30 transition-all placeholder:text-muted-foreground/20"
                            placeholder="Design, Tech, gaming..."
                        />
                    </div>

                    <button
                        disabled={!name || !cat || loading}
                        className="w-full h-[48px] rounded-full bg-secondary text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-secondary/20 hover:shadow-secondary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-[20px] flex items-center justify-center gap-2"
                    >
                        {loading ? <Icon name="rotate" className="w-4 h-4 animate-spin" /> : "Create Group"}
                    </button>
                </form>
            </div>
        </div>
    );
};
