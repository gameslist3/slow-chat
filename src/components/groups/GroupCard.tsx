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
        <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {group.image}
                </div>
                <span className="px-3 py-1 bg-gray-50 text-xs font-semibold text-gray-500 rounded-full uppercase tracking-wide">
                    {group.category}
                </span>
            </div>

            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-indigo-700 transition-colors">
                    {group.name}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                    A place for thoughtful conversation about {group.category.toLowerCase()}.
                </p>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="flex items-center text-sm font-medium text-gray-600">
                        <Users className="w-4 h-4 mr-1.5 text-gray-400" /> {group.members}
                    </span>
                    {group.activeUsers.length > 0 && (
                        <span className="flex items-center text-xs text-green-600 font-medium">
                            <Activity className="w-3 h-3 mr-1.5" /> {group.activeUsers.length} online
                        </span>
                    )}
                </div>

                <Button
                    variant={isJoined ? "secondary" : "default"}
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAction();
                    }}
                    className={isJoined ? "" : "bg-indigo-600 hover:bg-indigo-700"}
                >
                    {isJoined ? "Open" : "Join"} <ArrowRight className="w-4 h-4 ml-1 opacity-60" />
                </Button>
            </div>
        </div>
    );
};
