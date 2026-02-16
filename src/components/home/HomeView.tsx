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

            {/* Welcome */}
            <header className="text-center space-y-4 max-w-2xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-300"
                >
                    Hello, {user?.username}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-blue-200/60 font-medium text-lg"
                >
                    Connect with your communities in the void.
                </motion.p>
            </header>

            {/* Groups */}
            <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white/80 flex items-center gap-3">
                        <Icon name="users" className="w-5 h-5 text-blue-400" />
                        My Groups
                    </h2>

                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="btn-ghost h-10 px-6 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/5 hover:bg-white/5"
                        >
                            Create New <Icon name="plus" className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {myGroups.length === 0 ? (
                    <div className="glass-panel p-16 text-center border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20">
                            <Icon name="search" className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white">No groups yet</h3>
                        <p className="text-blue-200/60 mb-8 max-w-sm mx-auto">
                            The expanse is empty. Join a group to start communicating.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center">
                            <button
                                onClick={onBrowseGroups}
                                className="btn-primary h-12 px-8 rounded-full font-bold uppercase tracking-wider text-xs shadow-lg shadow-blue-500/20"
                            >
                                Explore
                            </button>

                            {onCreateGroup && (
                                <button
                                    onClick={onCreateGroup}
                                    className="h-12 px-8 rounded-full font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 uppercase tracking-wider text-xs transition-colors backdrop-blur-md"
                                >
                                    Create Group
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
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
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-card text-left group w-full p-6 flex flex-col justify-between min-h-[180px] border-white/5 hover:border-blue-500/30"
    >
        <div className="flex items-start justify-between mb-4 w-full">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl shadow-inner border border-white/10">
                {group.image || '💬'}
            </div>
            <div className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                {group.category || 'General'}
            </div>
        </div>

        <div>
            <h3 className="text-lg font-bold mb-1 text-white group-hover:text-blue-300 transition-colors tracking-tight line-clamp-1">
                {group.name}
            </h3>
            <p className="text-xs text-blue-200/40 font-bold uppercase tracking-wider flex items-center gap-2">
                <Icon name="users" className="w-3 h-3" />
                {group.members || 1} Members
            </p>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.button>
);
