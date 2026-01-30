import React from 'react';
import { Plus, Compass, LogOut, MessageSquare, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Group } from '../../types';
import { Logo } from '../common/Logo';

interface SidebarProps {
    groups: Group[];
    activeGroupId: string | null;
    onSelectGroup: (groupId: string) => void;
    onCreateGroup: () => void;
    onBrowseGroups: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    groups,
    activeGroupId,
    onSelectGroup,
    onCreateGroup,
    onBrowseGroups,
    isOpen,
    onClose
}) => {
    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    // Responsive classes for Drawer behavior
    const drawerClasses = isOpen
        ? "fixed inset-y-0 left-0 z-40 w-3/4 max-w-xs bg-white shadow-2xl transform translate-x-0 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-80 md:shadow-none"
        : "fixed inset-y-0 left-0 z-40 w-3/4 max-w-xs bg-white shadow-2xl transform -translate-x-full transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-80 md:shadow-none";

    const overlayClasses = isOpen
        ? "fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-300"
        : "hidden";

    return (
        <>
            {/* Mobile Overlay */}
            <div className={overlayClasses} onClick={onClose} />

            <aside className={`${drawerClasses} flex flex-col h-full border-r border-gray-200`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <Logo className="h-8 w-auto" />
                    {/* Close button on mobile */}
                    <div className="md:hidden">
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-5 h-5 text-gray-500" />
                        </Button>
                    </div>

                    {/* Desktop Profile - or just integrated below */}
                    <div className="hidden md:block relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-sm cursor-pointer hover:shadow-md transition-all ring-2 ring-transparent hover:ring-indigo-100"
                        >
                            {user?.username?.charAt(0).toUpperCase()}
                        </button>
                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-3 py-3 border-b border-gray-50 mb-1">
                                    <p className="font-semibold text-sm text-gray-900">{user?.username}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center transition-colors">
                                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
                    <div className="mb-6">
                        <Button
                            variant="secondary"
                            className="w-full justify-start text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100"
                            onClick={() => {
                                onBrowseGroups();
                                if (onClose) onClose();
                            }}
                        >
                            <Compass className="w-4 h-4 mr-2" /> Explore Groups
                        </Button>
                    </div>

                    <div className="space-y-1">
                        <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Communities</h3>
                        {groups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => {
                                    onSelectGroup(group.id);
                                    if (onClose) onClose();
                                }}
                                className={`
                      w-full flex items-center p-3 rounded-xl transition-all duration-200 text-left group
                      ${activeGroupId === group.id
                                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }
                    `}
                            >
                                <span className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg text-lg mr-3 group-hover:scale-105 transition-transform duration-200">
                                    {group.image}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{group.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{group.category}</p>
                                </div>
                            </button>
                        ))}

                        {groups.length === 0 && (
                            <div className="text-center py-6 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">You haven't joined any groups yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <Button
                        variant="outline"
                        className="w-full justify-start border-dashed border-gray-300 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white"
                        onClick={() => {
                            onCreateGroup();
                            if (onClose) onClose();
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Group
                    </Button>

                    {/* Mobile Profile Footer */}
                    <div className="mt-4 md:hidden flex items-center gap-3 pt-4 border-t border-gray-200">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                        </div>
                        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};
