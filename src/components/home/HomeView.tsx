import React from 'react';
import { motion } from 'framer-motion';
import { Group } from '../../types';
import { Icon } from '../common/Icon';

interface HomeViewProps {
    user: any;
    myGroups: Group[];
    onSelectGroup: (id: string) => void;
    onBrowseGroups: () => void;
    onCreateGroup?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
    user,
    myGroups,
    onSelectGroup,
    onBrowseGroups,
    onCreateGroup
}) => {
    return (
        <div className="w-full h-full flex flex-col">
            {/* Welcome Header */}
            <header className="flex flex-col items-center justify-center pt-24 pb-32 text-center px-6">
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-wide text-[#E6ECFF] uppercase mb-4"
                >
                    WELCOME BACK, <span className="font-bold">{user?.username?.toUpperCase()}</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-[#A9B4D0] font-medium text-lg tracking-wide opacity-60"
                >
                    Pick up where you left off or find something new.
                </motion.p>
            </header>

            {/* Groups Section */}
            <section className="flex-1 px-8 md:px-16 lg:px-24">
                {/* Section Header Row */}
                <div className="flex items-center justify-between mb-8 max-w-[1400px] mx-auto">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl md:text-2xl font-bold text-[#E6ECFF]">My Groups</h2>
                        <Icon name="arrowRight" className="w-5 h-5 text-[#A9B4D0] opacity-50" />
                    </div>

                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="text-[#A9B4D0] hover:text-[#7FA6FF] flex items-center gap-2 font-bold text-sm transition-all"
                        >
                            Create New <Icon name="plus" className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {myGroups.length === 0 ? (
                    <div className="glass-panel p-20 text-center rounded-[2.5rem] flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 text-[#A9B4D0]">
                            <Icon name="search" className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-[#E6ECFF]">No groups yet</h3>
                        <p className="text-[#A9B4D0] mb-8 text-sm">
                            The expanse is empty. Join a group to start communicating.
                        </p>
                        <button
                            onClick={onBrowseGroups}
                            className="px-10 py-4 rounded-full bg-[#5B79B7] text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                        >
                            Explore Groups
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 max-w-[1400px] mx-auto pb-20">
                        {myGroups.map((group, i) => (
                            <GroupItem
                                key={group.id}
                                group={group}
                                index={i}
                                onClick={() => onSelectGroup(group.id)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const GroupItem = ({
    group,
    index,
    onClick
}: {
    group: Group;
    index: number;
    onClick: () => void;
}) => (
    <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ x: 5, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        onClick={onClick}
        className="group flex items-center gap-4 p-5 rounded-3xl bg-[#FFFFFF08] border border-white/5 hover:border-white/10 transition-all text-left"
    >
        {/* Left: Icon/Emoji Circle */}
        <div className="w-14 h-14 rounded-full bg-[#FFFFFF05] border border-white/5 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
            {group.image || '💬'}
        </div>

        {/* Center: Name & Member Count */}
        <div className="flex-1 min-w-0">
            <h3 className="text-[#E6ECFF] font-bold text-lg truncate mb-1">
                {group.name}
            </h3>
            <div className="flex items-center gap-2 text-[#A9B4D0]/60 text-xs font-bold">
                <Icon name="users" className="w-4 h-4" />
                <span>{group.members || 1} User</span>
            </div>
        </div>

        {/* Right: Category Tag */}
        <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[#A9B4D0] text-[9px] font-black uppercase tracking-widest shrink-0">
            {group.category || 'General'}
        </div>
    </motion.button>
);
