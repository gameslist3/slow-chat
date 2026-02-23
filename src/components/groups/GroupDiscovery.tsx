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
        <div className="w-full h-full flex flex-col items-center overflow-y-auto custom-scrollbar relative px-4 md:px-8">

            {/* Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-6 left-4 md:left-8 z-30 p-2 rounded-full hover:bg-white/10 text-[#A9B4D0] hover:text-white transition-all"
                >
                    <Icon name="arrowLeft" className="w-6 h-6" />
                </button>
            )}

            {/* PAGE HEADER */}
            <header className="flex flex-col items-center justify-center pt-20 pb-10 text-center w-full max-w-4xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full flex flex-col items-center"
                >
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#E6ECFF] mb-2 drop-shadow-lg">
                        Explore Group
                    </h1>
                    <p className="text-[#A9B4D0] text-sm md:text-base font-light mb-10 tracking-wide">
                        Join communities and start chatting.
                    </p>

                    {/* SEARCH BAR (Centered Glass Style) */}
                    <div className="w-full max-w-lg relative group">
                        <div className="absolute inset-0 bg-white/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        <div className="relative">
                            <input
                                placeholder="Search Groups..."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                                className="w-full h-14 pl-12 pr-6 rounded-full bg-white/[0.05] border border-white/[0.12] text-[#E6ECFF] placeholder-[#7C89A6] transition-all outline-none focus:border-[#7FA6FF] focus:bg-white/[0.08] focus:shadow-[0_0_15px_rgba(127,166,255,0.2)]"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                <Icon name="search" className="w-5 h-5 text-[#7C89A6] group-focus-within:text-[#7FA6FF] drop-shadow-[0_0_5px_rgba(127,166,255,0.5)] transition-colors" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* SECTION HEADER ROW */}
            <div className="w-full max-w-[1400px] mx-auto mb-6 mt-2">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 px-2">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-medium text-[#A9B4D0]">Explore Groups</span>
                        <Icon name="arrowRight" className="w-5 h-5 text-[#5B79B7]" />
                    </div>

                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="flex items-center gap-2 text-[#7FA6FF] font-semibold text-sm hover:text-[#E6ECFF] hover:drop-shadow-[0_0_8px_rgba(127,166,255,0.6)] transition-all"
                        >
                            Create New <Icon name="plus" className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* GROUP CARD GRID */}
            <section className="w-full max-w-[1400px] mx-auto flex-1 pb-24">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-24 bg-[#ffffff]/5 rounded-[1.25rem] animate-pulse border border-white/[0.05]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredGroups.map((group, idx) => {
                            const isJoined = joinedGroupIds.includes(group.id);
                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -4, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)' }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => isJoined ? onSelectGroup(group.id) : null}
                                    className={`group relative flex items-center p-4 rounded-[1.25rem] bg-white/[0.06] border border-white/[0.12] hover:border-white/[0.2] backdrop-blur-sm transition-all text-left overflow-hidden h-24 cursor-pointer active:scale-[0.98] ${isJoined ? 'border-l-4 border-l-[#5B79B7]' : ''}`}
                                >
                                    {/* Hover Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                    {/* Left: Icon */}
                                    <div className="w-12 h-12 rounded-full bg-white/[0.08] border border-white/[0.05] flex items-center justify-center text-2xl shrink-0 text-white shadow-inner mr-4 group-hover:scale-110 transition-transform duration-300">
                                        {group.image || '💬'}
                                    </div>

                                    {/* Center: Name & Count */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center mr-3">
                                        <h3 className="text-[#E6ECFF] font-medium text-base leading-tight truncate mb-1 group-hover:text-white transition-colors">
                                            {group.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[#7C89A6] text-xs">
                                            <Icon name="users" className="w-3 h-3 opacity-70" />
                                            <span>{group.memberIds?.length || 0} {group.memberIds?.length === 1 ? 'Member' : 'Members'}</span>
                                        </div>
                                    </div>

                                    {/* Right: Category & Action */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {/* Category Pill */}
                                        <div className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[#A9B4D0] text-[9px] font-medium uppercase tracking-wider backdrop-blur-md">
                                            {group.category || 'General'}
                                        </div>

                                        {/* Join Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isJoined) onSelectGroup(group.id);
                                                else onJoinGroup(group.id);
                                            }}
                                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm flex items-center justify-center
                                                ${isJoined
                                                    ? 'bg-transparent text-[#7C89A6] cursor-default'
                                                    : 'bg-[#7FA6FF]/10 text-[#7FA6FF] hover:bg-[#7FA6FF]/20 hover:text-white hover:shadow-[0_0_10px_rgba(127,166,255,0.3)]'}
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
