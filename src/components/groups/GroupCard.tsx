import React from 'react';
import { Users, ArrowRight, Activity } from 'lucide-react';
import { Button } from '../ui/Button';
import { Group } from '../../types';

interface GroupCardProps {
    group: Group;
    isJoined: boolean;
    onAction: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, isJoined, onAction }) => {
    return (
        <div
            onClick={onAction}
            className="group relative glass-panel rounded-[2.5rem] p-8 border border-white/5 shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col h-full cursor-pointer overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="w-16 h-16 glass-card rounded-[1.5rem] flex items-center justify-center text-4xl shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border-white/10">
                    {group.image}
                </div>
                <span className="px-4 py-1.5 glass-card text-[10px] font-black text-primary/60 rounded-full uppercase tracking-[0.2em] border-primary/20">
                    {group.category}
                </span>
            </div>

            <div className="mb-6 relative z-10">
                <h3 className="text-2xl font-black text-foreground mb-3 leading-none tracking-tight group-hover:text-primary transition-colors">
                    {group.name}
                </h3>
                <p className="text-sm font-medium text-muted-foreground/60 leading-relaxed line-clamp-2">
                    {group.description || `A decentralized cluster for human coordination regarding ${group.category.toLowerCase()}.`}
                </p>
            </div>

            <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex flex-col gap-2">
                    <span className="flex items-center text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5 mr-2 text-primary/40" /> {group.members || group.memberCount || 0} COORDINATORS
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-green-500/60 uppercase tracking-widest">Protocol Active</span>
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction();
                    }}
                    className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isJoined
                            ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                            : "btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/40"
                        }`}
                >
                    {isJoined ? "Open" : "Connect"} <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};
