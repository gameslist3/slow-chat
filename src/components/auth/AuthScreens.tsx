import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName } from '../../services/firebaseAuthService';
import { useToast } from '../../context/ToastContext';
import Lottie from 'lottie-react';

import { motion, AnimatePresence } from 'framer-motion';

// --- Welcome Screen ---
export const WelcomeScreen = ({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) => (
    <div className="w-full h-full flex flex-col justify-center items-center p-6 animate-in fade-in duration-1000">
        <div className="text-center mb-12 space-y-6 max-w-sm">
            <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-24 h-24 glass-panel rounded-3xl flex items-center justify-center mx-auto text-5xl shadow-2xl relative"
            >
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <span className="relative z-10 text-primary">⚡</span>
            </motion.div>
            <div className="space-y-2">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-none">SLOWCHAT</h1>
            </div>
            <p className="text-base font-medium text-gray-400 max-w-xs mx-auto">Connect with intention.</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full h-16 md:h-20 text-[10px] md:text-xs font-black tracking-[0.3em] uppercase shadow-2xl shadow-primary/30 rounded-2.5xl"
                onClick={onSignUp}
            >
                Get Started
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="glass-panel w-full h-16 md:h-20 text-[10px] md:text-xs font-black tracking-[0.3em] uppercase hover:bg-white/5 transition-all rounded-2.5xl text-muted-foreground hover:text-white border border-white/5"
                onClick={onSignIn}
            >
                Protocol Sign In
            </motion.button>
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
                toast("Welcome back", "success");
            } else {
                toast("Invalid credentials", "error");
            }
        } catch (error: any) {
            toast(error.message || "Login failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 md:p-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <button
                onClick={onBack}
                className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors mb-8"
            >
                <Icon name="arrowLeft" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-2">Sign In</h1>
                <p className="text-base font-medium text-gray-400">Welcome back to the flow.</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" />}
                    autoFocus
                    autoComplete="email"
                    placeholder="name@example.com"
                />

                <div className="relative">
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Icon name="lock" />}
                        autoComplete="current-password"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 bottom-4 text-gray-400 hover:text-primary transition-colors"
                    >
                        {showPassword ? <Icon name="eyeOff" className="w-5 h-5" /> : <Icon name="eye" className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={onForgotPassword} className="text-sm font-bold text-primary hover:text-white transition-colors">Forgot Password?</button>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full h-16 mt-4 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 font-bold tracking-widest text-sm uppercase rounded-2xl"
                    disabled={loading || !email || !password}
                >
                    {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Sign In'}
                </motion.button>
            </form>
        </div>
    );
};

// --- Sign Up Screen ---
export const SignUpScreen = ({ onBack, onSuccess }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [strength, setStrength] = useState({ label: '', color: 'bg-muted/20', percent: 0 });
    const { toast } = useToast();

    useEffect(() => {
        calculateStrength(password);
    }, [password]);

    const calculateStrength = (pass: string) => {
        if (!pass) {
            setStrength({ label: '', color: 'bg-muted/20', percent: 0 });
            return;
        }

        let score = 0;
        if (pass.length >= 6) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 1) setStrength({ label: 'Weak', color: 'bg-red-500', percent: 25 });
        else if (score === 2) setStrength({ label: 'Okay', color: 'bg-yellow-500', percent: 50 });
        else if (score === 3) setStrength({ label: 'Good', color: 'bg-blue-400', percent: 75 });
        else setStrength({ label: 'Strong', color: 'bg-green-500', percent: 100 });
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            toast("Invalid email format", "error");
            return;
        }

        if (password.length < 6) {
            toast("Password is too short", "error");
            return;
        }

        setLoading(true);
        try {
            await registerUserStep1({ email, password });
            toast("Account created", "success");
        } catch (error: any) {
            toast(error.message || "Sign up failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-6 md:p-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <button
                onClick={onBack}
                className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors mb-8"
            >
                <Icon name="arrowLeft" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-2">Create Account</h1>
                <p className="text-base font-medium text-gray-400">Join the SlowChat network.</p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-6">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" />}
                    autoFocus
                    autoComplete="email"
                    placeholder="name@example.com"
                />

                <div className="space-y-3">
                    <div className="relative">
                        <Input
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Icon name="lock" />}
                            autoComplete="new-password"
                            placeholder="Min. 6 characters"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 bottom-4 text-gray-400 hover:text-primary transition-colors"
                        >
                            {showPassword ? <Icon name="eyeOff" className="w-5 h-5" /> : <Icon name="eye" className="w-5 h-5" />}
                        </button>
                    </div>

                    {password && (
                        <div className="px-2 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                <span className="text-gray-500">Strength</span>
                                <span className={strength.percent <= 25 ? 'text-red-500' : 'text-primary'}>
                                    {strength.label}
                                </span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${strength.percent}%` }}
                                    className={`h-full transition-all duration-500 ${strength.color}`}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary w-full h-16 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 font-bold tracking-widest text-sm uppercase rounded-2xl"
                        disabled={loading || !email || password.length < 6}
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Create Account'}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

// --- Forgot Password ---
export const ForgotPasswordScreen = ({ onBack }: any) => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) {
            toast("Invalid email format", "error");
            return;
        }
        setSent(true);
        toast("Recovery link sent", "success");
    };

    if (sent) return (
        <div className="w-full max-w-lg mx-auto p-12 text-center animate-in fade-in zoom-in-95 duration-500">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-8 flex items-center justify-center glass-panel rounded-full text-green-400 shadow-xl"
            >
                <Icon name="checkCircle" className="w-10 h-10" />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-foreground mb-4">Check your email</h1>
            <p className="text-base font-medium text-gray-400 mb-10">We sent instructions to <b className="text-foreground">{email}</b>.</p>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-panel w-full h-14 text-sm font-bold tracking-widest uppercase rounded-2xl text-gray-400 hover:text-white border border-white/5"
                onClick={onBack}
            >
                Back to Sign In
            </motion.button>
        </div>
    );

    return (
        <div className="w-full max-w-lg mx-auto p-6 md:p-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <button
                onClick={onBack}
                className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors mb-8"
            >
                <Icon name="arrowLeft" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="mb-10">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-2">Reset Password</h1>
                <p className="text-base font-medium text-gray-400">Enter your email for recovery instructions.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" />}
                    autoFocus
                    autoComplete="email"
                    placeholder="name@example.com"
                />
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full h-16 shadow-lg font-bold tracking-widest text-sm uppercase rounded-2xl mt-4"
                >
                    Send Link
                </motion.button>
            </form>
        </div>
    );
};

// --- Name Screen ---
export const NameScreen = ({ onNameSelected }: { onNameSelected: (name: string) => void }) => {
    const [name, setName] = useState(generateAnonymousName());
    const [loading, setLoading] = useState(false);

    return (
        <div className="w-full max-w-lg mx-auto p-6 md:p-10 animate-in zoom-in-95 duration-500">
            <div className="text-center mb-12 space-y-4">
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="text-6xl mb-8 drop-shadow-2xl cursor-default select-none grayscale hover:grayscale-0 transition-all duration-1000"
                >
                    🎭
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Choose Identity</h1>
                <p className="text-base font-medium text-gray-400">Your digital persona.</p>
            </div>

            <div className="glass-panel space-y-8 p-8 md:p-10 rounded-3xl border border-white/5 relative overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

                <div className="text-center space-y-2 relative z-10">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Randomly Generated</p>
                    <p className="text-3xl md:text-4xl font-black tracking-tighter text-foreground leading-tight">{name}</p>
                </div>

                <div className="flex gap-4 relative z-10 pt-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="glass-card flex-1 h-14 border border-white/5 rounded-2xl flex items-center justify-center font-bold text-xs tracking-widest uppercase hover:bg-white/5 transition-all text-gray-400 hover:text-white gap-2"
                        onClick={() => setName(generateAnonymousName())}
                    >
                        <Icon name="shuffle" className="w-4 h-4" /> Shuffle
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary flex-[1.5] h-14 text-xs font-bold tracking-widest shadow-xl uppercase rounded-2xl flex items-center justify-center"
                        onClick={() => { setLoading(true); setTimeout(() => onNameSelected(name), 1500); }}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Confirm'}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
