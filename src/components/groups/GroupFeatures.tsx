import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { Group } from '../../types';
import { createGroup, subscribeToGroups, ICONS } from '../../services/firebaseGroupService';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

// --- Group Card ---
const GroupCard = ({ group, isJoined, onAction }: { group: Group, isJoined: boolean, onAction: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col h-full overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-primary/5"
    >
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
            <Icon name="message" className="w-24 h-24 -rotate-12" />
        </div>

        <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-2xl md:rounded-[1.75rem] flex items-center justify-center text-3xl md:text-4xl shadow-lg border border-white/10 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-700">{group.image}</div>
            <div className="px-3 py-1 glass-card bg-foreground/[0.03] rounded-full text-[10px] font-bold tracking-wider text-primary uppercase border border-primary/10">{group.category}</div>
        </div>

        <div className="mb-6 md:mb-8 relative z-10">
            <h3 className="text-xl md:text-2xl font-black text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight leading-tight line-clamp-1">{group.name}</h3>
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
    </motion.div>
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
        <div className="w-full h-full flex flex-col px-6 md:px-12 py-8 max-w-7xl mx-auto space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[0.8] text-center md:text-left">
                    Explore <span className="text-primary">Groups</span>
                </h1>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative group flex-1 md:w-[320px]">
                        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                        <input
                            placeholder="Search..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="glass-input pl-10 h-12 w-full rounded-2xl bg-white/5 border-white/5 focus:bg-white/10 text-sm font-bold transition-all placeholder:text-muted-foreground/40"
                        />
                    </div>

                    {/* Create Action */}
                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="h-12 w-12 md:w-auto md:px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shrink-0"
                            title="Create Group"
                        >
                            <span className="hidden md:inline">Create</span>
                            <Icon name="plus" className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-8 custom-scrollbar">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 w-full rounded-[2.5rem] glass-panel animate-pulse bg-white/5 opacity-20" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {filtered.map(g => (
                            <GroupCard
                                key={g.id}
                                group={g}
                                isJoined={joinedGroupIds.includes(g.id)}
                                onAction={() => joinedGroupIds.includes(g.id) ? onSelectGroup(g.id) : onJoinGroup(g.id)}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-20 text-center text-muted-foreground/40 font-bold uppercase tracking-widest">
                                No discovery results
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export { CreateGroup } from './CreateGroup';
