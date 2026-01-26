import React from 'react';
import { Plus, MessageSquare, Settings, LogOut, Compass } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { Group, User } from '../../types';

interface AISidebarProps {
    groups: Group[];
    activeId: string | null;
    onSelectGroup: (id: string) => void;
    onBrowseGroups: () => void;
    onCreateGroup: () => void;
    onOpenSettings: () => void;
    user: User | null;
    onLogout: () => void;
}

export const AISidebar: React.FC<AISidebarProps> = ({
    groups,
    activeId,
    onSelectGroup,
    onBrowseGroups,
    onCreateGroup,
    onOpenSettings,
    user,
    onLogout
}) => {
    return (
        <div className="flex flex-col h-full text-sm">
            {/* New Chat Button */}
            <div className="p-4 border-b border-border/50 flex flex-col gap-2">
                <Button
                    className="w-full justify-start gap-3 bg-ai-surface hover:bg-ai-hover text-foreground border-border rounded-xl h-11 transition-all"
                    variant="outline"
                    onClick={onCreateGroup}
                >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">New Chat</span>
                </Button>
                <Button
                    className="w-full justify-start gap-3 bg-transparent hover:bg-ai-hover text-muted-foreground hover:text-foreground border-transparent rounded-xl h-11 transition-all"
                    variant="ghost"
                    onClick={onBrowseGroups}
                >
                    <Compass className="w-4 h-4" />
                    <span className="font-medium">Discovery</span>
                </Button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 custom-scrollbar">
                <div className="px-3 mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Your Groups</span>
                    <span className="bg-ai-surface text-[10px] px-1.5 py-0.5 rounded text-muted-foreground font-mono">{groups.length}</span>
                </div>
                {groups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => onSelectGroup(group.id)}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group
                            ${activeId === group.id ? 'bg-ai-surface text-foreground shadow-sm ring-1 ring-white/5' : 'text-muted-foreground hover:bg-ai-hover hover:text-foreground'}
                        `}
                    >
                        <span className={`text-xl transition-all duration-300 ${activeId === group.id ? 'scale-125' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                            {group.image}
                        </span>
                        <span className="truncate flex-1 font-medium">{group.name}</span>
                    </button>
                ))}
                {groups.length === 0 && (
                    <div className="px-3 py-10 text-center opacity-30">
                        <p className="text-xs italic">No groups joined yet</p>
                    </div>
                )}
            </div>

            {/* User Profile / Footer */}
            <div className="mt-auto p-4 border-t border-border/50 space-y-2">
                <div
                    onClick={onOpenSettings}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-ai-hover transition-colors cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-full bg-ai-accent flex items-center justify-center text-white font-bold text-xs ring-2 ring-transparent group-hover:ring-ai-accent/30 transition-all">
                        {user?.username?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user?.username || 'User'}</p>
                        <p className="text-[10px] text-muted-foreground truncate opacity-70">{user?.email}</p>
                    </div>
                    <Settings className="w-4 h-4 text-muted-foreground group-hover:rotate-45 transition-transform" />
                </div>
                <div className="flex items-center justify-between px-2 pt-2">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onLogout}
                        className="text-muted-foreground hover:text-destructive transition-colors rounded-full"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
