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

const AppContent = () => {
    const { isAuthenticated } = useAuth();
    const [showPolicy, setShowPolicy] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem('slowchat_storage_accepted');
        if (!accepted) setShowPolicy(true);
    }, []);

    const handleAcceptPolicy = () => {
        localStorage.setItem('slowchat_storage_accepted', 'true');
        setShowPolicy(false);
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            {showPolicy && <StoragePolicyModal onAccept={handleAcceptPolicy} />}
            {isAuthenticated ? <AuthenticatedSection /> : <AuthSection />}
        </div>
    );
};

const AuthSection = () => {
    const { user, completeLogin, loginWithData } = useAuth();
    const [step, setStep] = useState('welcome');

    if (user && !user.username) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <NameScreen onNameSelected={async (name) => {
                    await completeLogin(name);
                }} />
            </div>
        );
    }

    if (!user?.username) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                    {step === 'welcome' && <WelcomeScreen onSignIn={() => setStep('signin')} onSignUp={() => setStep('signup')} />}
                    {step === 'signin' && <SignInScreen onBack={() => setStep('welcome')} onSuccess={loginWithData} onForgotPassword={() => setStep('forgot-password')} />}
                    {step === 'signup' && <SignUpScreen onBack={() => setStep('welcome')} onSuccess={loginWithData} />}
                    {step === 'forgot-password' && <ForgotPasswordScreen onBack={() => setStep('signin')} />}
                </div>
            </div>
        );
    }
    return null;
};

