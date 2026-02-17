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
        <div className="w-full h-full flex items-center justify-center p-6">
            <div className="glass-panel p-8 md:p-10 rounded-[2rem] max-w-lg w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 shadow-2xl border border-white/10">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="mb-8 text-center relative z-10">
                    <h2 className="text-3xl font-bold text-[#E6ECFF] tracking-tight mb-2">Create New Group</h2>
                    <p className="text-[#A9B4D0] text-sm font-medium opacity-60">Start a community for like-minded people.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    {/* Icon Picker (Centered) */}
                    <div className="flex flex-col items-center space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#7C89A6]">Group Icon</label>
                        <IconCarousel selectedIcon={icon} onSelectIcon={setIcon} />
                    </div>

                    {/* Inputs */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#7C89A6] ml-1">Group Name</label>
                            <input
                                placeholder="e.g. Design Talks"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full h-14 px-5 rounded-2xl bg-[#152238]/60 border border-white/10 text-[#E6ECFF] placeholder-[#475569] focus:border-[#3B82F6] focus:bg-[#152238] transition-all outline-none font-medium"
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#7C89A6] ml-1">Category</label>
                            <div className="relative">
                                <input
                                    placeholder="Select or Type Category..."
                                    value={category}
                                    onChange={e => {
                                        setCategory(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="w-full h-14 px-5 rounded-2xl bg-[#152238]/60 border border-white/10 text-[#E6ECFF] placeholder-[#475569] focus:border-[#3B82F6] focus:bg-[#152238] transition-all outline-none font-medium"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Icon name="search" className="w-4 h-4 text-[#64748B]" />
                                </div>
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && (category ? filteredCategories.length > 0 : true) && (
                                <div className="absolute z-50 w-full bg-[#152238] border border-white/10 rounded-2xl shadow-xl max-h-48 overflow-y-auto mt-2 p-1 custom-scrollbar">
                                    {filteredCategories.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-[#E6ECFF] text-sm font-medium transition-colors flex items-center gap-2"
                                            onClick={() => {
                                                setCategory(cat);
                                                setShowSuggestions(false);
                                            }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#5B79B7]" />
                                            {cat}
                                        </button>
                                    ))}
                                    {category && !filteredCategories.includes(category) && (
                                        <button
                                            type="button"
                                            className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#3B82F6]/10 text-[#3B82F6] text-sm font-bold transition-colors flex items-center gap-2 mt-1 border-t border-white/5"
                                            onClick={() => {
                                                setShowSuggestions(false);
                                            }}
                                        >
                                            <Icon name="plus" className="w-4 h-4" /> Create "{category}"
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!name || !category || isSubmitting}
                            className="w-full h-14 rounded-full bg-[#3B82F6] text-white font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-[#2563EB] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Icon name="rotate" className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Create Group <Icon name="arrowRight" className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
