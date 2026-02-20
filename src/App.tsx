import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { WelcomeScreen, SignInScreen, SignUpScreen, ForgotPasswordScreen, NameScreen } from './components/auth/AuthScreens';
import { StoragePolicyModal } from './components/auth/StoragePolicyModal';
import { GroupDiscovery, CreateGroup } from './components/groups/GroupFeatures';
import { ChatInterface } from './components/chat/ChatFeatures';
import { AccountSettings } from './components/auth/AccountSettings';
import { UserProfileModal } from './components/user/UserProfileModal';
import { FollowRequests } from './components/auth/FollowRequests';
import { subscribeToGroups, joinGroup } from './services/firebaseGroupService';
import { Group, User, PersonalChat } from './types';
import { AILayout } from './components/ai-ui/AILayout';
import { Icon } from './components/common/Icon';
import { useInbox } from './hooks/useChat';
import { HomeView } from './components/home/HomeView';
import { AuroraBackground } from './components/ui/AuroraBackground';
import { updateUserStatus, updateActiveChat } from './services/firebaseAuthService';
import { FriendsList } from './components/social/FriendsList';
import { NotificationList } from './components/chat/NotificationCenter';
import { subscribeToNotifications, markAllAsRead } from './services/firebaseNotificationService';
import { unfollowUser, getPendingRequests } from './services/firebaseFollowService';
import { markAsSeen } from './services/firebaseMessageService';

const AuthSection = () => {
    const { user, completeLogin, loginWithData } = useAuth();
    const [step, setStep] = useState('welcome');

    if (user && !user.username) {
        return <NameScreen onNameSelected={completeLogin} />;
    }

    return (
        <div className="flex-1 w-full flex flex-col">
            <AnimatePresence mode="wait">
                {step === 'welcome' && <WelcomeScreen key="w" onSignIn={() => setStep('signin')} onSignUp={() => setStep('signup')} />}
                {step === 'signin' && <SignInScreen key="si" onBack={() => setStep('welcome')} onSuccess={loginWithData} onForgotPassword={() => setStep('forgot-password')} />}
                {step === 'signup' && <SignUpScreen key="su" onBack={() => setStep('welcome')} onSuccess={loginWithData} />}
                {step === 'forgot-password' && <ForgotPasswordScreen key="fp" onBack={() => setStep('signin')} />}
            </AnimatePresence>
        </div>
    );
};

