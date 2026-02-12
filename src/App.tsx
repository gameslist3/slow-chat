import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { WelcomeScreen, SignInScreen, SignUpScreen, ForgotPasswordScreen, NameScreen } from './components/auth/AuthScreens';
import { StoragePolicyModal } from './components/auth/StoragePolicyModal';
import { GroupDiscovery, CreateGroup } from './components/groups/GroupFeatures';
import { ChatInterface } from './components/chat/ChatFeatures';
import { AccountSettings } from './components/auth/AccountSettings';
import { FollowRequests } from './components/auth/FollowRequests';
import { subscribeToGroups, joinGroup } from './services/firebaseGroupService';
import { Group, User, PersonalChat } from './types';
import { AILayout } from './components/ai-ui/AILayout';
import { Icon } from './components/common/Icon';
import { useInbox } from './hooks/useChat';
import { HomeView } from './components/home/HomeView';
import { CollaborativeBackground } from './components/ui/CollaborativeBackground';
import { updateUserStatus } from './services/firebaseAuthService';
import { FriendsList } from './components/social/FriendsList';
import { NotificationList } from './components/chat/NotificationCenter';
import { subscribeToNotifications, markAllAsRead } from './services/firebaseNotificationService';

const AppContent = () => {
    const { isAuthenticated, user } = useAuth();
    const [showPolicy, setShowPolicy] = useState(false);

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

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 relative">
            <CollaborativeBackground />
            <div className="relative z-10 w-full h-full">
                {showPolicy && <StoragePolicyModal onAccept={handleAcceptPolicy} />}
                {isAuthenticated ? <AuthenticatedSection /> : <AuthSection />}
            </div>
        </div>
    );
};

const AuthSection = () => {
    const { user, completeLogin, loginWithData } = useAuth();
    const [step, setStep] = useState('welcome');

    if (user && !user.username) {
        return <NameScreen onNameSelected={completeLogin} />;
    }

    return (
        <AnimatePresence mode="wait">
            {step === 'welcome' && <WelcomeScreen key="w" onSignIn={() => setStep('signin')} onSignUp={() => setStep('signup')} />}
            {step === 'signin' && <SignInScreen key="si" onBack={() => setStep('welcome')} onSuccess={loginWithData} onForgotPassword={() => setStep('forgot-password')} />}
            {step === 'signup' && <SignUpScreen key="su" onBack={() => setStep('welcome')} onSuccess={loginWithData} />}
            {step === 'forgot-password' && <ForgotPasswordScreen key="fp" onBack={() => setStep('signin')} />}
        </AnimatePresence>
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
    const { personalChats } = useInbox();

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToGroups((all) => {
            const joined = all.filter(g => user.joinedGroups.includes(g.id));
            setMyGroups(joined);
        });
        return () => unsubscribe();
    }, [user?.joinedGroups]);

    useEffect(() => {
        const unsubscribe = subscribeToNotifications(setNotifications);
        return () => unsubscribe();
    }, []);

    const handleSelectGroup = (id: string) => {
        setActiveId(id);
        setIsPersonal(false);
        setActiveTab('chat');
    };

    const handleSelectPersonal = (chatId: string) => {
        setActiveId(chatId);
        setIsPersonal(true);
        setActiveTab('chat');
    };

    const activeGroup = !isPersonal ? (myGroups.find(g => g.id === activeId) || null) : null;
    const activePersonalChat = isPersonal ? personalChats.find((c: PersonalChat) => c.id === activeId) : null;
    const otherUserId = activePersonalChat?.userIds.find((id: string) => id !== user?.id);
    const personalChatTitle = isPersonal ? (activePersonalChat?.usernames?.[otherUserId || ''] || 'User') : '';

    return (
        <AILayout
            activeTab={activeTab === 'chat' ? (isPersonal ? 'direct' : 'groups') : activeTab}
            onTabChange={(tab) => { setActiveTab(tab); setActiveId(null); setShowDiscovery(false); setShowCreateGroup(false); }}
            onOpenSettings={() => { setActiveTab('profile'); setActiveId(null); }}
            onGoHome={() => { setActiveTab('home'); setActiveId(null); }}
            user={user}
            onLogout={logout}
        >
            <div className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto h-full flex flex-col">
                <AnimatePresence mode="wait">
                    {activeTab === 'home' && (
                        <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <HomeView
                                user={user}
                                myGroups={myGroups}
                                onSelectGroup={handleSelectGroup}
                                onBrowseGroups={() => setActiveTab('groups')}
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
                                    return (
                                        <button key={chat.id} onClick={() => handleSelectPersonal(chat.id)} className="bento-item text-left hover:border-primary transition-all">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary mb-4 transition-transform group-hover:scale-110">{name[0]}</div>
                                            <h3 className="font-bold text-lg">{name}</h3>
                                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || 'Start a conversation'}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'groups' && (
                        <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 pb-32">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
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

                            <AnimatePresence mode="wait">
                                {showCreateGroup ? (
                                    <motion.div key="create" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                        <CreateGroup onGroupCreated={(id) => { handleSelectGroup(id); setShowCreateGroup(false); }} />
                                    </motion.div>
                                ) : showDiscovery ? (
                                    <motion.div key="discovery" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                                        <GroupDiscovery onJoinGroup={(id: string) => joinContext(id)} onSelectGroup={handleSelectGroup} joinedGroupIds={user?.joinedGroups || []} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                            <FriendsList onSelectFriend={(id) => handleSelectPersonal(id)} />
                        </motion.div>
                    )}

                    {activeTab === 'inbox' && (
                        <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Notifications</h2>
                                <button onClick={markAllAsRead} className="text-sm font-bold text-primary hover:underline">Mark all read</button>
                            </div>
                            <NotificationList notifications={notifications} onSelectChat={(id, personal) => personal ? handleSelectPersonal(id) : handleSelectGroup(id)} onMarkAllRead={markAllAsRead} />
                        </motion.div>
                    )}

                    {activeTab === 'chat' && activeId && (
                        <motion.div key="chat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="h-full -m-6 md:-m-12 lg:-m-16 overflow-hidden">
                            <ChatInterface
                                chatId={activeId}
                                isPersonal={isPersonal}
                                title={isPersonal ? personalChatTitle : (activeGroup?.name || '')}
                                image={!isPersonal ? activeGroup?.image || '👥' : '👤'}
                                memberCount={!isPersonal ? activeGroup?.members || 0 : 2}
                                onLeave={() => setActiveTab('home')}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                            <AccountSettings onBack={() => setActiveTab('home')} logout={logout} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
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
