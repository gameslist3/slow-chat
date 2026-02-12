import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName } from '../../services/firebaseAuthService';
import { useToast } from '../../context/ToastContext';
import { Logo } from '../common/Logo';

// --- Welcome Screen ---
export const WelcomeScreen = ({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) => (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 relative overflow-hidden bg-[#080808]">
        {/* Immersive Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full opacity-30 animate-pulse" />
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full opacity-20" />

        <div className="relative z-10 text-center space-y-8 max-w-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-24 h-24 mx-auto rounded-3xl bg-primary flex items-center justify-center shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)]"
            >
                <Logo className="w-12 h-12 text-white" />
            </motion.div>

            <div className="space-y-4">
                <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">SlowChat</h1>
                <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-[0.3em]">Campaign Node v1.0</p>
            </div>

            <div className="w-full space-y-4 pt-8">
                <button
                    onClick={onSignUp}
                    className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Initialize Connection
                </button>
                <button
                    onClick={onSignIn}
                    className="w-full h-16 rounded-2xl bg-white/5 border border-white/5 text-muted-foreground font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:text-white transition-all"
                >
                    Restore Link
                </button>
            </div>
        </div>
    </div>
);

// --- Sign In Screen ---
export const SignInScreen = ({ onBack, onSuccess, onForgotPassword }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await loginUserWithPassword({ email, password });
            if (user) {
                onSuccess(user);
                toast("Link established", "success");
            }
        } catch (error: any) {
            toast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-[#080808] relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-primary/5 blur-[100px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[2.5rem] border border-white/5 relative z-10"
            >
                <button onClick={onBack} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center mb-8 transition-colors">
                    <Icon name="arrowLeft" className="w-5 h-5 text-muted-foreground" />
                </button>

                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Sign In</h2>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-black mb-8">Access Authorized Node</p>

                <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="glass-input w-full h-14 rounded-2xl px-6 bg-white/2"
                            placeholder="admin@slowchat.net"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Access Key</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="glass-input w-full h-14 rounded-2xl px-6 bg-white/2"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={onForgotPassword} className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">Emergency Reset</button>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs mt-6 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Establish Link'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

// --- Sign Up Screen ---
export const SignUpScreen = ({ onBack, onSuccess }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) return toast("Format failure", "error");
        setLoading(true);
        try {
            await registerUserStep1({ email, password });
            toast("Identity created", "success");
        } catch (error: any) {
            toast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-[#080808] relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-secondary/5 blur-[100px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[2.5rem] border border-white/5 relative z-10"
            >
                <button onClick={onBack} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center mb-8 transition-colors">
                    <Icon name="arrowLeft" className="w-5 h-5 text-muted-foreground" />
                </button>

                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Register</h2>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-black mb-8">Initialize Identity Protocol</p>

                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="glass-input w-full h-14 rounded-2xl px-6 bg-white/2"
                            placeholder="user@protocol.io"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="glass-input w-full h-14 rounded-2xl px-6 bg-white/2"
                            placeholder="Min. 6 characters"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-16 rounded-2xl bg-secondary text-white font-black uppercase tracking-widest text-xs mt-8 shadow-lg shadow-secondary/20 disabled:opacity-50"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Protocol'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

// --- Forgot Password ---
export const ForgotPasswordScreen = ({ onBack }: any) => {
    const [email, setEmail] = useState('');
    const { toast } = useToast();

    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-[#080808]">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[2.5rem] border border-white/5 text-center"
            >
                <Icon name="shield" className="w-16 h-16 text-primary mx-auto mb-8 opacity-40" />
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Reset</h2>
                <p className="text-xs font-bold text-muted-foreground/60 leading-relaxed mb-8">Enter your credential node email to receive recovery parameters.</p>

                <div className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="glass-input w-full h-14 rounded-2xl px-6 bg-white/2"
                        placeholder="identity@node.com"
                    />
                    <button className="btn-primary w-full h-16 rounded-2xl text-xs font-black uppercase tracking-widest">Send Link</button>
                    <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-white transition-colors pt-4">Abort Reset</button>
                </div>
            </motion.div>
        </div>
    );
};

// --- Name Screen ---
export const NameScreen = ({ onNameSelected }: { onNameSelected: (name: string) => void }) => {
    const [name, setName] = useState(generateAnonymousName());
    const [loading, setLoading] = useState(false);

    const handleConfirm = () => {
        setLoading(true);
        setTimeout(() => onNameSelected(name), 1000);
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-[#080808] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[3rem] border border-white/5 relative z-10 text-center"
            >
                <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary text-4xl mx-auto mb-8 border border-primary/20">
                    🎭
                </div>

                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Choose Identity</h2>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-black mb-10">Select your digital signature</p>

                <div className="bg-white/2 border border-white/5 rounded-2xl p-6 mb-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-2">Protocol Output</span>
                    <p className="text-2xl font-black italic tracking-tighter truncate">{name}</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setName(generateAnonymousName())} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                        <Icon name="shuffle" className="w-6 h-6 text-muted-foreground" />
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {loading ? <Icon name="rotate" className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Identity'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
