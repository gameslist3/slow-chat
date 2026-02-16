import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName } from '../../services/firebaseAuthService';
import { useToast } from '../../context/ToastContext';
import { Logo } from '../common/Logo';

// --- Welcome Screen ---
export const WelcomeScreen = ({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) => (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0B1220] text-white selection:bg-primary/30 font-sans p-6">

        <div className="relative z-10 flex flex-col items-center text-center space-y-12 max-w-lg w-full">
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="flex flex-col items-center"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/30 blur-[60px] rounded-full" />
                    <Logo className="w-48 h-auto text-white relative z-10 drop-shadow-2xl" />
                </div>
            </motion.div>

            {/* Tagline */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
            >
                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-br from-white to-blue-200 bg-clip-text text-transparent">
                    GAPES
                </h1>
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-200/60">
                    Private. Secure. Global.
                </p>
            </motion.div>

            {/* Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row items-center gap-6 w-full pt-8"
            >
                <button
                    onClick={onSignIn}
                    className="btn-primary w-full sm:w-auto px-12 py-4 text-sm tracking-widest uppercase hover:scale-105"
                >
                    Sign In
                </button>
                <button
                    onClick={onSignUp}
                    className="btn-ghost w-full sm:w-auto px-10 py-4 text-xs font-bold tracking-widest uppercase border border-white/10 hover:bg-white/5 hover:border-white/30"
                >
                    Create Account
                </button>
            </motion.div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-[10px] items-center text-white/20 font-mono uppercase tracking-widest">
            Protocol v2.1.0 • Gapes System
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
                toast("Welcome back to Gapes", "success");
            }
        } catch (error: any) {
            toast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-6 relative bg-[#0B1220] overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-panel p-8 md:p-12 rounded-[2.5rem] relative z-10"
            >
                {/* Header */}
                <div className="flex items-center gap-6 mb-10">
                    <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors group">
                        <Icon name="arrowLeft" className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Sign In</h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSignIn} className="flex flex-col gap-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="glass-input pl-12 h-14 rounded-2xl bg-black/20 focus:bg-black/40 border-white/5 focus:border-blue-500/50"
                                placeholder="Email Address"
                            />
                        </div>
                        <div className="relative group">
                            <Icon name="key" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="glass-input pl-12 h-14 rounded-2xl bg-black/20 focus:bg-black/40 border-white/5 focus:border-blue-500/50"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="button" onClick={onForgotPassword} className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors">Forgot Password?</button>
                    </div>

                    <button
                        disabled={loading}
                        className="btn-primary w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin" /> : 'Enter Gapes'}
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
        if (!validateEmail(email)) return toast("Invalid email format", "error");
        if (password.length < 8) return toast("Password too short (min 8 chars)", "error");
        if (password !== confirmPassword) return toast("Passwords do not match", "error");

        setLoading(true);
        try {
            await registerUserStep1({ email, password });
            toast("Account created successfully", "success");
        } catch (error: any) {
            toast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-6 relative bg-[#0B1220] overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-panel p-8 md:p-12 rounded-[2.5rem] relative z-10"
            >
                {/* Header */}
                <div className="flex items-center gap-6 mb-10">
                    <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors group">
                        <Icon name="arrowLeft" className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Join</h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSignUp} className="flex flex-col gap-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="glass-input pl-12 h-14 rounded-2xl bg-black/20 focus:bg-black/40 border-white/5 focus:border-blue-500/50"
                                placeholder="Email Address"
                            />
                        </div>
                        <div className="relative group">
                            <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="glass-input pl-12 h-14 rounded-2xl bg-black/20 focus:bg-black/40 border-white/5 focus:border-blue-500/50"
                                placeholder="Password (Min 8)"
                            />
                        </div>
                        <div className="relative group">
                            <Icon name="checkCircle" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="glass-input pl-12 h-14 rounded-2xl bg-black/20 focus:bg-black/40 border-white/5 focus:border-blue-500/50"
                                placeholder="Confirm Password"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="btn-primary w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 mt-4"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin" /> : 'Create Account'}
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
        <div className="w-full min-h-screen flex items-center justify-center p-6 bg-[#0B1220]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[2.5rem] border border-white/5 text-center"
            >
                <Icon name="shield" className="w-16 h-16 text-blue-500/50 mx-auto mb-8" />
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Reset</h2>
                <p className="text-xs font-bold text-slate-400 leading-relaxed mb-8">Enter your registered email to receive recovery instructions.</p>

                <div className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="glass-input w-full h-14 rounded-2xl px-6 bg-black/20 border-white/5 focus:border-blue-500/50 text-center"
                        placeholder="identity@example.com"
                    />
                    <button className="btn-primary w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Send Link</button>
                    <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors pt-4">Cancel</button>
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
        <div className="w-full min-h-screen flex items-center justify-center p-6 bg-[#0B1220] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[3rem] border border-white/5 relative z-10 text-center"
            >
                <div className="w-20 h-20 bg-blue-500/20 rounded-[2rem] flex items-center justify-center text-blue-400 text-4xl mx-auto mb-8 border border-blue-500/20 shadow-lg shadow-blue-500/20">
                    🎭
                </div>

                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-white">Identity</h2>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-10">Select your digital alias</p>

                <div className="bg-black/20 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 block mb-2">Protocol Alias</span>
                    <p className="text-2xl font-black italic tracking-tighter truncate text-white">{name}</p>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setName(generateAnonymousName())} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all group">
                        <Icon name="shuffle" className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 h-14 rounded-2xl btn-primary text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
