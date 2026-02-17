import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';
import { Group } from '../../types';
import { getGroups } from '../../services/firebaseGroupService';

interface GroupDiscoveryProps {
    onJoinGroup: (groupId: string) => void;
    onSelectGroup: (groupId: string) => void;
    joinedGroupIds: string[];
    onCreateGroup?: () => void;
    onBack?: () => void;
}

export const GroupDiscovery: React.FC<GroupDiscoveryProps> = ({
    onJoinGroup,
    onSelectGroup,
    joinedGroupIds,
    onCreateGroup,
    onBack
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
        <div className="w-full h-full flex flex-col items-center overflow-y-auto custom-scrollbar relative px-4">

            {/* Back Button (Optional context awareness) */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 md:left-8 z-30 p-2 rounded-full hover:bg-white/10 text-[#A9B4D0] hover:text-white transition-all"
                >
                    <Icon name="arrowLeft" className="w-6 h-6" />
                </button>
            )}

            {/* PAGE HEADER */}
            <header className="flex flex-col items-center justify-center pt-16 pb-12 text-center w-full max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full flex flex-col items-center"
                >
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#E6ECFF] mb-3">
                        Explore Group
                    </h1>
                    <p className="text-[#A9B4D0] text-sm md:text-base font-light mb-10">
                        Join communities and start chatting.
                    </p>

                    {/* SEARCH BAR (Centered Glass Style) */}
                    <div className="w-full max-w-lg relative group">
                        <div className="absolute inset-0 bg-white/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative">
                            <input
                                placeholder="Search Groups.."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                className="w-full h-14 pl-8 pr-14 rounded-full bg-white/[0.05] border border-white/[0.12] text-[#E6ECFF] placeholder-[#7C89A6] transition-all outline-none shadow-lg focus:border-[#7FA6FF] focus:bg-white/[0.08]"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                <Icon name="search" className="w-5 h-5 text-[#7C89A6] group-focus-within:text-[#7FA6FF] drop-shadow-[0_0_8px_rgba(127,166,255,0.4)] transition-colors" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* SECTION HEADER ROW */}
            <div className="w-full max-w-[1400px] mx-auto px-2 md:px-6 mb-8 mt-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-medium text-[#A9B4D0]">Explore Groups</span>
                        <Icon name="arrowRight" className="w-5 h-5 text-[#5B79B7]" />
                    </div>

                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="flex items-center gap-2 text-[#7FA6FF] font-semibold text-sm hover:text-[#E6ECFF] hover:drop-shadow-[0_0_8px_rgba(127,166,255,0.6)] transition-all"
                        >
                            Create New +
                        </button>
                    )}
                </div>
            </div>

            {/* GROUP CARD GRID */}
            <section className="w-full max-w-[1400px] mx-auto px-2 md:px-6 flex-1 pb-24">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-28 bg-[#ffffff]/5 rounded-[1.25rem] animate-pulse border border-white/[0.05]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredGroups.map((group, idx) => {
                            const isJoined = joinedGroupIds.includes(group.id);
                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -4, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)' }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative flex items-center p-5 rounded-[1.25rem] bg-white/[0.06] border border-white/[0.12] hover:border-white/[0.2] backdrop-blur-sm transition-all text-left overflow-hidden h-28"
                                >
                                    {/* Hover Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    {/* Left: Icon */}
                                    <div className="w-12 h-12 rounded-full bg-white/[0.1] border border-white/[0.1] flex items-center justify-center text-2xl shrink-0 text-white shadow-inner mr-5">
                                        {group.image || '💬'}
                                    </div>

                                    {/* Center: Name & Count */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center mr-4">
                                        <h3 className="text-[#E6ECFF] font-medium text-lg leading-tight truncate mb-1">
                                            {group.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[#7C89A6] text-xs">
                                            <Icon name="user" className="w-3 h-3" />
                                            <span>{group.members || 1}</span>
                                        </div>
                                    </div>

                                    {/* Right: Category & Action */}
                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        {/* Category Pill */}
                                        <div className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#A9B4D0] text-[10px] font-medium tracking-wide">
                                            {group.category || 'General'}
                                        </div>

                                        {/* Join Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                isJoined ? onSelectGroup(group.id) : onJoinGroup(group.id); // Or select? User said Join button.
                                                // Assuming select works for joined.
                                                if (isJoined) onSelectGroup(group.id);
                                                else onJoinGroup(group.id);
                                            }}
                                            className={`px-5 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm flex items-center justify-center min-w-[70px]
                                                ${isJoined
                                                    ? 'bg-transparent border border-white/20 text-[#A9B4D0] hover:bg-white/5'
                                                    : 'bg-[#7FA6FF]/20 hover:bg-[#7FA6FF]/30 text-[#E6ECFF] hover:-translate-y-0.5 hover:shadow-[0_0_10px_rgba(127,166,255,0.3)]'}
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
