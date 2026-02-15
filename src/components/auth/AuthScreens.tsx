import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName } from '../../services/firebaseAuthService';
import { useToast } from '../../context/ToastContext';
import { Logo } from '../common/Logo';

// --- Welcome Screen ---
export const WelcomeScreen = ({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) => (
    <div className="w-full min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-[#020202] text-white">
        {/* Cinematic Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.15),transparent_70%)]" />
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full opacity-30" />

        {/* Dynamic Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 pointer-events-none" />

        <div className="relative z-10 text-center space-y-16 max-w-lg w-full">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-10"
            >
                <motion.div
                    animate={{
                        y: [0, -10, 0],
                        filter: ["drop-shadow(0 0 30px rgba(var(--primary-rgb), 0.2))", "drop-shadow(0 0 50px rgba(var(--primary-rgb), 0.4))", "drop-shadow(0 0 30px rgba(var(--primary-rgb), 0.2))"]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="relative p-2"
                >
                    <Logo className="w-56 h-56 text-primary drop-shadow-2xl" />
                </motion.div>

                <div className="space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter leading-none"
                    >
                        Gapes<span className="text-primary text-6xl">.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ delay: 0.8 }}
                        className="text-[10px] font-black uppercase tracking-[0.8em] ml-2 text-white/60"
                    >
                        Private. Secure. Global.
                    </motion.p>
                </div>
            </motion.div>

            <div className="w-full grid grid-cols-1 gap-4 px-4">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 }}
                    onClick={onSignIn}
                    className="group relative h-20 rounded-[2.5rem] bg-primary text-white font-black uppercase tracking-[0.3em] text-sm shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <span className="relative flex items-center justify-center gap-4">
                        Sign In <Icon name="arrowRight" className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                </motion.button>

                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 }}
                    onClick={onSignUp}
                    className="h-20 rounded-[2.5rem] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-sm hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-md"
                >
                    Create account
                </motion.button>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 1.5 }}
                className="pt-8"
            >
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Protocol v2.0.26 / Experimental Cluster</p>
            </motion.div>
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-primary/10 blur-[100px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[3rem] border border-white/10 relative z-10 shadow-2xl"
            >
                <button onClick={onBack} className="w-12 h-12 rounded-2xl hover:bg-white/5 flex items-center justify-center mb-8 transition-colors border border-white/5">
                    <Icon name="arrowLeft" className="w-5 h-5 text-white" />
                </button>

                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2 text-white">Sign In</h2>
                <p className="text-[10px] uppercase tracking-widest text-primary font-black mb-10">Private. Secure. Global.</p>

                <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white ml-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="glass-input w-full h-16 rounded-[1.5rem] px-6 bg-white/[0.05] border-white/10 text-white focus:bg-white/[0.08]"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white ml-2">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="glass-input w-full h-16 rounded-[1.5rem] px-6 bg-white/[0.05] border-white/10 text-white focus:bg-white/[0.08]"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={onForgotPassword} className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 hover:text-primary transition-colors">Forgot Key?</button>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-18 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest text-sm mt-6 shadow-xl shadow-primary/20 disabled:opacity-50 hover:shadow-primary/40 transition-all active:scale-95"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
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
        <div className="w-full h-full flex items-center justify-center p-6 bg-[#080808] relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-secondary/10 blur-[100px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[3rem] border border-white/10 relative z-10 shadow-2xl"
            >
                <button onClick={onBack} className="w-12 h-12 rounded-2xl hover:bg-white/5 flex items-center justify-center mb-8 transition-colors border border-white/5">
                    <Icon name="arrowLeft" className="w-5 h-5 text-white" />
                </button>

                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2 text-white">Join</h2>
                <p className="text-[10px] uppercase tracking-widest text-secondary font-black mb-6">Start your journey today</p>

                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white ml-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="glass-input w-full h-14 rounded-2xl px-6 bg-white/[0.05] border-white/10 text-white focus:bg-white/[0.08]"
                            placeholder="you@universe.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white ml-2">Create Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="glass-input w-full h-14 rounded-2xl px-6 bg-white/[0.05] border-white/10 text-white focus:bg-white/[0.08]"
                            placeholder="Min. 8 characters"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white ml-2">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="glass-input w-full h-14 rounded-2xl px-6 bg-white/[0.05] border-white/10 text-white focus:bg-white/[0.08]"
                            placeholder="Match password"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full h-18 rounded-[1.5rem] bg-secondary text-white font-black uppercase tracking-widest text-sm mt-8 shadow-xl shadow-secondary/20 disabled:opacity-50 hover:shadow-secondary/40 transition-all active:scale-95"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
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
