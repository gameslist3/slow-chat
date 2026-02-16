import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName } from '../../services/firebaseAuthService';
import { useToast } from '../../context/ToastContext';
import { Logo } from '../common/Logo';
import { TermsModal } from './TermsModal';

// --- Welcome Screen ---
export const WelcomeScreen = ({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) => (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0B1220] text-white p-6">
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-lg">
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="mb-8"
            >
                <Logo className="w-64 h-auto text-white" />
            </motion.div>

            {/* Tagline */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-16"
            >
                <p className="text-xs font-medium tracking-widest text-slate-400">
                    Private. Secure. Global.
                </p>
            </motion.div>

            {/* Buttons Row */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-12"
            >
                <button
                    onClick={onSignIn}
                    className="px-12 py-3 rounded-full bg-[#5B79B7] text-white text-sm font-semibold shadow-[0_0_20px_rgba(91,121,183,0.4)] hover:shadow-[0_0_30px_rgba(91,121,183,0.6)] transition-all"
                >
                    Sign in
                </button>
                <button
                    onClick={onSignUp}
                    className="text-[#E6ECFF] text-sm font-semibold hover:text-white transition-colors"
                >
                    Create account
                </button>
            </motion.div>
        </div>
    </div>
);

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
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[#0B1220] text-white">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Logo top */}
                <Logo className="w-32 h-auto mb-12 opacity-80" />

                {/* Sign In Header */}
                <div className="flex items-center gap-4 w-full mb-8">
                    <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
                        <Icon name="arrowLeft" className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">Sign in</h2>
                        <span className="text-slate-500 font-medium">Welcome back to Gapes</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSignIn} className="w-full flex flex-col gap-5">
                    <div className="space-y-4">
                        {/* Email Address */}
                        <div className="flex flex-col gap-1 px-1">
                            {email && <span className="text-[10px] text-slate-400 font-medium ml-1">Email Address</span>}
                            <div className="relative group">
                                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-full bg-[#FFFFFF05] border border-white/10 focus:border-[#5B79B7]/50 text-white placeholder-slate-500 text-sm transition-all"
                                    placeholder={email ? "" : "Email Address"}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1 px-1">
                            {password && <span className="text-[10px] text-slate-400 font-medium ml-1">Password</span>}
                            <div className="relative group">
                                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full h-12 pl-12 pr-12 rounded-full bg-[#FFFFFF05] border border-white/10 focus:border-[#5B79B7]/50 text-white placeholder-slate-500 text-sm transition-all"
                                    placeholder={password ? "" : "Password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <Icon name={showPassword ? "eyeOff" : "eye"} className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end px-4">
                        <button type="button" onClick={onForgotPassword} className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors">Forgot Password?</button>
                    </div>

                    <button
                        disabled={loading}
                        className={`w-full h-12 rounded-full text-sm font-bold transition-all transition-all duration-300
                            ${email && password
                                ? 'bg-[#5B79B7] text-white shadow-[0_0_15px_rgba(91,121,183,0.4)]'
                                : 'bg-[#FFFFFF0A] border border-white/10 text-slate-500'}
                        `}
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Sign in'}
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
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[#0B1220] text-white">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Logo top */}
                <Logo className="w-32 h-auto mb-12 opacity-80" />

                {/* Join Header */}
                <div className="flex items-center gap-4 w-full mb-8">
                    <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
                        <Icon name="arrowLeft" className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">Join</h2>
                        <span className="text-slate-500 font-medium">Start your journey today</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSignUp} className="w-full flex flex-col gap-5">
                    <div className="space-y-4">
                        {/* Email Address */}
                        <div className="flex flex-col gap-1 px-1">
                            {email && <span className="text-[10px] text-slate-400 font-medium ml-1">Email Address</span>}
                            <div className="relative group">
                                <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full h-12 pl-12 pr-4 rounded-full bg-[#FFFFFF05] border border-white/10 focus:border-[#5B79B7]/50 text-white placeholder-slate-500 text-sm transition-all"
                                    placeholder={email ? "" : "Email Address"}
                                />
                            </div>
                        </div>

                        {/* Create Password */}
                        <div className="flex flex-col gap-1 px-1">
                            {password && <span className="text-[10px] text-slate-400 font-medium ml-1">Create Password</span>}
                            <div className="relative group">
                                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full h-12 pl-12 pr-12 rounded-full bg-[#FFFFFF05] border border-white/10 focus:border-[#5B79B7]/50 text-white placeholder-slate-500 text-sm transition-all"
                                    placeholder={password ? "" : "Create Password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <Icon name={showPassword ? "eyeOff" : "eye"} className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="flex flex-col gap-1 px-1">
                            {confirmPassword && <span className="text-[10px] text-slate-400 font-medium ml-1">Confirm Password</span>}
                            <div className="relative group">
                                <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full h-12 pl-12 pr-12 rounded-full bg-[#FFFFFF05] border border-white/10 focus:border-[#5B79B7]/50 text-white placeholder-slate-500 text-sm transition-all"
                                    placeholder={confirmPassword ? "" : "Confirm Password"}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className={`w-full h-12 rounded-full text-sm font-bold transition-all transition-all duration-300 mt-2
                            ${email && password && confirmPassword
                                ? 'bg-[#5B79B7] text-white shadow-[0_0_15px_rgba(91,121,183,0.4)]'
                                : 'bg-[#FFFFFF0A] border border-white/10 text-slate-500'}
                        `}
                    >
                        {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Create account'}
                    </button>
                </form>

                {/* Terms link */}
                <button type="button" onClick={() => setShowTermsModal(true)} className="mt-8 text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
                    Terms & Conditions
                </button>
            </div>

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
