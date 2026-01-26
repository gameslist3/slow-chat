import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-300 w-full">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Create New Group</h2>
                <p className="text-gray-500">Start a thoughtful conversation.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Group Icon</label>
                    <IconCarousel selectedIcon={icon} onSelectIcon={setIcon} />
                </div>

                <div className="space-y-4">
                    <Input
                        label="Group Name"
                        placeholder="e.g. Midnight Philosophers"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="text-lg font-medium"
                    />
                </div>

                <div className="space-y-1 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <Input
                        placeholder="Search or type a category..."
                        value={category}
                        onChange={e => {
                            setCategory(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />

                    {showSuggestions && (category ? filteredCategories.length > 0 : true) && (
                        <div className="absolute z-50 w-full bg-white mt-1 border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {filteredCategories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-gray-700 text-sm"
                                    onClick={() => {
                                        setCategory(cat);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                            {category && !filteredCategories.includes(category) && (
                                <button
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-600 text-sm font-medium flex items-center"
                                    onClick={() => {
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Use "{category}"
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        disabled={!name || !category}
                        className="w-full md:w-auto"
                    >
                        Create Group
                    </Button>
                </div>
            </form>
        </div>
    );
};
