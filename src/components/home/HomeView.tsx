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
                    <div className="bento-grid">
                        {myGroups.map(group => (
                            <motion.button
                                key={group.id}
                                whileHover={{ y: -4 }}
                                onClick={() => onSelectGroup(group.id)}
                                className="bento-item text-left group"
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
                        ))}
                    </div>
                )}
            </section>

            {/* Personal Chats Quick Access (Simplified Pulse) */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground/50">Recent Messages</h2>
                <div className="bento-item p-8 bg-surface2/50">
                    <p className="text-muted-foreground text-center py-4 italic font-medium">Head over to the Messages tab to see your direct conversations.</p>
                </div>
            </section>
        </div>
    );
};
