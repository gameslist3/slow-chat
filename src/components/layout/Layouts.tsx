import React, { useState } from 'react';
import { Menu, ArrowLeft, X, Plus, Compass, LogOut, Bell, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Group } from '../../types';
import { useAuth } from '../../context/AuthContext';

// --- MobileHeader ---
export const MobileHeader = ({ title = "SlowChat", showBack, onBack, onMenuToggle }: any) => (
    <div className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
            {showBack ? (
                <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
            ) : (
                <Button variant="ghost" size="icon" onClick={onMenuToggle} className="-ml-2"><Menu className="w-5 h-5" /></Button>
            )}
            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px]">{title}</h1>
        </div>
    </div>
);

// --- Sidebar ---
export const Sidebar = ({ groups, activeGroupId, onSelectGroup, onCreateGroup, onBrowseGroups, onOpenSettings, isOpen, onClose }: any) => {
    const { user, logout, leaveGroup } = useAuth();

    const drawerClasses = isOpen
        ? "fixed inset-y-0 left-0 z-40 w-3/4 max-w-xs bg-white shadow-2xl transform translate-x-0 transition-transform duration-300 md:translate-x-0 md:static md:w-80 md:shadow-none"
        : "fixed inset-y-0 left-0 z-40 w-3/4 max-w-xs bg-white shadow-2xl transform -translate-x-full transition-transform duration-300 md:translate-x-0 md:static md:w-80 md:shadow-none";

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in" onClick={onClose} />}
            <aside className={`${drawerClasses} flex flex-col h-full border-r border-gray-100 bg-white`}>
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-indigo-600">SlowChat</h2>
                    <div className="flex items-center gap-2">
                        {/* Notif Bell - Mobile Helper */}
                        <button className="relative p-2 hover:bg-gray-100 rounded-full md:hidden">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="md:hidden"><Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button></div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <Button variant="secondary" className="w-full justify-start text-indigo-700 bg-indigo-50 border-0" onClick={() => { onBrowseGroups(); if (onClose) onClose(); }}>
                        <Compass className="w-4 h-4 mr-2" /> Explore Groups
                    </Button>

                    <div className="pt-4 space-y-1">
                        <h3 className="px-2 text-xs font-bold text-gray-400 uppercase">My Groups</h3>
                        {groups.length === 0 && <div className="px-2 py-4 text-sm text-gray-500 text-center border border-dashed rounded-lg bg-gray-50">No groups joined yet.</div>}
                        {groups.map((g: Group) => (
                            <button key={g.id} onClick={() => { onSelectGroup(g.id); if (onClose) onClose(); }} className={`w-full flex items-center p-3 rounded-xl transition-all text-left group relative pr-10 ${activeGroupId === g.id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}>
                                <span className="text-xl mr-3">{g.image}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{g.name}</p>
                                    <p className={`text-xs truncate ${activeGroupId === g.id ? 'text-indigo-200' : 'text-gray-400'}`}>{g.category}</p>
                                </div>
                                {/* Leave Group Button - Visible on Hover */}
                                <div
                                    className={`absolute right-2 p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-all ${activeGroupId === g.id ? 'hover:bg-indigo-500 text-indigo-200 hover:text-white' : 'hover:bg-gray-200 text-gray-400 hover:text-red-500'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Leave ${g.name}?`)) {
                                            leaveGroup(g.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </div>
                                {g.id === '1' && activeGroupId !== '1' && (
                                    <span className="absolute right-3 top-3 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse pointer-events-none"></span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/50">
                    <Button variant="outline" className="w-full justify-start" onClick={() => { onCreateGroup(); if (onClose) onClose(); }}><Plus className="w-4 h-4 mr-2" /> New Group</Button>
                    <div className="flex items-center gap-3 pt-2 group cursor-pointer" onClick={() => { if (onOpenSettings) onOpenSettings(); if (onClose) onClose(); }}>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">{user?.username?.[0]}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-indigo-600 transition-colors">{user?.username}</p>
                            <p className="text-[10px] text-gray-400">View Settings</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4" /></button>
                    </div>
                </div>
            </aside>
        </>
    );
};

// --- MainLayout ---
export const MainLayout = ({ children, userGroups, activeGroupId, onSelectGroup, onCreateGroup, onBrowseGroups, onOpenSettings, mobileTitle, showMobileBack, onMobileBack, showMobileHeader = true }: any) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar
                groups={userGroups}
                activeGroupId={activeGroupId}
                onSelectGroup={onSelectGroup}
                onCreateGroup={onCreateGroup}
                onBrowseGroups={onBrowseGroups}
                onOpenSettings={onOpenSettings}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-white w-full">
                {showMobileHeader && <MobileHeader title={mobileTitle} showBack={showMobileBack} onBack={onMobileBack} onMenuToggle={() => setSidebarOpen(true)} />}
                <div className="flex-1 overflow-hidden relative">{children}</div>
            </main>
        </div>
    );
};
