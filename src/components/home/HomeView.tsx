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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Legend / Breadcrumb */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                <Icon name="zap" className="w-3 h-3" />
                <span>Operational Dashboard</span>
                <span className="text-white/10">/</span>
                <span className="text-white">Overview</span>
            </div>

            {/* Hero / Overview Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                        Welcome back, <br />
                        <span className="text-primary">{user?.username}</span>
                    </h1>
                    <p className="mt-4 text-muted-foreground/60 font-medium max-w-lg leading-relaxed">
                        Your decentralized communication nodes are fully operational. {myGroups.length} clusters are active.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button onClick={onBrowseGroups} className="btn-secondary h-12 px-6 rounded-xl">
                        Explore Clusters
                    </button>
                    <button className="btn-primary h-12 px-6 rounded-xl flex items-center gap-2">
                        <Icon name="plus" className="w-4 h-4" />
                        New Node
                    </button>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[240px]">

                {/* Large Featured Card: Recent Clusters */}
                <div className="md:col-span-2 md:row-span-2 bento-item bg-gradient-to-br from-primary/10 via-transparent to-transparent flex flex-col p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black italic uppercase">Active Clusters</h3>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Real-time Node Status</p>
                        </div>
                        <Icon name="layers" className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar -mx-2 px-2">
                        {myGroups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => onSelectGroup(g.id)}
                                className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-primary/20 transition-all flex items-center gap-4 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                    {g.image}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold uppercase tracking-tight">{g.name}</p>
                                        <span className="text-[10px] text-primary/60 font-black">{g.category}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/40 mt-0.5 truncate">{g.lastMessage || 'Channel standby...'}</p>
                                </div>
                                <Icon name="chevron-right" className="w-4 h-4 text-white/5 group-hover:text-primary transition-colors" />
                            </button>
                        ))}
                        {myGroups.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center py-12 opacity-40">
                                <Icon name="activity" className="w-12 h-12 mb-4 animate-pulse" />
                                <p className="text-xs uppercase font-black tracking-widest">No nodes active</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Action: Global Pulse */}
                <div className="bento-item p-8 border-secondary/20 bg-secondary/5">
                    <div className="flex items-center justify-between mb-2">
                        <Icon name="activity" className="w-5 h-5 text-secondary" />
                        <span className="text-[10px] font-black text-secondary">LIVE</span>
                    </div>
                    <div>
                        <h4 className="text-2xl font-black italic uppercase">Global Pulse</h4>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-1">Cross-cluster activity</p>
                    </div>
                    <div className="mt-8 flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050505] bg-secondary/20 flex items-center justify-center text-[10px] font-black">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-[#050505] bg-white/5 flex items-center justify-center text-[10px] font-black">
                            +12
                        </div>
                    </div>
                </div>

                {/* Stat: Operations */}
                <div className="bento-item p-8 border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <Icon name="shield" className="w-5 h-5 text-primary" />
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    </div>
                    <div>
                        <span className="text-4xl font-black italic">99.9%</span>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-1">Node Integrity</p>
                    </div>
                    <div className="mt-auto flex items-end justify-between">
                        <div className="h-12 w-1.5 rounded-full bg-primary/20 overflow-hidden">
                            <div className="h-3/4 w-full bg-primary rounded-full bottom-0" />
                        </div>
                        <div className="h-8 w-1.5 rounded-full bg-primary/20 overflow-hidden">
                            <div className="h-1/2 w-full bg-primary rounded-full bottom-0" />
                        </div>
                        <div className="h-10 w-1.5 rounded-full bg-primary/20 overflow-hidden">
                            <div className="h-4/5 w-full bg-primary rounded-full bottom-0" />
                        </div>
                        <div className="h-6 w-1.5 rounded-full bg-primary/20 overflow-hidden">
                            <div className="h-1/3 w-full bg-primary rounded-full bottom-0" />
                        </div>
                    </div>
                </div>

                {/* Final Bento Item: System Config */}
                <div className="md:col-span-2 bento-item bg-white/[0.02] border-white/5 p-8 flex flex-row items-center justify-between group cursor-pointer hover:border-white/20 transition-all">
                    <div>
                        <h4 className="text-xl font-black italic uppercase">Protocol Logs</h4>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-1">Export session history and audit logs</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <Icon name="download" className="w-6 h-6" />
                    </div>
                </div>

            </div>
        </div>
    );
};
