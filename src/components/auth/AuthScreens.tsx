import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { validateEmail, registerUserStep1, loginUserWithPassword, generateAnonymousName } from '../../services/firebaseAuthService';
import { useToast } from '../../context/ToastContext';
import Lottie from 'lottie-react';

// --- Welcome Screen ---
export const WelcomeScreen = ({ onSignIn, onSignUp }: { onSignIn: () => void, onSignUp: () => void }) => (
    <div className="w-full max-w-md mx-auto p-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm rotate-3">👋</div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground leading-none uppercase italic">SLOWCHAT</h1>
            <p className="text-muted-foreground font-medium">Step into a calmer way of connecting.</p>
        </div>
        <div className="space-y-4">
            <button className="ui-button-primary w-full h-14 text-lg" onClick={onSignIn}>Sign In</button>
            <button className="ui-button-ghost w-full h-14 text-lg border border-border" onClick={onSignUp}>Create Account</button>
        </div>
    </div>
);

// ... (existing code for SignInScreen)
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
                toast("Welcome back!", "success");
            } else {
                toast("Invalid email or password", "error");
            }
        } catch (error: any) {
            toast(error.message || "Login failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={onBack} className="ui-button-ghost mb-6 -ml-2 text-muted-foreground text-sm flex items-center gap-2">
                <Icon name="arrowLeft" className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-black tracking-tight mb-2">Welcome back</h1>
            <p className="text-muted-foreground mb-8">Sign in to continue your discussions.</p>

            <form onSubmit={handleSignIn} className="space-y-5">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" className="w-4 h-4" />}
                    autoFocus
                    className="ui-input"
                />

                <div className="relative">
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<Icon name="lock" className="w-4 h-4" />}
                        className="ui-input pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 bottom-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <Icon name="eyeOff" className="w-5 h-5" /> : <Icon name="eye" className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={onForgotPassword} className="text-sm text-primary font-bold hover:underline italic">Forgot Password?</button>
                </div>

                <button
                    className="ui-button-primary w-full h-14 mt-4 disabled:opacity-50 flex items-center justify-center gap-3"
                    disabled={loading || !email || !password}
                >
                    {loading ? (
                        <Icon name="rotate" className="w-8 h-8 animate-spin text-white" />
                    ) : 'Sign In'}
                </button>
            </form>
        </div>
    );
};

