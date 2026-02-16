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
        await new Promise(r => setTimeout(r, 800));
        const data = await getGroups();
        setGroups(data);
        setLoading(false);
    };

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(filter.toLowerCase()) ||
        g.category.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="w-full flex flex-col min-h-full">
            {/* Header */}
            <header className="flex flex-col items-center justify-center pt-24 pb-16 text-center px-6">
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-6xl font-semibold tracking-tight text-[#E6ECFF] mb-4"
                >
                    Explore <span className="font-bold">Group</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[#A9B4D0] font-medium text-lg opacity-60 mb-10"
                >
                    Join communities and start chatting.
                </motion.p>

                {/* Search Bar */}
                <div className="w-full max-w-lg relative group">
                    <input
                        placeholder="Search Groups.."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 rounded-full bg-[#FFFFFF08] border border-white/5 focus:border-[#5B79B7]/50 text-white placeholder-[#7C89A6] transition-all outline-none"
                    />
                    <Icon name="search" className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7C89A6] group-focus-within:text-[#7FA6FF] transition-colors" />
                </div>
            </header>

            {/* List Section */}
            <section className="flex-1 px-8 md:px-16 lg:px-24">
                <div className="flex items-center justify-between mb-8 max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-[#E6ECFF]">Explore Groups</h2>
                        <Icon name="arrowRight" className="w-5 h-5 text-[#A9B4D0] opacity-50" />
                    </div>
                    <button className="text-[#A9B4D0] hover:text-[#7FA6FF] flex items-center gap-2 font-bold text-sm transition-all">
                        Create New <Icon name="plus" className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 max-w-[1400px] mx-auto pb-20">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 max-w-[1400px] mx-auto pb-20">
                        {filteredGroups.map((group, idx) => {
                            const isJoined = joinedGroupIds.includes(group.id);
                            return (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group flex items-center gap-4 p-5 rounded-3xl bg-[#FFFFFF08] border border-white/5 hover:border-white/10 transition-all text-left"
                                >
                                    <div className="w-14 h-14 rounded-full bg-[#FFFFFF05] border border-white/5 flex items-center justify-center text-3xl shrink-0">
                                        {group.image || '💬'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[#E6ECFF] font-bold text-lg truncate mb-1">{group.name}</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-[#A9B4D0]/60 text-xs font-bold">
                                                <Icon name="users" className="w-4 h-4" />
                                                <span>{group.members || 1} User</span>
                                            </div>
                                            <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[#A9B4D0] text-[8px] font-black uppercase tracking-widest shrink-0">
                                                {group.category || 'General'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => isJoined ? onSelectGroup(group.id) : onJoinGroup(group.id)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                                            ${isJoined
                                                ? 'bg-transparent border border-white/10 text-[#A9B4D0] hover:text-[#E6ECFF]'
                                                : 'bg-[#5B79B7]/20 border border-[#5B79B7]/40 text-[#7FA6FF] hover:bg-[#5B79B7] hover:text-white'}
                                        `}
                                    >
                                        {isJoined ? 'Open' : 'Join'}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};
