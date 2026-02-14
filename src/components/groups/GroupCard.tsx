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
            className="group relative glass-panel rounded-[2rem] p-6 border border-white/5 shadow-2xl hover:border-primary/20 transition-all duration-300 flex flex-col h-full cursor-pointer hover:bg-white/[0.02]"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/5 group-hover:scale-105 transition-transform text-white">
                    {group.image}
                </div>
                {group.memberCount > 0 && (
                    <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 flex items-center gap-2">
                        <Users className="w-3 h-3 text-white/40" />
                        <span className="text-[10px] font-bold text-white/60">{group.memberCount}</span>
                    </div>
                )}
            </div>

            <div className="mb-8 relative z-10 flex-1">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">{group.category}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                    {group.name}
                </h3>
                <p className="text-xs font-medium text-white/40 leading-relaxed line-clamp-2">
                    {group.description || `Join the cluster for ${group.category.toLowerCase()}.`}
                </p>
            </div>

            <div className="mt-auto relative z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction();
                    }}
                    className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isJoined
                        ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                        : "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10"
                        }`}
                >
                    {isJoined ? "Enter" : "Join Cluster"} <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
