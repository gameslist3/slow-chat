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

import { LandingPage } from './components/landing/LandingPage';

import { CollaborativeBackground } from './components/ui/CollaborativeBackground';

import { updateUserStatus } from './services/firebaseAuthService';

const AppContent = () => {
    const { isAuthenticated, user } = useAuth();
    const [showPolicy, setShowPolicy] = useState(false);

    useEffect(() => {
        const accepted = localStorage.getItem('slowchat_storage_accepted');
        if (!accepted) setShowPolicy(true);
    }, []);

    // Presence Heartbeat
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        // Set as online
        updateUserStatus(user.id, 'online');

        const handleUnload = () => {
            updateUserStatus(user.id, 'offline');
        };

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
    const [step, setStep] = useState('landing');

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
            <div className="min-h-screen w-full relative">
                <AnimatePresence mode="wait">
                    {step === 'landing' && (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <LandingPage
                                onGetStarted={() => setStep('signup')}
                                onSignIn={() => setStep('signin')}
                            />
                        </motion.div>
                    )}
                    {(step === 'signin' || step === 'signup' || step === 'welcome' || step === 'forgot-password') && (
                        <motion.div
                            key="auth-form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-3xl p-4"
                        >
                            <div className="w-full max-w-md">
                                {step === 'welcome' && <WelcomeScreen onSignIn={() => setStep('signin')} onSignUp={() => setStep('signup')} />}
                                {step === 'signin' && <SignInScreen onBack={() => setStep('landing')} onSuccess={loginWithData} onForgotPassword={() => setStep('forgot-password')} />}
                                {step === 'signup' && <SignUpScreen onBack={() => setStep('landing')} onSuccess={loginWithData} />}
                                {step === 'forgot-password' && <ForgotPasswordScreen onBack={() => setStep('signin')} />}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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

    const activeGroup = !isPersonal
        ? (myGroups.find(g => g.id === activeId) ||
            // Secondary search if not found in myGroups (e.g. newly joined)
            ({ id: activeId || '', name: 'Loading Connection...', image: '📡', members: 0, category: 'Syncing', memberIds: [], memberCount: 0, createdAt: Date.now(), createdBy: 'system', lastActivity: Date.now(), mutedBy: [] } as unknown as Group))
        : null;

    const activePersonalChat = isPersonal ? personalChats.find((c: PersonalChat) => c.id === activeId) : null;
    const otherUserId = activePersonalChat?.userIds.find((id: string) => id !== user?.id);
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
                <HomeView
                    user={user}
                    myGroups={myGroups}
                    onSelectGroup={handleSelectGroup}
                    onBrowseGroups={() => setView('discovery')}
                />
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

            {view === 'settings' && <AccountSettings onBack={() => setView('home')} logout={logout} />}

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
