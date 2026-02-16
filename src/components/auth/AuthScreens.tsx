import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName } from '../../services/firebaseAuthService';
import { useToast } from '../../context/ToastContext';
import { Logo } from '../common/Logo';

// --- Welcome Screen ---
export const WelcomeScreen = ({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) => (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0B1220] text-white selection:bg-primary/30 font-sans p-6">
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">
            {/* Logo - Increased Size, No Text */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative mb-12"
            >
                <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full animate-pulse" />
                <Logo className="w-48 h-48 text-white relative z-10 drop-shadow-[0_0_40px_rgba(36,58,107,0.5)]" />
            </motion.div>

            {/* Tagline - Looping Animation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mb-16"
            >
                <p className="text-sm font-bold uppercase tracking-[0.4em] text-blue-200/50">
                    Private. Secure. Global.
                </p>
            </motion.div>

            {/* Buttons - Centered & Premium */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-5 w-full max-w-xs items-center"
            >
                <button
                    onClick={onSignIn}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#182B52] to-[#243A6B] text-white font-bold uppercase tracking-widest text-xs border border-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(91,121,183,0.3)] transition-all transform hover:-translate-y-1"
                >
                    Sign In
                </button>
                <button
                    onClick={onSignUp}
                    className="w-full py-4 rounded-xl bg-transparent text-slate-400 font-bold uppercase tracking-widest text-xs border border-white/5 hover:bg-white/5 hover:text-white transition-all"
                >
                    Create Account
                </button>
            </motion.div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-[10px] text-white/10 font-mono uppercase tracking-widest">
            Gapes System v2.1
        </div>
    </div>
); import { TermsModal } from './TermsModal';

// --- Sign In Screen ---
export const SignInScreen = ({ onBack, onSuccess, onForgotPassword }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                className="w-full max-w-md glass-panel p-8 md:p-12 rounded-[2.5rem] relative z-10 border border-white/10 shadow-2xl"
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
                                className="glass-input pl-12 h-14 rounded-2xl bg-[#0B1220]/50 focus:bg-[#0F1C34] border-white/10 focus:border-[#7FA6FF]/50 text-white placeholder-slate-500 transition-all w-full"
                                placeholder="Email"
                            />
                        </div>
                        <div className="relative group">
                            <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="glass-input pl-12 pr-12 h-14 rounded-2xl bg-[#0B1220]/50 focus:bg-[#0F1C34] border-white/10 focus:border-[#7FA6FF]/50 text-white placeholder-slate-500 transition-all w-full"
                                placeholder="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                <Icon name={showPassword ? "eyeOff" : "eye"} className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="button" onClick={onForgotPassword} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors">Forgot Password?</button>
                    </div>

                    <button
                        disabled={loading}
                        className="btn-primary w-full h-14 rounded-xl bg-gradient-to-r from-[#5B79B7] to-[#7FA6FF] text-white font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Enter Gapes'}
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
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) return toast("Invalid email format", "error");
        if (password.length < 8) return toast("Password too short (min 8 chars)", "error");
        if (password !== confirmPassword) return toast("Passwords do not match", "error");
        if (!acceptedTerms) return toast("Please accept the Terms & Conditions", "error");

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
                className="w-full max-w-md glass-panel p-8 md:p-12 rounded-[2.5rem] relative z-10 border border-white/10 shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center gap-6 mb-8">
                    <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors group">
                        <Icon name="arrowLeft" className="w-5 h-5 text-slate-400 group-hover:text-white" />
                    </button>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Join</h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="glass-input pl-12 h-14 rounded-2xl bg-[#0B1220]/50 focus:bg-[#0F1C34] border-white/10 focus:border-[#7FA6FF]/50 text-white placeholder-slate-500 transition-all w-full"
                                placeholder="Email"
                            />
                        </div>
                        <div className="relative group">
                            <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="glass-input pl-12 pr-12 h-14 rounded-2xl bg-[#0B1220]/50 focus:bg-[#0F1C34] border-white/10 focus:border-[#7FA6FF]/50 text-white placeholder-slate-500 transition-all w-full"
                                placeholder="Password (Min 8)"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                <Icon name={showPassword ? "eyeOff" : "eye"} className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative group">
                            <Icon name="checkCircle" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="glass-input pl-12 h-14 rounded-2xl bg-[#0B1220]/50 focus:bg-[#0F1C34] border-white/10 focus:border-[#7FA6FF]/50 text-white placeholder-slate-500 transition-all w-full"
                                placeholder="Confirm Password"
                            />
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-3 px-2">
                        <button
                            type="button"
                            onClick={() => setAcceptedTerms(!acceptedTerms)}
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${acceptedTerms ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600 bg-transparent hover:border-slate-400'}`}
                        >
                            {acceptedTerms && <Icon name="check" className="w-3 h-3" />}
                        </button>
                        <p className="text-[10px] text-slate-400 leading-tight">
                            I accept the <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-400 hover:text-white underline decoration-blue-500/30 hover:decoration-white font-bold transition-all">Terms & Conditions</button> and acknowledge the Privacy Policy.
                        </p>
                    </div>

                    <button
                        disabled={loading}
                        className="btn-primary w-full h-14 rounded-xl bg-gradient-to-r from-[#5B79B7] to-[#7FA6FF] text-white font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-0.5 mt-2"
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
                    </button>
                </form>
            </motion.div>

            <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
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
