import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName } from '../../services/firebaseAuthService';
import { useToast } from '../../context/ToastContext';
import { Logo } from '../common/Logo';

// --- Welcome Screen ---
export const WelcomeScreen = ({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) => (
    <div className="w-full min-h-screen relative overflow-hidden bg-[#020202] text-white selection:bg-primary/30 font-sans">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.15),transparent_70%)]" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 pointer-events-none" />

        {/* Logo: Top 220px, Center, Width 400px (Using smaller visual width but centered in container) */}
        <div className="absolute top-[220px] left-1/2 -translate-x-1/2 w-[400px] flex justify-center z-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
            >
                <Logo className="w-64 h-auto text-primary drop-shadow-2xl" />
            </motion.div>
        </div>

        {/* Tagline: Top 460px */}
        <div className="absolute top-[460px] left-1/2 -translate-x-1/2 z-20 whitespace-nowrap opacity-70">
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.5 }}
                className="text-[14px] font-bold uppercase tracking-[0.8em] text-white"
            >
                Private. Secure. Global.
            </motion.p>
        </div>

        {/* Buttons: Top 640px, Gap 40px */}
        <div className="absolute top-[640px] left-1/2 -translate-x-1/2 flex items-center gap-[40px] z-20">
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={onSignIn}
                className="w-[220px] h-[46px] rounded-full bg-primary text-white font-bold uppercase tracking-widest text-xs hover:brightness-110 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] transition-all shadow-lg shadow-primary/25 flex items-center justify-center"
            >
                Sign In
            </motion.button>
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                onClick={onSignUp}
                className="w-[220px] h-[46px] rounded-full bg-transparent border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 hover:border-white/40 transition-all flex items-center justify-center"
            >
                Create account
            </motion.button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30 text-[10px] uppercase tracking-widest">
            Protocol v2.0.26
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
        <div className="w-full min-h-screen relative bg-[#020202] text-white font-sans overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Logo Top 90px (Matching Register Style) */}
            <div className="absolute top-[90px] left-1/2 -translate-x-1/2 w-[200px] flex justify-center z-20">
                <Logo className="w-24 h-auto text-primary" />
            </div>

            {/* Header Top 200px */}
            <div className="absolute top-[200px] left-1/2 -translate-x-1/2 flex items-center gap-[16px] z-20">
                <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Icon name="arrowLeft" className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-2xl font-bold uppercase tracking-tight">Sign In</h2>
            </div>

            {/* Form Top 330px */}
            <div className="absolute top-[330px] left-1/2 -translate-x-1/2 w-[360px] z-20">
                <form onSubmit={handleSignIn} className="flex flex-col gap-[20px]">
                    <div className="relative group">
                        <Icon name="mail" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full h-[48px] rounded-full bg-white/5 border border-white/10 text-white pl-[50px] pr-6 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                            placeholder="Email Address"
                        />
                    </div>
                    <div className="relative group">
                        <Icon name="key" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full h-[48px] rounded-full bg-white/5 border border-white/10 text-white pl-[50px] pr-6 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                            placeholder="Password"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button type="button" onClick={onForgotPassword} className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Forgot?</button>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-[48px] rounded-full bg-primary text-white font-bold uppercase tracking-widest text-xs mt-[10px] shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Icon name="rotate" className="w-4 h-4 animate-spin" /> : 'Enter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Sign Up Screen ---
export const SignUpScreen = ({ onBack, onSuccess }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) return toast("Format failure", "error");
        if (password.length < 8) return toast("Password too short (min 8 chars)", "error");
        if (password !== confirmPassword) return toast("Passwords do not match", "error");

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
        <div className="w-full min-h-screen relative bg-[#020202] text-white font-sans overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Logo: Top 90px */}
            <div className="absolute top-[90px] left-1/2 -translate-x-1/2 w-[200px] flex justify-center z-20">
                <Logo className="w-24 h-auto text-primary" />
            </div>

            {/* Back + Join: Top 200px, Gap 16px */}
            <div className="absolute top-[200px] left-1/2 -translate-x-1/2 flex items-center gap-[16px] z-20">
                <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Icon name="arrowLeft" className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-2xl font-bold uppercase tracking-tight">Join</h2>
            </div>

            {/* Form: Top 330px, Width 360px */}
            <div className="absolute top-[330px] left-1/2 -translate-x-1/2 w-[360px] z-20">
                <form onSubmit={handleSignUp} className="flex flex-col gap-[20px]">
                    <div className="relative group">
                        <Icon name="mail" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-secondary transition-colors" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full h-[48px] rounded-full bg-white/5 border border-white/10 text-white pl-[50px] pr-6 text-sm focus:outline-none focus:border-secondary/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                            placeholder="Email Address"
                        />
                    </div>
                    <div className="relative group">
                        <Icon name="lock" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-secondary transition-colors" />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full h-[48px] rounded-full bg-white/5 border border-white/10 text-white pl-[50px] pr-6 text-sm focus:outline-none focus:border-secondary/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                            placeholder="Password (Min 8)"
                        />
                    </div>
                    <div className="relative group">
                        <Icon name="checkCircle" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-secondary transition-colors" />
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full h-[48px] rounded-full bg-white/5 border border-white/10 text-white pl-[50px] pr-6 text-sm focus:outline-none focus:border-secondary/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                            placeholder="Confirm Password"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-[48px] rounded-full bg-secondary text-white font-bold uppercase tracking-widest text-xs mt-[20px] shadow-lg shadow-secondary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Icon name="rotate" className="w-4 h-4 animate-spin" /> : 'Create Account'}
                    </button>
                </form>
            </div>
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
