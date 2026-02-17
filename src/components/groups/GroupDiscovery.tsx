import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';
import { Group } from '../../types';
import { getGroups } from '../../services/firebaseGroupService';

interface GroupDiscoveryProps {
    onJoinGroup: (groupId: string) => void;
    onSelectGroup: (groupId: string) => void;
    joinedGroupIds: string[];
    // onBack handled by Layout header
}

export const GroupDiscovery: React.FC<GroupDiscoveryProps> = ({
    onJoinGroup,
    onSelectGroup,
    joinedGroupIds,
}) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        setLoading(true);
        // Simulate loading for smoother transition
        await new Promise(r => setTimeout(r, 600));
        const data = await getGroups();
        setGroups(data);
        setLoading(false);
    };

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(filter.toLowerCase()) ||
        g.category.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="w-full h-full flex flex-col items-center overflow-y-auto custom-scrollbar">
            {/* PAGE HEADER */}
            <header className="flex flex-col items-center justify-center pt-20 pb-12 text-center px-6 w-full max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full flex flex-col items-center"
                >
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#E6ECFF] mb-2">
                        Explore Group
                    </h1>
                    <p className="text-[#A9B4D0] text-sm md:text-base font-light mb-8">
                        Join communities and start chatting.
                    </p>

                    {/* SEARCH BAR (Centered Glass Style) */}
                    <div className="w-full max-w-lg relative group">
                        <div className="absolute inset-0 bg-[#3B82F6]/10 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative">
                            <input
                                placeholder="Search Groups.."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                className="w-full h-12 pl-6 pr-12 rounded-full bg-[#152238] border border-white/10 focus:border-[#3B82F6]/50 focus:bg-[#1E3A8A]/30 text-[#E6ECFF] placeholder-[#64748B] transition-all outline-none shadow-lg"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                <Icon name="search" className="w-5 h-5 text-[#64748B] group-focus-within:text-[#3B82F6] transition-colors" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* SECTION HEADER ROW */}
            <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 mb-6 mt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <span className="text-xl font-bold text-[#A9B4D0] group-hover:text-white transition-colors">Explore Groups</span>
                        <Icon name="arrowRight" className="w-5 h-5 text-[#5B79B7] group-hover:translate-x-1 transition-transform" />
                    </div>
                    <button className="flex items-center gap-1.5 text-[#E6ECFF] font-medium text-sm hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-full transition-all">
                        Create New +
                    </button>
                </div>
            </div>

            {/* GROUP CARD GRID */}
            <section className="w-full max-w-[1400px] mx-auto px-6 md:px-12 flex-1 pb-20">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-32 bg-[#152238] rounded-[1.5rem] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {filteredGroups.map((group, idx) => {
                            const isJoined = joinedGroupIds.includes(group.id);
                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -5 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => isJoined ? onSelectGroup(group.id) : null}
                                    className="group relative flex flex-col p-5 rounded-[1.5rem] bg-[#152238]/60 border border-white/5 hover:border-[#5B79B7]/30 transition-all text-left overflow-hidden h-40 shadow-lg"
                                >
                                    {/* Hover Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/0 to-[#3B82F6]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-start gap-4 relative z-10 mb-auto">
                                        {/* Icon */}
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0 text-white">
                                            {group.image || '💬'}
                                        </div>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0 pt-1">
                                            <h3 className="text-[#E6ECFF] font-bold text-lg leading-tight truncate">
                                                {group.name}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Bottom Row */}
                                    <div className="relative z-10 flex items-center justify-between w-full mt-4">

                                        <div className="flex items-center gap-3">
                                            {/* Members */}
                                            <div className="flex items-center gap-1.5 text-[#7C89A6] text-xs font-bold">
                                                <Icon name="users" className="w-3.5 h-3.5" />
                                                <span>{group.members || 1} User</span>
                                            </div>

                                            {/* Category Pill */}
                                            <div className="px-2.5 py-1 rounded-full border border-white/10 text-[#A9B4D0] text-[10px] font-bold uppercase tracking-wider bg-black/20">
                                                {group.category || 'General'}
                                            </div>
                                        </div>

                                        {/* Join Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                isJoined ? onSelectGroup(group.id) : onJoinGroup(group.id);
                                            }}
                                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm
                                                ${isJoined
                                                    ? 'bg-transparent border border-white/10 text-[#A9B4D0] hover:text-[#E6ECFF]'
                                                    : 'bg-[#1E3A8A] text-white hover:bg-[#2563EB] hover:shadow-[0_0_12px_rgba(37,99,235,0.4)]'}
                                            `}
                                        >
                                            {isJoined ? 'Open' : 'Join'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};