const AuthenticatedSection = () => {
    const { user, logout, joinGroup: joinContext } = useAuth();
    const { toast } = useToast();
    const [view, setView] = useState<'home' | 'discovery' | 'create' | 'settings' | 'chat' | 'follow-requests'>('home');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeMessageId, setActiveMessageId] = useState<string | undefined>(undefined);
    const [isPersonal, setIsPersonal] = useState(false);
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const { personalChats } = useInbox();

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToGroups((all) => {
            const joined = all.filter(g => user.joinedGroups.includes(g.id));
            setMyGroups(joined);
        });
        return () => unsubscribe();
    }, [user?.joinedGroups]);

    const handleJoin = async (id: string) => {
        if (!user) return;
        try {
            await joinGroup(id, user.id);
            joinContext(id);
            toast("Successfully joined Nexus", "success");
        } catch (error) {
            toast("Failed to initiate sync", "error");
        }
    };

    const handleSelectGroup = (id: string) => {
        setActiveId(id);
        setIsPersonal(false);
        setActiveMessageId(undefined);
        setView('chat');
    };

    const handleSelectPersonal = (chatId: string) => {
        setActiveId(chatId);
        setIsPersonal(true);
        setActiveMessageId(undefined);
        setView('chat');
    };

    const handleSelectNotification = (chatId: string, personal: boolean, messageId?: string) => {
        setActiveId(chatId);
        setIsPersonal(personal);
        setActiveMessageId(messageId);
        setView('chat');
    };

    const activeGroup = !isPersonal ? myGroups.find(g => g.id === activeId) : null;
    const activePersonalChat = isPersonal ? personalChats.find(c => c.id === activeId) : null;
    const otherUserId = activePersonalChat?.userIds.find(id => id !== user?.id);
    const personalChatTitle = isPersonal
        ? (activePersonalChat?.usernames?.[otherUserId || ''] || `Direct Sync ${activeId?.slice(0, 4)}`)
        : '';

    return (
        <AILayout
            userGroups={myGroups}
            activeChatId={activeId}
            isPersonal={isPersonal}
            onSelectGroup={handleSelectGroup}
            onSelectPersonal={handleSelectPersonal}
            onBrowseGroups={() => setView('discovery')}
            onFollowRequests={() => setView('follow-requests')}
            onSelectNotification={handleSelectNotification}
            onCreateGroup={() => setView('create')}
            onOpenSettings={() => setView('settings')}
            onGoHome={() => setView('home')}
            user={user}
            onLogout={logout}
            mobileTitle={isPersonal ? personalChatTitle : (activeGroup?.name || "SlowChat")}
        >
            {view === 'home' && (
                <div className="h-full overflow-y-auto p-4 md:p-8 lg:p-12 space-y-12 animate-in fade-in duration-1000 custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-4 pt-4">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
                            Hello, <span className="text-primary underline decoration-primary/20 decoration-8 underline-offset-8">{user?.username}</span>
                        </h1>
                        <p className="text-base md:text-lg font-medium text-gray-500 max-w-2xl leading-relaxed">
                            Your clusters are synced and ready.
                        </p>
                    </div>

                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {myGroups.length > 0 ? (
                            myGroups.map(g => {
                                const unread = user ? (g.unreadCounts?.[user.id] || 0) : 0;
                                return (
                                    <motion.button
                                        key={g.id}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectGroup(g.id)}
                                        className="glass-panel flex flex-col items-start gap-6 group hover:border-primary/40 transition-all text-left p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden h-64 shadow-xl bg-gradient-to-br from-white/5 to-transparent"
                                    >
                                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12">
                                            <Icon name="message" className="w-16 h-16" />
                                        </div>

                                        <div className="flex-1 w-full flex flex-col justify-between z-10">
                                            <span className="text-6xl group-hover:scale-110 transition-transform duration-500 block">{g.image}</span>

                                            <div className="space-y-2 w-full">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-xl tracking-tight text-foreground line-clamp-1">{g.name}</h3>
                                                    {unread > 0 && (
                                                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                                            {unread}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold uppercase text-primary px-2 py-1 bg-primary/10 rounded-md">{g.category}</span>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400">
                                                        <Icon name="users" className="w-3.5 h-3.5" />
                                                        <span>{g.members}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })
                        ) : (
                            <div className="col-span-full glass-panel border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center py-20 text-center gap-6 rounded-[3rem]">
                                <div className="text-7xl opacity-20 animate-pulse grayscale">📡</div>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold text-foreground">No clusters joined yet</p>
                                    <p className="text-sm font-medium text-gray-500">Explore the network to find your people.</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setView('discovery')}
                                    className="btn-primary rounded-2xl h-14 px-8 text-xs font-bold tracking-widest shadow-xl uppercase mt-4"
                                >
                                    Explore Groups
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'discovery' && (
                <div className="flex-1 overflow-y-auto shrink-0">
                    <GroupDiscovery
                        onJoinGroup={handleJoin}
                        onSelectGroup={handleSelectGroup}
                        joinedGroupIds={user?.joinedGroups || []}
                    />
                </div>
            )}

            {view === 'follow-requests' && (
                <FollowRequests onBack={() => setView('home')} />
            )}

            {view === 'create' && (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl">
                        <CreateGroup onGroupCreated={async (id) => {
                            if (user) {
                                // Redundancy handled in creating group
                                joinContext(id);
                            }
                            handleSelectGroup(id);
                        }} />
                    </div>
                </div>
            )}

            {view === 'settings' && <AccountSettings onBack={() => setView('home')} />}

            {view === 'chat' && activeId && (
                <ChatInterface
                    key={activeId}
                    chatId={activeId}
                    isPersonal={isPersonal}
                    highlightMessageId={activeMessageId}
                    title={isPersonal ? personalChatTitle : (activeGroup?.name || '')}
                    image={!isPersonal ? activeGroup?.image || '👥' : '👤'}
                    memberCount={!isPersonal ? activeGroup?.members || 0 : 2}
                    memberIds={!isPersonal ? activeGroup?.memberIds || [] : []}
                    createdAt={!isPersonal ? activeGroup?.createdAt : undefined}
                    onLeave={() => {
                        setView('home');
                        setActiveId(null);
                    }}
                />
            )}
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
