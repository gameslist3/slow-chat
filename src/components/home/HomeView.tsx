import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';
import { Group, User } from '../../types';

interface HomeViewProps {
    user: User | null;
    myGroups: Group[];
    onSelectGroup: (id: string) => void;
    onBrowseGroups: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, myGroups, onSelectGroup, onBrowseGroups }) => {
    return (
        <div className="h-full overflow-y-auto p-6 md:p-12 lg:p-16 space-y-12 md:space-y-20 animate-in fade-in duration-1000 custom-scrollbar text-foreground">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pt-4 md:pt-8">
                <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter text-foreground leading-[0.8] uppercase italic">
                    Welcome, <br />
                    <span className="text-primary italic underline appearance-none decoration-primary/20 decoration-8 underline-offset-8">{user?.username}</span>
                </h1>
                <p className="text-muted-foreground/60 font-medium text-sm md:text-xl max-w-2xl leading-relaxed">
                    Select a chat to begin.
                </p>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8 md:mb-12 border-b border-white/5 pb-4">
                    <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Your Groups</h2>
                    <span className="text-[10px] md:text-xs font-bold text-primary italic">{myGroups.length} Groups</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {myGroups.length > 0 ? (
                        myGroups.map(g => {
                            const unread = user ? (g.unreadCounts?.[user.id] || 0) : 0;
                            return (
                                <motion.button
                                    key={g.id}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelectGroup(g.id)}
                                    className="glass-panel group flex flex-col items-start gap-8 hover:border-primary/40 transition-all text-left p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 relative overflow-hidden h-72 md:h-80 shadow-2xl hover:shadow-primary/5 bg-gradient-to-br from-white/[0.03] to-transparent"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:rotate-12 pointer-events-none">
                                        <Icon name="message" className="w-24 h-24" />
                                    </div>

                                    <div className="flex-1 w-full flex flex-col justify-between z-10">
                                        <span className="text-6xl md:text-7xl group-hover:scale-110 transition-transform duration-700 block drop-shadow-2xl">{g.image}</span>

                                        <div className="space-y-4 w-full">
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className="font-black text-xl md:text-2xl tracking-tight text-foreground line-clamp-1 uppercase italic leading-none">{g.name}</h3>
                                                {unread > 0 && (
                                                    <span className="bg-primary text-white text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-primary/30 animate-pulse uppercase tracking-widest shrink-0">
                                                        {unread}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[8px] md:text-[9px] font-bold uppercase text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">{g.category}</span>
                                                <div className="flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold uppercase text-muted-foreground/40">
                                                    <Icon name="users" className="w-3.5 h-3.5" />
                                                    <span>{g.members} Members</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/40 transition-all duration-700" />
                                </motion.button>
                            );
                        })
                    ) : (
                        <div className="col-span-full glass-panel border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center py-24 md:py-32 text-center gap-8 rounded-[3rem] md:rounded-[4rem]">
                            <div className="text-8xl md:text-9xl opacity-10 animate-pulse grayscale filter blur-sm">📡</div>
                            <div className="space-y-3">
                                <h1 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-wider">No Groups Joined</h1>
                                <p className="text-sm md:text-base font-medium text-muted-foreground/40 max-w-xs mx-auto">Join a group to start chatting.</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onBrowseGroups}
                                className="btn-primary rounded-2xl md:rounded-3xl h-16 md:h-20 px-10 md:px-12 text-[10px] md:text-xs font-black tracking-[0.2em] shadow-2xl shadow-primary/30 uppercase mt-4"
                            >
                                Join a Group
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