// --- Unified Sign Up Screen ---
export const SignUpScreen = ({ onBack, onSuccess }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [strength, setStrength] = useState({ label: 'None', color: 'bg-muted', percent: 0 });
    const { toast } = useToast();

    useEffect(() => {
        calculateStrength(password);
    }, [password]);

    const calculateStrength = (pass: string) => {
        if (!pass) {
            setStrength({ label: 'None', color: 'bg-muted', percent: 0 });
            return;
        }

        let score = 0;
        if (pass.length >= 6) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 1) setStrength({ label: 'Weak', color: 'bg-danger', percent: 25 });
        else if (score === 2) setStrength({ label: 'Medium', color: 'bg-warning', percent: 50 });
        else if (score === 3) setStrength({ label: 'Strong', color: 'bg-secondary', percent: 75 });
        else setStrength({ label: 'Excellent', color: 'bg-primary', percent: 100 });
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            toast("Please enter a valid email address.", "error");
            return;
        }

        if (password.length < 6) {
            toast("Password must be at least 6 characters.", "error");
            return;
        }

        setLoading(true);
        try {
            await registerUserStep1({ email, password });
            toast("Account created! Verification email sent.", "success");
            // Successful signup automatically logs in via AuthProvider usually, 
            // but we'll let it trigger name selection if username is missing.
        } catch (error: any) {
            toast(error.message || "Sign up failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={onBack} className="ui-button-ghost mb-6 -ml-2 text-muted-foreground text-sm flex items-center gap-2">
                <Icon name="arrowLeft" className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-black tracking-tight mb-2">Join SlowChat</h1>
            <p className="text-muted-foreground mb-8">Start your journey toward meaningful connection.</p>

            <form onSubmit={handleSignUp} className="space-y-5">
                <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" className="w-4 h-4" />}
                    autoFocus
                    className="ui-input"
                />

                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Icon name="lock" className="w-4 h-4" />}
                            className="ui-input pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 bottom-3 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <Icon name="eyeOff" className="w-5 h-5" /> : <Icon name="eye" className="w-5 h-5" />}
                        </button>
                    </div>

                    {password && (
                        <div className="px-1 space-y-1">
                            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                                <span className="text-muted-foreground">Strength</span>
                                <span className={strength.percent <= 25 ? 'text-danger' : strength.percent <= 50 ? 'text-warning' : 'text-secondary'}>
                                    {strength.label}
                                </span>
                            </div>
                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${strength.color}`}
                                    style={{ width: `${strength.percent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        className="ui-button-primary w-full h-14 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden"
                        disabled={loading || !email || password.length < 6}
                    >
                        {loading ? (
                            <div className="w-10 h-10">
                                <Lottie
                                    path="https://lottie.host/5ad263fd-441f-445a-8b17-73d09a56391a/g4nsc9vN7b.json"
                                    loop={true}
                                />
                            </div>
                        ) : (
                            <>Create Account <Icon name="arrowRight" className="ml-2 w-4 h-4" /></>
                        )}
                    </button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-[0.2em] pt-4">
                    By joining, you agree to our mindful communication values.
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
            toast("Please enter a valid email address.", "error");
            return;
        }
        setSent(true);
        toast("Reset link sent!", "success");
    };

    if (sent) return (
        <div className="w-full max-w-md mx-auto p-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center bg-secondary/10 rounded-full">
                <Icon name="checkCircle" className="w-16 h-16 text-secondary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Check your email</h1>
            <p className="text-muted-foreground mb-8">We sent a reset link to <b className="text-foreground">{email}</b></p>
            <button className="ui-button-ghost w-full" onClick={onBack}>Back to Sign In</button>
        </div>
    );

    return (
        <div className="w-full max-w-md mx-auto p-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={onBack} className="ui-button-ghost mb-6 -ml-2 text-muted-foreground text-sm flex items-center gap-2">
                <Icon name="arrowLeft" className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-black tracking-tight mb-2">Reset Password</h1>
            <p className="text-muted-foreground mb-8">Enter your email and we'll send you a link to reset your password.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Icon name="mail" className="w-4 h-4" />}
                    autoFocus
                    className="ui-input"
                />
                <button className="ui-button-primary w-full h-14">Send Reset Link</button>
            </form>
        </div>
    );
};

// --- Name Screen ---
export const NameScreen = ({ onNameSelected }: { onNameSelected: (name: string) => void }) => {
    const [name, setName] = useState(generateAnonymousName());
    const [loading, setLoading] = useState(false);

    return (
        <div className="w-full max-w-md mx-auto p-4 animate-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
                <div className="text-5xl mb-6 drop-shadow-xl animate-bounce">🎭</div>
                <h1 className="text-4xl font-black tracking-tighter mb-2 italic text-primary">CHOOSE ARCANA</h1>
                <p className="text-muted-foreground font-medium">Your identity is your choice.</p>
            </div>

            <div className="ui-card space-y-8 p-10 border-2">
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Designation</p>
                    <p className="text-4xl font-black tracking-tighter text-foreground leading-none">{name.toUpperCase()}</p>
                </div>

                <div className="flex gap-3">
                    <button
                        className="ui-button-ghost flex-1 h-12 border border-border"
                        onClick={() => setName(generateAnonymousName())}
                    >
                        <Icon name="shuffle" className="mr-2 w-4 h-4" /> Cycle
                    </button>
                    <button
                        className="ui-button-primary flex-[1.5] h-12 text-sm font-black tracking-widest uppercase flex items-center justify-center"
                        onClick={() => { setLoading(true); setTimeout(() => onNameSelected(name), 1500); }}
                    >
                        {loading ? (
                            <Icon name="rotate" className="w-10 h-10 animate-spin text-white" />
                        ) : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};
