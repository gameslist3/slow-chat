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
    <div className="group relative glass-card p-8 rounded-[2.5rem] flex flex-col h-full overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon name="message" className="w-24 h-24 -rotate-12" />
        </div>

        <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="w-16 h-16 bg-primary/10 rounded-[1.75rem] flex items-center justify-center text-4xl shadow-lg shadow-black/5 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-700">{group.image}</div>
            <div className="px-3 py-1 glass-card bg-foreground/5 rounded-full font-protocol text-[9px] tracking-widest text-primary uppercase border-primary/10">{group.category}</div>
        </div>

        <div className="mb-8 relative z-10">
            <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors tracking-tighter uppercase leading-none">{group.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 font-medium italic opacity-70">A private and secure space for asynchronous conversations.</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-8 border-t border-border/5 relative z-10">
            <div className="flex items-center gap-2 text-[9px] font-protocol tracking-[0.2em] text-muted-foreground uppercase opacity-40">
                <Icon name="users" className="w-3 h-3" />
                <span>{group.members}</span>
            </div>
            <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAction}
                className={`
                    px-8 h-11 rounded-2xl text-[10px] font-protocol tracking-[0.3em] uppercase transition-all
                    ${isJoined ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'btn-primary shadow-xl'}
                `}
            >
                {isJoined ? "open" : "join"}
            </motion.button>
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
        <div className="h-full overflow-y-auto w-full p-6 md:p-12 custom-scrollbar text-foreground">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center py-12 space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 glass-card rounded-full font-protocol text-[9px] tracking-[0.4em] text-primary uppercase mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Explore
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">Explore</h1>
                    <p className="text-muted-foreground font-medium text-xl max-w-2xl mx-auto italic opacity-60">Discover communities and new chats.</p>
                </div>

                <div className="relative max-w-3xl mx-auto group">
                    <Icon name="search" className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-30 transition-opacity group-focus-within:opacity-100" />
                    <input
                        placeholder="Scan protocols or clusters..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="glass-input pl-16 h-20 bg-foreground/5 text-xl font-bold rounded-[2rem]"
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-72 w-full rounded-[2.5rem] glass-card animate-pulse bg-background/5" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        {filtered.map(g => (
                            <GroupCard
                                key={g.id}
                                group={g}
                                isJoined={joinedGroupIds.includes(g.id)}
                                onAction={() => joinedGroupIds.includes(g.id) ? onSelectGroup(g.id) : onJoinGroup(g.id)}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full py-32 text-center space-y-6">
                                <div className="text-9xl opacity-10 filter blur-sm">🌌</div>
                                <p className="text-xl font-protocol font-black text-muted-foreground uppercase tracking-[0.4em] italic opacity-30">Zero nodes detected</p>
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
        <div className="max-w-3xl mx-auto glass-panel p-12 rounded-[3.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-1000 relative overflow-hidden">
            {/* Design detail */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="flex items-center gap-6 mb-16">
                <div className="w-1.5 h-16 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]" />
                <div className="flex flex-col">
                    <span className="font-protocol text-[10px] tracking-[0.5em] text-primary opacity-50 uppercase">Initialization_Module</span>
                    <h2 className="text-5xl font-black tracking-tighter uppercase italic leading-none mt-2">New Group</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
                <div className="space-y-6">
                    <label className="font-protocol text-[9px] uppercase tracking-[0.4em] text-primary opacity-60 ml-2">Identify Nexus Avatar</label>
                    <div className="grid grid-cols-6 sm:grid-cols-9 gap-4 p-6 glass-card bg-foreground/5 rounded-[2.5rem]">
                        {ICONS.map(i => (
                            <motion.button
                                key={i}
                                type="button"
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIcon(i)}
                                className={`
                                    aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all duration-500
                                    ${icon === i ? 'bg-primary text-white scale-110 shadow-xl shadow-primary/30 z-10' : 'bg-foreground/5 hover:bg-foreground/10'}
                                `}
                            >
                                {i}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="font-protocol text-[9px] uppercase tracking-[0.4em] text-primary opacity-60 ml-2">group name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Designate Nexus..."
                            className="glass-input bg-foreground/5 font-bold h-16 text-lg"
                        />
                    </div>
                    <div className="space-y-6">
                        <label className="font-protocol text-[9px] uppercase tracking-[0.4em] text-primary opacity-60 ml-2">Sync_Classification</label>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {CATEGORIES.slice(0, 4).map(c => (
                                <button
                                    type="button"
                                    key={c}
                                    onClick={() => setCat(c)}
                                    className={`
                                        px-4 py-1.5 rounded-full text-[9px] font-protocol tracking-widest border transition-all uppercase
                                        ${cat === c ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'glass-card bg-foreground/5 border-border/10 text-muted-foreground hover:border-primary/40'}
                                    `}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                        <input
                            value={cat}
                            onChange={e => setCat(e.target.value)}
                            placeholder="Custom Cluster..."
                            className="glass-input bg-foreground/5 font-bold h-16 text-lg"
                        />
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full h-20 text-base font-protocol tracking-[0.44em] shadow-2xl disabled:opacity-30 disabled:grayscale transition-all rounded-[2rem]"
                    disabled={!name || !cat || loading}
                >
                    {loading ? <Icon name="rotate" className="w-6 h-6 animate-spin" /> : "Initiate Nexus Protocol"}
                </motion.button>
            </form>
        </div>
    );
};
