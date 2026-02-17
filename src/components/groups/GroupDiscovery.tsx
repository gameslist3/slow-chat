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
        <div className="w-full h-full flex flex-col overflow-y-auto no-scrollbar pb-20">
            {/* PAGE HEADER */}
            <header className="flex flex-col items-center justify-center pt-20 pb-12 text-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#E6ECFF] mb-3">
                        Explore Group
                    </h1>
                    <p className="text-[#A9B4D0] text-sm md:text-base font-light mb-10">
                        Join communities and start chatting.
                    </p>

                    {/* SEARCH BAR (Centered Glass Style) */}
                    <div className="w-full max-w-lg relative group mx-auto">
                        <div className="absolute inset-0 bg-[#7FA6FF]/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative">
                            <input
                                placeholder="Search Groups.."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                className="w-full h-14 pl-6 pr-14 rounded-full bg-white/[0.05] border border-white/[0.12] focus:border-[#7FA6FF] focus:bg-white/[0.08] text-[#E6ECFF] placeholder-[#7C89A6] transition-all outline-none shadow-lg"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                                <Icon name="search" className="w-5 h-5 text-[#7C89A6] group-focus-within:text-[#7FA6FF] shadow-[#7FA6FF]/20 transition-colors" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* SECTION HEADER ROW */}
            <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#A9B4D0]">Explore Groups</span>
                        <Icon name="arrowRight" className="w-4 h-4 text-[#A9B4D0] opacity-70" />
                    </div>
                    <button className="flex items-center gap-1.5 text-[#7FA6FF] font-bold text-sm hover:brightness-125 hover:drop-shadow-[0_0_8px_rgba(127,166,255,0.4)] transition-all">
                        Create New +
                    </button>
                </div>
            </div>

            {/* GROUP CARD GRID */}
            <section className="w-full max-w-[1400px] mx-auto px-6 md:px-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-28 bg-white/5 rounded-[2rem] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-20">
                        {filteredGroups.map((group, idx) => {
                            const isJoined = joinedGroupIds.includes(group.id);
                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => isJoined ? onSelectGroup(group.id) : null}
                                    className="group relative glass-morphism-card cursor-pointer"
                                >
                                    {/* Glass styles moved to CSS or applied via container */}
                                    <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.12] rounded-[2rem] transition-all group-hover:bg-white/[0.08] group-hover:border-white/[0.2] shadow-xl" />

                                    <div className="relative z-10 p-5 flex items-center gap-4">
                                        {/* Left area: Emoji in Circular Glass */}
                                        <div className="w-14 h-14 rounded-full bg-white/[0.05] border border-white/[0.12] flex items-center justify-center text-2xl shadow-inner inline-glow shrink-0">
                                            {group.image || '💬'}
                                        </div>

                                        {/* Center area: Name + member count */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[#E6ECFF] font-semi-bold text-lg truncate leading-tight mb-1">{group.name}</h3>
                                            <div className="flex items-center gap-1.5 text-[#7C89A6] text-xs font-medium">
                                                <Icon name="user" className="w-3.5 h-3.5 opacity-60" />
                                                <span>{group.members || 1} members</span>
                                            </div>
                                        </div>

                                        {/* Right area: Category + Join button */}
                                        <div className="flex flex-col items-end gap-3 shrink-0">
                                            {group.category && (
                                                <div className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-[10px] text-[#A9B4D0] font-medium tracking-wide">
                                                    {group.category}
                                                </div>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    isJoined ? onSelectGroup(group.id) : onJoinGroup(group.id);
                                                }}
                                                className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm
                                                    ${isJoined
                                                        ? 'bg-transparent border border-white/10 text-[#A9B4D0] hover:text-[#E6ECFF]'
                                                        : 'bg-[#7FA6FF]/18 text-[#E6ECFF] hover:bg-[#7FA6FF]/30 hover:shadow-[0_0_12px_rgba(127,166,255,0.4)]'}
                                                `}
                                            >
                                                {isJoined ? 'Open' : 'Join'}
                                            </button>
                                        </div>
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
