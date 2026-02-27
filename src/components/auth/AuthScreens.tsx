import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';
import { Check } from 'lucide-react';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName, sendPasswordReset, verifyResetCode, confirmReset } from '../../services/firebaseAuthService';
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
                <Logo className="w-48 md:w-96 h-auto text-white" />
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
        if (!validateEmail(email)) {
            toast("Unreal email protocol detected.", "error");
            return;
        }
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
                <Logo className="w-48 h-auto mb-12 opacity-80" />

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
export const SignUpScreen = ({ onBack }: any) => {
    const [step, setStep] = useState<'form' | 'sent'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleStartSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) return toast("Check your email format.", "error");
        if (password.length < 8) return toast("Password is too short (min 8 chars).", "error");
        if (password !== confirmPassword) return toast("Passwords do not match.", "error");

        setLoading(true);
        try {
            await registerUserStep1({ email, password });
            setStep('sent');
            toast("Verification email sent! Check your inbox.", "success");
        } catch (error: any) {
            toast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[#0B1220] text-white">
            <div className="w-full max-w-md flex flex-col items-center">
                <Logo className="w-48 h-auto mb-12 opacity-80" />

                <AnimatePresence mode="wait">
                    {step === 'form' ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-full"
                        >
                            <div className="flex items-center gap-4 w-full mb-8">
                                <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
                                    <Icon name="arrowLeft" className="w-5 h-5 text-slate-400" />
                                </button>
                                <h2 className="text-xl font-bold">Create Account</h2>
                            </div>

                            <form onSubmit={handleStartSignUp} className="w-full flex flex-col gap-5">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1 px-1">
                                        <div className="relative group">
                                            <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full h-12 pl-12 pr-4 rounded-full bg-[#FFFFFF05] border border-white/10 focus:border-[#5B79B7]/50 text-white placeholder-slate-500 text-sm transition-all"
                                                placeholder="Email Address"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 px-1">
                                        <div className="relative group">
                                            <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full h-12 pl-12 pr-12 rounded-full bg-[#FFFFFF05] border border-white/10 focus:border-[#5B79B7]/50 text-white placeholder-slate-500 text-sm transition-all"
                                                placeholder="Password (min 8 characters)"
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

                                    <div className="flex flex-col gap-1 px-1">
                                        <div className="relative group">
                                            <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                className="w-full h-12 pl-12 pr-12 rounded-full bg-[#FFFFFF05] border border-white/10 focus:border-[#5B79B7]/50 text-white placeholder-slate-500 text-sm transition-all"
                                                placeholder="Confirm Password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    className="w-full h-12 rounded-full bg-[#5B79B7] text-white font-bold shadow-lg transition-all"
                                >
                                    {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sent"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full text-center"
                        >
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-400 text-4xl mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                                📧
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                We sent a secure verification link to:<br />
                                <span className="text-white font-medium">{email}</span><br /><br />
                                Click the link in your email to activate your account.
                            </p>

                            <button
                                onClick={onBack}
                                className="w-full h-12 rounded-full bg-[#5B79B7] text-white font-bold shadow-lg transition-all"
                            >
                                Back to Login
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Forgot Password ---
export const ForgotPasswordScreen = ({ onBack }: any) => {
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) return toast("Format invalid.", "error");

        setLoading(true);
        try {
            await sendPasswordReset(email);
            setSent(true);
            toast("Identity recovery link sent!", "success");
        } catch (error: any) {
            toast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-6 bg-[#0B1220] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[2.5rem] border border-white/5 relative z-10"
            >
                <AnimatePresence mode="wait">
                    {!sent ? (
                        <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="text-center">
                            <div className="w-20 h-20 bg-blue-500/20 rounded-[2rem] flex items-center justify-center text-blue-400 text-4xl mx-auto mb-8 border border-blue-500/20">
                                <Icon name="shield" className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Recovery</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">Enter email for recovery link</p>

                            <form onSubmit={handleSendLink} className="space-y-4">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="glass-input w-full h-14 rounded-2xl px-6 bg-black/20 border-white/5 focus:border-blue-500/50 text-center"
                                    placeholder="identity@example.com"
                                />
                                <button
                                    disabled={loading}
                                    className="btn-primary w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center"
                                >
                                    {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin" /> : 'Send Link'}
                                </button>
                                <button type="button" onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors pt-4">Cancel</button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-400 text-4xl mx-auto mb-8 border border-emerald-500/20">
                                <Icon name="shield" className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Sent</h2>
                            <p className="text-sm text-slate-400 mb-10">We've sent a recovery link to <b>{email}</b>. Please check your inbox and click the link to continue.</p>

                            <button
                                onClick={onBack}
                                className="w-full h-14 rounded-2xl bg-[#5B79B7] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Back to Access
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export const SetNewPasswordScreen = ({ oobCode, onSuccess }: { oobCode: string, onSuccess: () => void }) => {
    const [step, setStep] = useState<'verifying' | 'input' | 'success'>('verifying');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const verify = async () => {
            try {
                const verifiedEmail = await verifyResetCode(oobCode);
                setEmail(verifiedEmail);
                setStep('input');
                toast("Identity verified. Set your new keys.", "success");
            } catch (error: any) {
                toast(error.message, "error");
                setTimeout(onSuccess, 3000);
            }
        };
        verify();
    }, [oobCode]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) return toast("Min 8 characters.", "error");
        if (newPassword !== confirmPassword) return toast("Passwords mismatch.", "error");

        setLoading(true);
        try {
            await confirmReset(oobCode, newPassword);
            setStep('success');
            toast("Identity re-secured.", "success");
        } catch (error: any) {
            toast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-6 bg-[#0B1220] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[2.5rem] border border-white/5 relative z-10"
            >
                <AnimatePresence mode="wait">
                    {step === 'verifying' && (
                        <motion.div key="verifying" className="text-center">
                            <Icon name="rotate" className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-white">Verifying Link</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Connecting to secure authentication layer...</p>
                        </motion.div>
                    )}

                    {step === 'input' && (
                        <motion.div key="input" className="text-center">
                            <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center text-primary text-4xl mx-auto mb-8 border border-primary/20">
                                <Icon name="lock" className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Secure</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">Setting new identity keys for<br /><b>{email}</b></p>

                            <form onSubmit={handleUpdate} className="space-y-4">
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="glass-input w-full h-14 rounded-2xl px-6 bg-black/20 border-white/5 focus:border-primary/50 text-center"
                                    placeholder="New Password"
                                />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="glass-input w-full h-14 rounded-2xl px-6 bg-black/20 border-white/5 focus:border-primary/50 text-center"
                                    placeholder="Confirm Password"
                                />
                                <button
                                    disabled={loading}
                                    className="btn-primary w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center"
                                >
                                    {loading ? <Icon name="rotate" className="w-5 h-5 animate-spin" /> : 'Update Key'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-[2.5rem] flex items-center justify-center text-emerald-400 text-5xl mx-auto mb-8 border border-emerald-500/20">
                                <Check className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">Restored</h2>
                            <p className="text-sm text-slate-400 mb-10">Your digital identity has been re-secured. You can now access your profile.</p>

                            <button
                                onClick={onSuccess}
                                className="w-full h-14 rounded-2xl bg-[#5B79B7] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Back to Access
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-10">Select your digital name</p>

                <div className="bg-black/20 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80 block mb-2">Protocol Name</span>
                    <p className="text-2xl font-black italic tracking-tighter truncate text-white">{name}</p>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setName(generateAnonymousName())} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all group">
                        <Icon name="rotate" className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
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
// --- Verification Pending Screen ---
import { useAuth } from '../../context/AuthContext';
import { cancelRegistration, resendVerificationEmail } from '../../services/firebaseAuthService';

export const VerificationPendingScreen = ({ onLogout }: { onLogout: () => void }) => {
    const { checkVerificationStatus } = useAuth();
    const [resendCount, setResendCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // The polling in AuthContext handles the realtime verification check.

    const handleResend = async () => {
        if (resendCount >= 2) return;
        setLoading(true);
        try {
            await resendVerificationEmail();
            setResendCount(prev => prev + 1);
            toast("Verification email resent.", "success");
        } catch (err: any) {
            toast(err.message || "Failed to resend email", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel registration? This will delete your account.")) return;
        setLoading(true);
        try {
            await cancelRegistration();
            onLogout(); // Clear local state
            toast("Registration cancelled.", "info");
        } catch (err: any) {
            toast(err.message || "Cancel failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-6 bg-[#0B1220] relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm glass-panel p-10 rounded-[3rem] border border-white/5 relative z-10 text-center"
            >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-400 text-4xl mx-auto mb-8 border border-emerald-500/20 shadow-lg shadow-emerald-500/20">
                    📧
                </div>

                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-white">Verify Email</h2>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-10">Access Restricted</p>

                <div className="bg-black/20 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-md">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        We've sent a verification link to your email. Please click it to activate your identity.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleResend}
                        disabled={loading || resendCount >= 2}
                        className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading && resendCount < 2 ? <Icon name="rotate" className="w-5 h-5 animate-spin mx-auto" /> : (resendCount >= 2 ? 'Limit Reached' : 'Send Again')}
                    </button>

                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="w-full h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase tracking-widest text-xs hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-2">
                        Polling for identity confirmation...
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
