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
        <div className="max-w-6xl mx-auto space-y-12 py-8 px-4">

            {/* Welcome */}
            <header className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                    Welcome back, {user?.username}
                </h1>
                <p className="text-muted-foreground font-medium text-lg">
                    Pick up where you left off or find something new.
                </p>
            </header>

            {/* Groups */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 group">
                        <h2 className="text-xl font-bold uppercase tracking-widest text-white group-hover:text-primary transition-colors">
                            My Groups
                        </h2>
                        <Icon name="arrowRight" className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>

                    {onCreateGroup && (
                        <button
                            onClick={onCreateGroup}
                            className="text-sm font-bold text-muted-foreground hover:text-white flex items-center gap-2 transition-colors uppercase tracking-wider"
                        >
                            Create New <Icon name="plus" className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {myGroups.length === 0 ? (
                    <div className="glass-panel p-12 text-center border-dashed border-white/10 rounded-[2rem]">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Icon name="search" className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">No groups yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Join your first group to start chatting.
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={onBrowseGroups}
                                className="btn-primary h-12 px-8 rounded-xl font-bold uppercase tracking-wider text-xs"
                            >
                                Discover Groups
                            </button>

                            {onCreateGroup && (
                                <button
                                    onClick={onCreateGroup}
                                    className="h-12 px-8 rounded-xl font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 uppercase tracking-wider text-xs transition-colors"
                                >
                                    Create Group
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="relative">

                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myGroups.map(group => (
                                <GroupItem
                                    key={group.id}
                                    group={group}
                                    onClick={() => onSelectGroup(group.id)}
                                />
                            ))}
                        </div>

                        {/* Mobile */}
                        <div className="md:hidden flex overflow-x-auto pb-8 gap-4 snap-x snap-mandatory px-2 no-scrollbar">
                            {myGroups.map(group => (
                                <div key={group.id} className="min-w-[280px] snap-center">
                                    <GroupItem
                                        group={group}
                                        onClick={() => onSelectGroup(group.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Bottom actions */}
            <div className="hidden md:flex gap-3 invisible"> {/* Hiding bottom actions on desktop as requested? No, usually keep them or adapt. Requirement said 'Moving action buttons... to the bottom' in previous steps. Detailed req says 'Sidebar functions...'. Home view section 'Functions' says Group card click -> Open group chat. Create new -> create group screen. I will keep them but maybe less prominent if they duplicate. */}
                {/* Leaving mainly for spacing if needed or ensuring consistent padding */}
            </div>

        </div>
    );
};

const GroupItem = ({
    group,
    onClick
}: {
    group: Group;
    onClick: () => void;
}) => (
    <motion.button
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="glass-panel text-left group w-full p-6 rounded-[1.5rem] border border-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
    >
        <div className="flex items-start justify-between mb-6 relative z-10">
            <div className="text-3xl filter drop-shadow-lg">{group.image || '💬'}</div>
            <div className="px-3 py-1 bg-white/5 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                {group.category || 'Chat'}
            </div>
        </div>

        <div className="relative z-10">
            <h3 className="text-lg font-black mb-1 text-white group-hover:text-primary transition-colors tracking-tight">
                {group.name}
            </h3>
            <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider flex items-center gap-2">
                <Icon name="users" className="w-3 h-3" />
                {group.members || 1} User
            </p>
        </div>
    </motion.button>
);
