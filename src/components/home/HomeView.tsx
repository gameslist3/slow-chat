import React from 'react';
import { motion } from 'framer-motion';
import { Group } from '../../types';
import { Icon } from '../common/Icon';

interface HomeViewProps {
    user: any;
    myGroups: Group[];
    onSelectGroup: (id: string) => void;
    onBrowseGroups: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, myGroups, onSelectGroup, onBrowseGroups }) => {
    return (
        <div className="max-w-6xl mx-auto space-y-12 py-8 px-4">
            {/* Simple Welcome */}
            <header className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">Welcome back, {user?.username}</h1>
                <p className="text-muted-foreground font-medium text-lg">Pick up where you left off or find something new.</p>
            </header>

            {/* Groups Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground/50">Your Groups</h2>
                    <button
                        onClick={onBrowseGroups}
                        className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
                    >
                        Explore More <Icon name="arrowRight" className="w-4 h-4" />
                    </button>
                </div>

                {myGroups.length === 0 ? (
                    <div className="bento-item p-12 text-center border-dashed">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Icon name="search" className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No groups yet</h3>
                        <p className="text-muted-foreground mb-6">Join your first group to start chatting.</p>
                        <button onClick={onBrowseGroups} className="btn-primary h-12 px-8 rounded-xl font-bold">Discover Groups</button>
                    </div>
                ) : (
                    <div className="relative group">
                        {/* Desktop Grid / Mobile Scroll */}
                        <div className="hidden md:grid bento-grid">
                            {myGroups.map(group => (
                                <GroupItem key={group.id} group={group} onClick={() => onSelectGroup(group.id)} />
                            ))}
                        </div>

                        <div className="md:hidden flex overflow-x-auto pb-8 gap-4 snap-x snap-mandatory px-2 no-scrollbar">
                            {myGroups.map(group => (
                                <div key={group.id} className="min-w-[280px] snap-center">
                                    <GroupItem group={group} onClick={() => onSelectGroup(group.id)} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

const GroupItem = ({ group, onClick }: { group: Group, onClick: () => void }) => (
    <motion.button
        whileHover={{ y: -4 }}
        onClick={onClick}
        className="bento-item text-left group w-full bg-surface/40 hover:bg-surface/60 border-white/5 hover:border-primary/20 transition-all duration-300"
    >
        <div className="flex items-start justify-between mb-6">
            <div className="text-4xl">{group.image || '💬'}</div>
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                {group.category || 'Chat'}
            </div>
        </div>
        <div>
            <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{group.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="users" className="w-4 h-4" />
                {group.members || 0} Members
            </p>
        </div>
    </motion.button>
);
