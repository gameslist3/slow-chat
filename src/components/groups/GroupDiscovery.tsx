import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { GroupCard } from './GroupCard';
import { Skeleton } from '../ui/Skeleton';
import { Group } from '../../types';
import { getGroups } from '../../services/firebaseGroupService';

interface GroupDiscoveryProps {
    onJoinGroup: (groupId: string) => void;
    onSelectGroup: (groupId: string) => void;
    joinedGroupIds: string[];
    // onBack handled by Layout header
}

export const GroupDiscovery: React.FC<GroupDiscoveryProps> = ({
    onJoinGroup,
    onSelectGroup,
    joinedGroupIds,
}) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        setLoading(true);
        // Simulate slight delay for skeleton demo
        await new Promise(r => setTimeout(r, 800));
        const data = await getGroups();
        setGroups(data);
        setLoading(false);
    };

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(filter.toLowerCase()) ||
        g.category.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="h-full overflow-y-auto w-full bg-gray-50/30">
            <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-10">
                <div className="text-center space-y-4 py-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                        Find your <span className="text-indigo-600">Community</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto">
                        Discover thoughtful groups where conversation flows at a human pace.
                    </p>
                </div>

                <div className="max-w-md mx-auto relative p-1 shadow-sm rounded-xl">
                    <Input
                        placeholder="Connect with a cluster..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="pl-12 h-16 text-lg shadow-2xl border-white/5 bg-background/40 backdrop-blur-xl rounded-2xl focus:ring-primary/20 focus:border-primary/30"
                        icon={<Search className="w-5 h-5 text-muted-foreground/40" />}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100 h-64 flex flex-col justify-between">
                                <div className="flex justify-between">
                                    <Skeleton className="w-14 h-14 rounded-2xl" />
                                    <Skeleton className="w-20 h-6 rounded-full" />
                                </div>
                                <div className="space-y-3">
                                    <Skeleton className="w-3/4 h-8" />
                                    <Skeleton className="w-full h-4" />
                                    <Skeleton className="w-2/3 h-4" />
                                </div>
                                <div className="flex justify-between items-center pt-4">
                                    <Skeleton className="w-12 h-4" />
                                    <Skeleton className="w-24 h-9 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                        {filteredGroups.map((group, idx) => {
                            const isJoined = joinedGroupIds.includes(group.id);
                            return (
                                <div key={group.id} style={{ animationDelay: `${idx * 100}ms` }}>
                                    <GroupCard
                                        group={group}
                                        isJoined={isJoined}
                                        onAction={() => isJoined ? onSelectGroup(group.id) : onJoinGroup(group.id)}
                                    />
                                </div>
                            );
                        })}

                        {filteredGroups.length === 0 && (
                            <div className="col-span-full text-center py-20">
                                <p className="text-gray-400">No groups found matching "{filter}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