const AppContent = () => {
    const { isAuthenticated, user, loading } = useAuth();
    const [isClient, setIsClient] = useState(false);
    const [forceShow, setForceShow] = useState(false);
    const [showPolicy, setShowPolicy] = useState(false);
    const [theme] = useState<'dark'>('dark');

    useEffect(() => {
        setIsClient(true);
        console.log('[App] Mount Start');

        // Safety timeout for loading state
        const timer = setTimeout(() => {
            console.warn('[App] Loading timeout reached - forcing start');
            setForceShow(true);
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('slowchat_theme', 'dark');
    }, []);

    useEffect(() => {
        const accepted = localStorage.getItem('slowchat_storage_accepted');
        if (!accepted) setShowPolicy(true);
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;
        updateUserStatus(user.id, 'online');
        const handleUnload = () => updateUserStatus(user.id, 'offline');
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            handleUnload();
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [isAuthenticated, user?.id]);

    const handleAcceptPolicy = () => {
        localStorage.setItem('slowchat_storage_accepted', 'true');
        setShowPolicy(false);
    };

    console.log('[App] Rendering Root', { isAuthenticated, hasUser: !!user, loading });

    return (
        <div className="h-screen w-screen font-sans bg-[#0B1220] selection:bg-primary/20 relative overflow-hidden text-white">
            <AuroraBackground />

            <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
                {showPolicy && <StoragePolicyModal onAccept={handleAcceptPolicy} />}
                <div className="flex-1 w-full flex flex-col overflow-hidden min-h-full">
                    {isAuthenticated ? (
                        <AuthenticatedSection />
                    ) : (
                        <AuthSection />
                    )}
                </div>
            </div>
        </div>
    );
};

const AuthenticatedSection = () => {
    const { user, logout, joinGroup: joinContext } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'home' | 'direct' | 'groups' | 'friends' | 'inbox' | 'chat' | 'profile'>('home');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isPersonal, setIsPersonal] = useState(false);
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showDiscovery, setShowDiscovery] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);
    const [highlightMessageId, setHighlightMessageId] = useState<string | undefined>(undefined);
    const [followRequestsCount, setFollowRequestsCount] = useState(0);
    const { personalChats } = useInbox();

    console.log('[AuthenticatedSection] Rendering', { user: user?.username, activeTab, myGroupsCount: myGroups.length });

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToGroups((all) => {
            const joined = all.filter(g => user.joinedGroups.includes(g.id));
            setMyGroups(joined);
        });
        return () => unsubscribe();
    }, [user?.joinedGroups]);

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = subscribeToNotifications(user.id, setNotifications);

        // Also subscribe to pending follow requests for the badge
        const unsubRequests = getPendingRequests((reqs) => {
            setFollowRequestsCount(reqs.length);
        });

        return () => {
            unsubscribe();
            unsubRequests();
        };
    }, [user?.id]);

    useEffect(() => {
        if (activeTab === 'inbox' && user?.id) {
            markAllAsRead(user.id);
        }
    }, [activeTab, user?.id]);

    // NEW: Auto-navigation when a personal chat is added (Signal for accepted request)
    const prevChatCount = React.useRef(-1);
    useEffect(() => {
        // Only trigger if we already had a count (not first load) AND it increased
        if (prevChatCount.current !== -1 && personalChats.length > prevChatCount.current) {
            // A new chat appeared! Find it and navigate if it's the latest
            const newChat = personalChats[0]; // Assuming order is desc by timestamp
            if (newChat && activeTab !== 'chat') {
                handleSelectPersonal(newChat.id);
                toast(`Secure connection with ${newChat.usernames?.[Object.keys(newChat.usernames).find(id => id !== user?.id) || ''] || 'User'} established.`, 'success');
            }
        }
        prevChatCount.current = personalChats.length;
    }, [personalChats, activeTab, user?.id]);

    const handleSelectGroup = (id: string) => {
        setActiveId(id);
        setIsPersonal(false);
        setActiveTab('chat');
        if (user?.id) {
            updateActiveChat(user.id, id);
            markAsSeen(id, false, user.id); // Reset count instantly
        }
    };

    const handleSelectPersonal = (chatId: string) => {
        setActiveId(chatId);
        setIsPersonal(true);
        setActiveTab('chat');
        if (user?.id) {
            updateActiveChat(user.id, chatId);
            markAsSeen(chatId, true, user.id); // Reset count instantly
        }
    };

    const activeGroup = !isPersonal ? (myGroups.find(g => g.id === activeId) || null) : null;
    const activePersonalChat = isPersonal ? personalChats.find((c: PersonalChat) => c.id === activeId) : null;
    const otherUserId = activePersonalChat?.userIds.find((id: string) => id !== user?.id);
    const personalChatTitle = isPersonal ? (activePersonalChat?.usernames?.[otherUserId || ''] || 'User') : '';

    // Calculate unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;

    console.log('[App] Rendering AuthenticatedSection', { activeTab, activeId, isAuthenticated: !!user });

    return (
        <AILayout
            activeTab={activeTab === 'chat' ? (isPersonal ? 'friends' : 'home') : (showDiscovery ? 'explore' : activeTab)}
            onTabChange={(tab) => {
                setActiveTab(tab as any);
                setActiveId(null);
                setHighlightMessageId(undefined);
                if (user?.id) updateActiveChat(user.id, null);
                setShowDiscovery(tab === 'explore' || tab === 'groups');
                setShowCreateGroup(false);
            }}
            onOpenSettings={() => { setActiveTab('profile'); setActiveId(null); setHighlightMessageId(undefined); }}
            onGoHome={() => { setActiveTab('home'); setActiveId(null); setShowDiscovery(false); setHighlightMessageId(undefined); }}
            user={user}
            onLogout={() => {
                logout();
            }}
            unreadCount={unreadCount}
            followRequestsCount={followRequestsCount}
        >
            <div className="w-full h-full flex flex-col px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'home' && (
                        <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <HomeView
                                user={user}
                                myGroups={myGroups}
                                onSelectGroup={handleSelectGroup}
                                onBrowseGroups={() => { setActiveTab('groups'); setShowDiscovery(true); }}
                                onCreateGroup={() => { setActiveTab('groups'); setShowCreateGroup(true); }}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'direct' && (
                        <motion.div key="direct" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Messages</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {personalChats.map(chat => {
                                    const otherId = chat.userIds.find(id => id !== user?.id);
                                    const name = chat.usernames?.[otherId || ''] || 'User';

                                    const handleUnfollow = async (e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        if (!confirm(`End chat with ${name}?`)) return;
                                        try {
                                            if (otherId) await unfollowUser(otherId);
                                            toast(`Connection with ${name} ended.`, 'info');
                                        } catch (e) {
                                            toast("Failed to end chat", "error");
                                        }
                                    };

                                    return (
                                        <div key={chat.id} className="relative group">
                                            <button onClick={() => handleSelectPersonal(chat.id)} className="bento-item w-full text-left hover:border-primary transition-all">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary mb-4 transition-transform group-hover:scale-110">{name[0]}</div>
                                                <h3 className="font-bold text-lg">{name}</h3>
                                                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || 'Start a conversation'}</p>
                                            </button>
                                            <button
                                                onClick={handleUnfollow}
                                                className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-destructive hover:text-white"
                                                title="Unfollow"
                                            >
                                                <Icon name="userMinus" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'groups' && (
                        <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 pb-32">
                            <AnimatePresence mode="wait">
                                {showCreateGroup ? (
                                    <motion.div key="create" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                        <CreateGroup
                                            onGroupCreated={(id) => { handleSelectGroup(id); setShowCreateGroup(false); }}
                                            onBack={() => {
                                                setShowCreateGroup(false);
                                                if (!showDiscovery) setActiveTab('home');
                                            }}
                                        />
                                    </motion.div>
                                ) : showDiscovery ? (
                                    <motion.div key="discovery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                                        <GroupDiscovery
                                            onJoinGroup={async (id: string) => {
                                                await joinContext(id);
                                                handleSelectGroup(id);
                                            }}
                                            onSelectGroup={handleSelectGroup}
                                            joinedGroupIds={user?.joinedGroups || []}
                                            onCreateGroup={() => setShowCreateGroup(true)}
                                            onBack={() => {
                                                setShowDiscovery(false);
                                                setActiveTab('home');
                                            }}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
                                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Groups</h2>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setShowDiscovery(!showDiscovery); setShowCreateGroup(false); }}
                                                    className={`h-12 px-6 rounded-xl flex items-center gap-2 font-bold transition-all ${showDiscovery ? 'bg-primary text-white shadow-lg' : 'bg-surface2 hover:bg-surface text-muted-foreground'}`}
                                                >
                                                    <Icon name="compass" className="w-5 h-5" /> Explore
                                                </button>
                                                <button
                                                    onClick={() => { setShowCreateGroup(!showCreateGroup); setShowDiscovery(false); }}
                                                    className={`h-12 px-6 rounded-xl flex items-center gap-2 font-bold transition-all ${showCreateGroup ? 'bg-primary text-white shadow-lg' : 'btn-primary'}`}
                                                >
                                                    <Icon name="plus" className="w-4 h-4" /> New Group
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {myGroups.map(g => (
                                                <button key={g.id} onClick={() => handleSelectGroup(g.id)} className="bento-item text-left group">
                                                    <div className="text-4xl mb-4">{g.image}</div>
                                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{g.name}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Icon name="users" className="w-4 h-4" /> {g.members} Members
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {activeTab === 'friends' && (
                        <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                            <FriendsList onSelectFriend={(friendId) => {
                                if (!user?.id) return;
                                const combinedId = [user.id, friendId].sort().join('_');
                                handleSelectPersonal(combinedId);
                            }} />
                        </motion.div>
                    )}

                    {activeTab === 'inbox' && (
                        <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 pt-12">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Notifications</h2>
                                <button onClick={() => user?.id && markAllAsRead(user.id)} className="text-sm font-bold text-primary hover:underline">Mark all read</button>
                            </div>
                            <NotificationList
                                notifications={notifications}
                                onSelectChat={(id, personal, msgId) => {
                                    if (personal) handleSelectPersonal(id);
                                    else handleSelectGroup(id);
                                    setHighlightMessageId(msgId);
                                }}
                                onMarkAllRead={() => user?.id && markAllAsRead(user.id)}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'chat' && activeId && (
                        <motion.div key="chat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="h-full overflow-hidden">
                            <ChatInterface
                                highlightMessageId={highlightMessageId}
                                chatId={activeId}
                                isPersonal={isPersonal}
                                title={isPersonal ? personalChatTitle : (activeGroup?.name || '')}
                                image={!isPersonal ? activeGroup?.image || '👥' : '👤'}
                                memberCount={!isPersonal ? (activeGroup?.memberCount || activeGroup?.members || 0) : 2}
                                onLeave={() => {
                                    setActiveId(null);
                                    setActiveTab('home');
                                    setIsPersonal(false);
                                    if (user?.id) updateActiveChat(user.id, null);
                                }}
                                onProfileClick={(userId) => setViewingUserId(userId)}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                            <AccountSettings
                                onBack={() => setActiveTab('home')}
                                logout={() => {
                                    logout();
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Global User Profile Modal */}
            <AnimatePresence>
                {viewingUserId && (
                    <UserProfileModal
                        userId={viewingUserId}
                        currentUserId={user?.id || ''}
                        onClose={() => setViewingUserId(null)}
                        onMessage={(targetId: string) => {
                            setViewingUserId(null);
                            const combinedId = [user?.id, targetId].sort().join('_');
                            handleSelectPersonal(combinedId);
                        }}
                    />
                )}
            </AnimatePresence>
        </AILayout>
    );
};

export default function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ToastProvider>
    );
}
