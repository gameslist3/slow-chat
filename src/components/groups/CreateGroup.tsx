import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconCarousel } from './IconCarousel';
import { CATEGORIES, createGroup, ICONS } from '../../services/firebaseGroupService';
import { useAuth } from '../../context/AuthContext';

interface CreateGroupProps {
    onGroupCreated: (groupId: string) => void;
}

export const CreateGroup: React.FC<CreateGroupProps> = ({ onGroupCreated }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [icon, setIcon] = useState(ICONS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Category Autocomplete state
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredCategories = CATEGORIES.filter(c =>
        c.toLowerCase().includes(category.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !category || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const newGroup = await createGroup(name, category, icon, user?.username || 'Anonymous', user?.id || 'anonymous');
            onGroupCreated(newGroup.id);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 w-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="mb-10 flex-shrink-0 relative z-10">
                <h2 className="text-4xl font-black text-foreground italic uppercase tracking-tighter">Initiate Group</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-2">New Synchronicity Node</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Visual Identity</label>
                    <IconCarousel selectedIcon={icon} onSelectIcon={setIcon} />
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Designation</label>
                        <input
                            placeholder="e.g. Midnight Philosophers"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="glass-input h-16 text-lg font-bold px-6 bg-surface border-border focus:bg-surface2"
                        />
                    </div>
                </div>

                <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Classification</label>
                    <input
                        placeholder="Search or type a category..."
                        value={category}
                        onChange={e => {
                            setCategory(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        className="glass-input h-16 px-6 bg-surface border-border focus:bg-surface2"
                    />

                    {showSuggestions && (category ? filteredCategories.length > 0 : true) && (
                        <div className="absolute z-50 w-full bg-surface mt-2 border border-border rounded-2xl shadow-2xl max-h-48 overflow-y-auto backdrop-blur-xl">
                            {filteredCategories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className="w-full text-left px-5 py-3 hover:bg-primary/5 text-sm font-bold transition-all flex items-center gap-3"
                                    onClick={() => {
                                        setCategory(cat);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                    {cat}
                                </button>
                            ))}
                            {category && !filteredCategories.includes(category) && (
                                <button
                                    type="button"
                                    className="w-full text-left px-5 py-3 hover:bg-primary/5 text-primary text-sm font-black flex items-center border-t border-border"
                                    onClick={() => {
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <Icon name="plus" className="w-4 h-4 mr-2" /> CREATE "{category.toUpperCase()}"
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                        <Icon name="shield" className="w-4 h-4" /> Protocol Guidelines
                    </div>
                    <ul className="space-y-1.5">
                        <li className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight flex items-start gap-2">
                            <span className="text-primary">•</span> Empty nodes auto-purge after 5 hours
                        </li>
                        <li className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight flex items-start gap-2">
                            <span className="text-primary">•</span> Abandoned nodes dissolve after 2 hours
                        </li>
                    </ul>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={!name || !category || isSubmitting}
                        className="w-full h-18 rounded-[1.5rem] bg-foreground text-background font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isSubmitting ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Establish Group'}
                    </button>
                </div>
            </form>
        </div>
    );
};
