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
        <div className="max-w-7xl mx-auto space-y-12 py-12 px-6">

            {/* Welcome Header */}
            <header className="text-center space-y-3">
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-semibold tracking-wide text-[#E6ECFF] uppercase"
                >
                    WELCOME BACK, {user?.username?.toUpperCase()}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-[#A9B4D0] font-medium text-base tracking-wide"
                >
                    Pick up where you left off or find something new.
                </motion.p>
            </header>

            {/* Groups Section */}
            <section className="space-y-6">
                {/* Section Header Row */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2 text-[#A9B4D0] font-medium">
                        <span>My Groups</span>
                        <Icon name="arrowRight" className="w-4 h-4 opacity-50" />
                    </div>

                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="text-[#7FA6FF] hover:text-[#E6ECFF] flex items-center gap-2 font-medium tracking-wide text-sm transition-all hover:drop-shadow-[0_0_8px_rgba(127,166,255,0.5)]"
                        >
                            Create New <Icon name="plus" className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {myGroups.length === 0 ? (
                    <div className="glass-panel p-16 text-center border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center bg-white/[0.02]">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 text-[#A9B4D0]">
                            <Icon name="search" className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[#E6ECFF]">No groups yet</h3>
                        <p className="text-[#A9B4D0] mb-8 text-sm">
                            The expanse is empty. Join a group to start communicating.
                        </p>
                        <button
                            onClick={onBrowseGroups}
                            className="px-8 py-3 rounded-full bg-[#5B79B7] hover:bg-[#7FA6FF] text-[#E6ECFF] font-bold text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(91,121,183,0.3)] transition-all"
                        >
                            Explore Groups
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        whileHover={{ y: -5 }}
        onClick={onClick}
        className="glass-card w-full p-4 flex items-center gap-4 bg-[#FFFFFF0F] border border-[#FFFFFF1F] rounded-2xl hover:bg-[#FFFFFF14] hover:border-[#FFFFFF33] hover:shadow-[0_0_20px_rgba(36,58,107,0.3)] transition-all group text-left"
    >
        {/* Left: Icon/Emoji */}
        <div className="w-12 h-12 rounded-full bg-[#FFFFFF0D] flex items-center justify-center text-xl shadow-inner border border-[#FFFFFF1F] shrink-0 group-hover:scale-110 transition-transform">
            {group.image || '💬'}
        </div>

        {/* Center: Name & Member Count */}
        <div className="flex-1 min-w-0">
            <h3 className="text-[#E6ECFF] font-semibold text-base truncate mb-1 group-hover:text-white transition-colors">
                {group.name}
            </h3>
            <div className="flex items-center gap-1.5 text-[#7C89A6] text-xs font-medium">
                <Icon name="user" className="w-3 h-3" />
                <span>{group.members || 1} Members</span>
            </div>
        </div>

        {/* Right: Category Tag */}
        <div className="px-3 py-1 rounded-full border border-[#FFFFFF1F] bg-[#FFFFFF05] text-[#A9B4D0] text-[10px] font-bold uppercase tracking-wider shrink-0 group-hover:border-[#7FA6FF]/30 group-hover:text-[#7FA6FF] transition-colors">
            {group.category || 'General'}
        </div>
    </motion.button>
);
