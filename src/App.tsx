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
                <div className="h-full overflow-y-auto p-8 md:p-16 space-y-16 animate-in fade-in duration-1000 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <span className="font-protocol text-[10px] tracking-[0.6em] text-primary uppercase opacity-60">System_Initialization_Success</span>
                        <h1 className="text-6xl font-black tracking-tighter text-foreground leading-tight uppercase italic">
                            Welcome, <span className="text-primary underline decoration-primary/20 decoration-8 underline-offset-8">{user?.username?.toUpperCase()}</span>
                        </h1>
                        <p className="font-protocol text-xs tracking-[0.2em] text-muted-foreground max-w-2xl uppercase opacity-40 leading-relaxed">
                            Connection established // Local node synchronized // All systems operational.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                        {myGroups.length > 0 ? (
                            myGroups.map(g => {
                                const unread = user ? (g.unreadCounts?.[user.id] || 0) : 0;
                                return (
                                    <motion.button
                                        key={g.id}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectGroup(g.id)}
                                        className="glass-panel flex items-start gap-8 group hover:border-primary/40 transition-all text-left p-10 rounded-[3rem] border border-white/5 relative overflow-hidden h-full shadow-2xl"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Icon name="message" className="w-24 h-24 rotate-12" />
                                        </div>

                                        <span className="text-7xl group-hover:scale-110 transition-transform duration-700 block relative z-10">{g.image}</span>
                                        <div className="flex-1 relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-black text-2xl uppercase tracking-tight italic text-foreground/90">{g.name}</h3>
                                                {unread > 0 && (
                                                    <motion.span
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full shadow-xl shadow-primary/40"
                                                    >
                                                        {unread}
                                                    </motion.span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="font-protocol text-[9px] tracking-[0.3em] uppercase text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">{g.category}</div>
                                                <div className="flex items-center gap-2 text-[9px] font-protocol uppercase tracking-[0.2em] opacity-40">
                                                    <Icon name="users" className="w-3.5 h-3.5" />
                                                    <span>{g.members}_Nodes</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })
                        ) : (
                            <div className="col-span-full glass-panel border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center py-32 text-center gap-10 rounded-[3.5rem]">
                                <div className="text-8xl opacity-10 animate-pulse">📡</div>
                                <div className="space-y-3">
                                    <p className="font-protocol text-[10px] uppercase tracking-[0.5em] text-primary opacity-40">Cluster_Search_Initiated</p>
                                    <p className="text-2xl font-black text-foreground uppercase tracking-tight italic">No clusters joined yet</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05, y: -4 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setView('discovery')}
                                    className="btn-primary rounded-[2rem] h-20 px-12 text-[11px] font-protocol tracking-[0.4em] shadow-2xl uppercase"
                                >
                                    Scan For Clusters
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
