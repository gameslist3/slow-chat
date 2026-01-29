import React, { useState, useEffect } from 'react';
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
            user={user}
            onLogout={logout}
            mobileTitle={isPersonal ? personalChatTitle : (activeGroup?.name || "SlowChat")}
        >
            {view === 'home' && (
                <div className="h-full overflow-y-auto p-6 md:p-12 space-y-12 animate-in fade-in duration-700">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <h1 className="text-6xl font-black tracking-tighter text-foreground leading-tight uppercase italic">
                            Welcome back, <span className="text-primary underline decoration-primary/20 decoration-8">{user?.username?.toUpperCase()}</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium max-w-2xl italic">
                            Stay connected and organized with your groups at your own pace.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        {myGroups.length > 0 ? (
                            myGroups.map(g => {
                                const unread = user ? (g.unreadCounts?.[user.id] || 0) : 0;
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => handleSelectGroup(g.id)}
                                        className="ui-panel flex items-start gap-8 group hover:border-primary/50 transition-all text-left p-8 rounded-[40px] border-2 relative overflow-hidden"
                                    >
                                        <span className="text-6xl group-hover:scale-125 transition-transform duration-500 block">{g.image}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-black text-2xl uppercase tracking-tight">{g.name}</h3>
                                                {unread > 0 && <span className="bg-primary text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-primary/20 animate-bounce">{unread}</span>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="ui-badge lowercase font-black bg-primary/10 text-primary border-primary/20">{g.category}</div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest opacity-40">
                                                    <Icon name="users" className="w-4 h-4" />
                                                    <span>{g.members} Members</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="col-span-full ui-card border-dashed bg-transparent flex flex-col items-center justify-center py-20 text-center gap-6 rounded-[40px]">
                                <div className="text-6xl opacity-20">💬</div>
                                <p className="text-muted-foreground font-black uppercase tracking-[0.2em] italic">No groups joined yet</p>
                                <button onClick={() => setView('discovery')} className="ui-button-primary rounded-full h-14 px-8 text-sm font-black uppercase tracking-widest">Discover Groups</button>
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
