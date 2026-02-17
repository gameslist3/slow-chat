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
        <div className="w-full h-full flex flex-col items-center">
            {/* Welcome Header - Centered & Spaced */}
            <header className="flex flex-col items-center justify-center pt-20 pb-24 text-center px-6 max-w-4xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-[#E6ECFF] mb-6"
                >
                    WELCOME BACK, <span className="font-bold">{user?.username?.toUpperCase()}</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-[#7C89A6] font-medium text-lg tracking-wide max-w-lg"
                >
                    Pick up where you left off or find something new.
                </motion.p>
            </header>

            {/* Groups Section */}
            <section className="w-full px-6 md:px-12 lg:px-20 max-w-[1600px] flex-1">
                {/* Section Header Row */}
                <div className="flex items-center justify-between mb-8 w-full">
                    <button onClick={onBrowseGroups} className="flex items-center gap-3 group">
                        <h2 className="text-xl md:text-2xl font-bold text-[#A9B4D0] group-hover:text-white transition-colors">My Groups</h2>
                        <Icon name="arrowRight" className="w-5 h-5 text-[#5B79B7] group-hover:translate-x-1 transition-transform" />
                    </button>

                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="text-[#7C89A6] hover:text-[#E6ECFF] flex items-center gap-2 font-medium text-sm transition-all"
                        >
                            Create New <Icon name="plus" className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {myGroups.length === 0 ? (
                    <div className="glass-panel p-20 text-center rounded-[2rem] flex flex-col items-center justify-center bg-[#0F1C34]/50 border border-white/5">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 text-[#5B79B7]">
                            <Icon name="search" className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[#E6ECFF]">No groups yet</h3>
                        <p className="text-[#7C89A6] mb-8 text-sm">
                            The expanse is empty. Join a group to start communicating.
                        </p>
                        <button
                            onClick={onBrowseGroups}
                            className="px-8 py-3 rounded-full bg-[#1F2937] hover:bg-[#374151] text-white font-bold text-sm transition-all"
                        >
                            Explore Groups
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 pb-20">
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

// Helper for "Go Browse" since it wasn't in props but is needed for the header link
const onGoBrowse = () => { }; // Placeholder if not passed, but effectively just a visual link in the design

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
        whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }}
        onClick={onClick}
        className="group relative flex flex-col p-6 rounded-[1.5rem] bg-[#152238]/60 border border-white/5 hover:border-[#5B79B7]/30 transition-all text-left overflow-hidden w-full h-40"
    >
        {/* Hover Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#5B79B7]/0 to-[#5B79B7]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="flex items-center gap-4 z-10 w-full mb-4">
            {/* Icon - No Background */}
            <div className="w-12 h-12 flex items-center justify-center text-4xl shrink-0">
                {group.image || '💬'}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <h3 className="text-[#E6ECFF] font-bold text-lg leading-tight truncate">
                    {group.name}
                </h3>
            </div>
        </div>

        {/* Bottom Metadata Row */}
        <div className="mt-auto flex items-center justify-between z-10 w-full">
            {/* Members (Left) */}
            <div className="flex items-center gap-2 text-[#7C89A6] text-xs font-bold">
                <Icon name="users" className="w-4 h-4" />
                <span>{group.members || 1} User</span>
            </div>

            {/* Category Pill (Right) */}
            <div className="px-3 py-1 rounded-full border border-white/10 text-[#A9B4D0] text-[10px] font-bold uppercase tracking-wider bg-black/20">
                {group.category || 'General'}
            </div>
        </div>
    </motion.button>
);
