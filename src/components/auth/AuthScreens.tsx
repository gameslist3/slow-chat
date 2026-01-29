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
    <div className="w-full max-w-lg mx-auto p-10 animate-in fade-in duration-1000 relative">
        <div className="text-center mb-16 space-y-8 relative z-10">
            <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-24 h-24 glass-panel rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-5xl shadow-2xl relative"
            >
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <span className="relative z-10">📡</span>
            </motion.div>
            <div className="space-y-3">
                <span className="font-protocol text-[10px] tracking-[0.6em] text-primary uppercase opacity-60">System_Protocol_v3.0</span>
                <h1 className="text-7xl font-black tracking-tighter text-foreground leading-none uppercase italic">SLOWCHAT</h1>
            </div>
            <p className="font-protocol text-xs tracking-[0.2em] text-muted-foreground uppercase opacity-40 max-w-xs mx-auto">Step into a calibrated environment for meaningful connection.</p>
        </div>

        <div className="space-y-6 relative z-10">
            <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full h-20 text-xs font-protocol tracking-[0.4em] uppercase shadow-2xl rounded-[1.5rem]"
                onClick={onSignUp}
            >
                Initiate_Registration
            </motion.button>
            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="glass-panel w-full h-20 text-xs font-protocol tracking-[0.4em] uppercase hover:bg-foreground/5 transition-all rounded-[1.5rem] text-muted-foreground border border-white/5"
                onClick={onSignIn}
            >
                Secure_Log_In
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
                toast("Auth Link Established", "success");
            } else {
                toast("Identity Verification Failed", "error");
            }
        } catch (error: any) {
            toast(error.message || "Protocol Error", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <motion.button
                whileHover={{ x: -4, color: 'var(--primary)' }}
                onClick={onBack}
                className="font-protocol text-[9px] tracking-[0.4em] text-muted-foreground uppercase flex items-center gap-3 mb-12"
            >
                <Icon name="arrowLeft" className="w-3.5 h-3.5" /> Return_To_Nexus
            </motion.button>

            <div className="mb-12">
                <span className="font-protocol text-[9px] tracking-[0.5em] text-primary opacity-50 uppercase">Security_Gateway</span>
                <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic mt-1">Authorized_Access</h1>
                <p className="font-protocol text-[9px] tracking-[0.2em] text-muted-foreground uppercase opacity-40 mt-2">Scan Identity // Establish Transmission Link</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-8">
                <Input
                    label="IDENTITY_EMAIL"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" className="w-4 h-4" />}
                    autoFocus
                    autoComplete="email"
                />

                <div className="relative">
                    <Input
                        label="ACCESS_KEY"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Icon name="lock" className="w-4 h-4" />}
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 bottom-5 text-muted-foreground hover:text-primary transition-colors opacity-30 hover:opacity-100"
                    >
                        {showPassword ? <Icon name="eyeOff" className="w-5 h-5" /> : <Icon name="eye" className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={onForgotPassword} className="font-protocol text-[9px] tracking-[0.2em] text-primary opacity-60 hover:opacity-100 uppercase transition-opacity">Key_Lost?</button>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full h-20 mt-6 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4 shadow-primary/30 font-protocol text-[10px] tracking-[0.4em] uppercase"
                    disabled={loading || !email || !password}
                >
                    {loading ? (
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'ESTABLISH_LINK'}
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
    const [strength, setStrength] = useState({ label: 'NULL', color: 'bg-muted/20', percent: 0 });
    const { toast } = useToast();

    useEffect(() => {
        calculateStrength(password);
    }, [password]);

    const calculateStrength = (pass: string) => {
        if (!pass) {
            setStrength({ label: 'NULL', color: 'bg-muted/20', percent: 0 });
            return;
        }

        let score = 0;
        if (pass.length >= 6) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 1) setStrength({ label: 'WEAK_ENTROPY', color: 'bg-destructive/40', percent: 25 });
        else if (score === 2) setStrength({ label: 'MODERATE_LEVEL', color: 'bg-secondary/40', percent: 50 });
        else if (score === 3) setStrength({ label: 'ROBUST_SHIELD', color: 'bg-secondary', percent: 75 });
        else setStrength({ label: 'MAX_ENCRYPTION', color: 'bg-primary', percent: 100 });
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            toast("Invalid Link Format", "error");
            return;
        }

        if (password.length < 6) {
            toast("Low Entropy Key", "error");
            return;
        }

        setLoading(true);
        try {
            await registerUserStep1({ email, password });
            toast("Cloud_Node_Initialized", "success");
        } catch (error: any) {
            toast(error.message || "Sync Error", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <motion.button
                whileHover={{ x: -4, color: 'var(--primary)' }}
                onClick={onBack}
                className="font-protocol text-[9px] tracking-[0.4em] text-muted-foreground uppercase flex items-center gap-3 mb-10"
            >
                <Icon name="arrowLeft" className="w-3.5 h-3.5" /> Return_To_Nexus
            </motion.button>

            <div className="mb-10">
                <span className="font-protocol text-[9px] tracking-[0.5em] text-primary opacity-50 uppercase">Protocol_Registration</span>
                <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic mt-1">Initialize_Node</h1>
                <p className="font-protocol text-[9px] tracking-[0.2em] text-muted-foreground uppercase opacity-40 mt-2">Generate Identity // Authenticate Transmission Layer</p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-6">
                <Input
                    label="IDENTITY_EMAIL"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" className="w-4 h-4" />}
                    autoFocus
                    autoComplete="email"
                />

                <div className="space-y-3">
                    <div className="relative">
                        <Input
                            label="SECURE_PASSPHRASE"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Icon name="lock" className="w-4 h-4" />}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-6 bottom-5 text-muted-foreground hover:text-primary transition-colors opacity-30 hover:opacity-100"
                        >
                            {showPassword ? <Icon name="eyeOff" className="w-5 h-5" /> : <Icon name="eye" className="w-5 h-5" />}
                        </button>
                    </div>

                    {password && (
                        <div className="px-6 space-y-2">
                            <div className="flex justify-between items-center text-[8px] uppercase font-protocol tracking-[0.3em]">
                                <span className="text-muted-foreground opacity-40">ENTROPY_ANALYSIS</span>
                                <span className={strength.percent <= 25 ? 'text-destructive' : 'text-primary'}>
                                    {strength.label}
                                </span>
                            </div>
                            <div className="h-[2px] w-full bg-foreground/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${strength.percent}%` }}
                                    className={`h-full transition-all duration-700 ${strength.color}`}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-6">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary w-full h-20 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4 font-protocol text-[10px] tracking-[0.4em] uppercase"
                        disabled={loading || !email || password.length < 6}
                    >
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>CREATE_PROTOCOL_LINK <Icon name="arrowRight" className="ml-2 w-4 h-4" /></>
                        )}
                    </motion.button>
                </div>

                <p className="font-protocol text-[8px] text-center text-muted-foreground uppercase tracking-[0.4em] pt-6 opacity-30">
                    By initializing, you accept the mindful communication standard.
                </p>
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
            toast("Link Format Invalid", "error");
            return;
        }
        setSent(true);
        toast("Recovery Sent", "success");
    };

    if (sent) return (
        <div className="w-full max-w-lg mx-auto p-12 text-center animate-in fade-in zoom-in-95 duration-700">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 mx-auto mb-10 flex items-center justify-center glass-panel rounded-[2rem] text-secondary shadow-2xl shadow-secondary/20"
            >
                <Icon name="checkCircle" className="w-10 h-10" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic mb-4">Transmission_Sent</h1>
            <p className="font-protocol text-xs tracking-[0.2em] text-muted-foreground uppercase opacity-40 mb-12">Check <b className="text-primary opacity-100">{email}</b> for recovery steps.</p>
            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="glass-panel w-full h-16 text-xs font-protocol tracking-[0.3em] uppercase rounded-xl text-muted-foreground border border-white/5"
                onClick={onBack}
            >
                Back_To_Auth
            </motion.button>
        </div>
    );

    return (
        <div className="w-full max-w-lg mx-auto p-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <motion.button
                whileHover={{ x: -4, color: 'var(--primary)' }}
                onClick={onBack}
                className="font-protocol text-[9px] tracking-[0.4em] text-muted-foreground uppercase flex items-center gap-3 mb-10 transition-all"
            >
                <Icon name="arrowLeft" className="w-3.5 h-3.5" /> Return_To_Nexus
            </motion.button>

            <div className="mb-10">
                <span className="font-protocol text-[9px] tracking-[0.5em] text-secondary opacity-50 uppercase">Key_Recovery</span>
                <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic mt-1">Access_Reset</h1>
                <p className="font-protocol text-[9px] tracking-[0.2em] text-muted-foreground uppercase opacity-40 mt-2">Initialize Recovery Sequence // Verify Identity</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Input
                    label="REGISTERED_EMAIL"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" className="w-4 h-4" />}
                    autoFocus
                    autoComplete="email"
                />
                <motion.button
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full h-20 shadow-primary/30 font-protocol text-[10px] tracking-[0.4em] uppercase"
                >
                    INIT_RECOVERY
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
        <div className="w-full max-w-lg mx-auto p-10 animate-in zoom-in-95 duration-1000">
            <div className="text-center mb-16 space-y-6">
                <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="text-7xl mb-10 drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] cursor-default select-none"
                >
                    🎭
                </motion.div>
                <span className="font-protocol text-[10px] tracking-[0.6em] text-primary uppercase opacity-60">Identity_Confirmation</span>
                <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none">Arcana_Sync</h1>
                <p className="font-protocol text-xs tracking-[0.2em] text-muted-foreground uppercase opacity-40">Your designation is your digital resonance.</p>
            </div>

            <div className="glass-panel space-y-12 p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden backdrop-blur-2xl shadow-2xl">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

                <div className="text-center space-y-4 relative z-10">
                    <p className="font-protocol text-[9px] font-black text-primary uppercase tracking-[0.5em] opacity-40">IDENT_DESIGNATION</p>
                    <p className="text-5xl font-black tracking-tighter text-foreground leading-none uppercase italic underline decoration-primary/20 decoration-8 underline-offset-8">{name}</p>
                </div>

                <div className="flex gap-6 relative z-10">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="glass-card flex-1 h-16 border border-white/5 rounded-2xl flex items-center justify-center font-protocol text-[9px] tracking-[0.3em] uppercase hover:bg-foreground/5 transition-all text-muted-foreground"
                        onClick={() => setName(generateAnonymousName())}
                    >
                        <Icon name="shuffle" className="mr-3 w-4 h-4" /> Re-Scan
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary flex-[1.5] h-16 text-[10px] font-protocol tracking-[0.4em] shadow-primary/30 uppercase rounded-2xl flex items-center justify-center"
                        onClick={() => { setLoading(true); setTimeout(() => onNameSelected(name), 1500); }}
                    >
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Verify_Link'}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
