import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { Group } from '../../types';
import { getGroups, createGroup, CATEGORIES, ICONS } from '../../services/firebaseGroupService';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- Group Card ---
const GroupCard = ({ group, isJoined, onAction }: { group: Group, isJoined: boolean, onAction: () => void }) => (
    <div className="group relative bg-surface border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col h-full overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
            <Icon name="message" className="w-20 h-20 -rotate-12" />
        </div>

        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">{group.image}</div>
            <div className="ui-badge lowercase bg-surface2 border border-border/50 font-black">{group.category}</div>
        </div>

        <div className="mb-6 relative z-10">
            <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight uppercase leading-none">{group.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 font-medium italic">A private and secure space for asynchronous conversations.</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-6 border-t border-border/30 relative z-10">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Icon name="users" className="w-3 h-3" />
                <span>{group.members} Members</span>
            </div>
            <button
                onClick={onAction}
                className={`
                    px-6 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${isJoined ? 'bg-surface2 text-primary hover:bg-primary/10' : 'bg-primary text-white hover:scale-105 shadow-lg shadow-primary/20'}
                `}
            >
                {isJoined ? "Open" : "Join"}
            </button>
        </div>
    </div>
);

// --- Discovery ---
export const GroupDiscovery = ({ onJoinGroup, onSelectGroup, joinedGroupIds }: any) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getGroups();
            setGroups(data);
            setLoading(false);
        })();
    }, []);

    const filtered = groups.filter(g =>
        g.name.toLowerCase().includes(filter.toLowerCase()) ||
        g.category.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="h-full overflow-y-auto w-full p-4 md:p-8 custom-scrollbar text-foreground">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center py-10 space-y-4">
                    <h1 className="text-5xl font-black tracking-tighter uppercase italic underline decoration-primary/30 decoration-8 underline-offset-8">Discover Groups</h1>
                    <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto">Explore public groups and start meaningful conversations.</p>
                </div>

                <div className="relative max-w-2xl mx-auto">
                    <Input
                        placeholder="Search groups or categories..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        icon={<Icon name="search" className="w-5 h-5 text-muted-foreground" />}
                        className="h-16 rounded-3xl text-lg font-bold bg-surface border-2 focus:ring-4 focus:ring-primary/10"
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 w-full rounded-3xl bg-muted animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {filtered.map(g => (
                            <GroupCard
                                key={g.id}
                                group={g}
                                isJoined={joinedGroupIds.includes(g.id)}
                                onAction={() => joinedGroupIds.includes(g.id) ? onSelectGroup(g.id) : onJoinGroup(g.id)}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <div className="text-8xl opacity-10">💬</div>
                                <p className="text-xl font-black text-muted-foreground uppercase tracking-widest">No groups found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Create Group ---
export const CreateGroup = ({ onGroupCreated }: { onGroupCreated: (id: string) => void }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [cat, setCat] = useState('');
    const [icon, setIcon] = useState(ICONS[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !cat) return;
        setLoading(true);
        const g = await createGroup(name, cat, icon, user?.username || 'User', user?.id || 'anon');
        setLoading(false);
        onGroupCreated(g.id);
    };

    return (
        <div className="max-w-2xl mx-auto p-10 bg-surface border border-border/50 rounded-[40px] shadow-2xl animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-4 h-12 bg-primary rounded-full" />
                <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Create Group</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Choose an icon</label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 p-4 bg-muted/30 rounded-3xl border border-border/30">
                        {ICONS.map(i => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setIcon(i)}
                                className={`
                                    aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all duration-300
                                    ${icon === i ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30 z-10' : 'bg-surface hover:bg-muted hover:scale-105'}
                                `}
                            >
                                {i}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input
                        label="Group Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Enter group name..."
                        className="bg-muted/10 font-bold h-14"
                    />
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Select Category</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {CATEGORIES.slice(0, 4).map(c => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setCat(c)}
                                    className={`
                                        px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all
                                        ${cat === c ? 'bg-primary border-primary text-white shadow-md shadow-primary/10' : 'bg-surface border-border/50 text-muted-foreground hover:border-primary/30'}
                                    `}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <Input
                            value={cat}
                            onChange={e => setCat(e.target.value)}
                            placeholder="Or type a category..."
                            className="bg-muted/10 font-bold h-14"
                        />
                    </div>
                </div>

                <button
                    className="ui-button-primary w-full h-16 text-sm font-black uppercase tracking-[0.3em] shadow-2xl disabled:opacity-30 disabled:grayscale transition-all"
                    disabled={!name || !cat || loading}
                >
                    {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin" /> : "Create Group"}
                </button>
            </form>
        </div>
    );
};
