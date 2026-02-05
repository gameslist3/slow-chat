import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Logo } from '../common/Logo';
import { Icon } from '../common/Icon';
import { AbstractBackground } from '../ui/AbstractBackground';

interface LandingPageProps {
    onGetStarted: () => void;
    onSignIn: () => void;
}

const FeatureCard = ({ title, description, icon, delay }: { title: string, description: string, icon: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="glass-card p-8 group relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl">{icon}</span>
        </div>
        <div className="relative z-10 space-y-4">
            <h3 className="text-xl font-black tracking-tight text-foreground">{title}</h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
    const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

    return (
        <div ref={containerRef} className="relative w-full min-h-screen bg-background overflow-x-hidden">
            <AbstractBackground />

            {/* --- Navbar --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-8 md:px-12">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Logo className="h-10 w-auto" />
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onSignIn}
                            className="bg-foreground text-background px-6 h-11 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95"
                        >
                            Sign In
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onGetStarted}
                            className="btn-primary rounded-full px-6 h-11 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30"
                        >
                            Create Account
                        </motion.button>
                    </div>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 px-6 overflow-hidden">
                <motion.div
                    style={{ scale, opacity }}
                    className="max-w-4xl mx-auto text-center space-y-10 z-10"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-foreground leading-[0.85] mb-8">
                            REAL <br />
                            <span className="text-primary italic">CONVERSATIONS</span> <br />
                            REAL PEOPLE.
                        </h1>
                        <p className="text-base md:text-xl font-medium text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
                            Gapes is a premium social experience designed for intention, clarity, and deep human connection in the age of noise.
                        </p>
                    </motion.div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onSignIn}
                            className="bg-foreground text-background w-full sm:w-56 h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl"
                        >
                            Sign in
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onGetStarted}
                            className="btn-primary w-full sm:w-56 h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                        >
                            Create account
                        </motion.button>
                    </div>
                </motion.div>

                {/* --- Floating UI Preview --- */}
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
                    className="relative w-full max-w-5xl mt-24 px-4 md:px-0"
                >
                    <div className="glass-panel aspect-video rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] border-white/10 group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                        {/* Mock Chat UI */}
                        <div className="p-8 h-full flex gap-8 opacity-40 group-hover:opacity-100 transition-opacity duration-1000">
                            <div className="w-64 h-full glass-card rounded-[2rem] hidden md:block" />
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="h-20 glass-card rounded-[2rem] flex items-center px-8">
                                    <div className="w-10 h-10 rounded-full bg-primary/20" />
                                    <div className="ml-4 h-4 w-32 bg-foreground/10 rounded-full" />
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="h-12 w-48 bg-primary/20 rounded-2xl" />
                                    <div className="h-12 w-64 bg-foreground/5 rounded-2xl self-end ml-auto" />
                                    <div className="h-12 w-40 bg-primary/20 rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* --- Features Section --- */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto space-y-24">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">A Premium Social Layer</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">Built for the next era of digital interaction.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            title="Futuristic Glass UI"
                            description="A 2026 design standard with deep glassmorphism and smooth multi-layer surfaces."
                            icon="💎"
                            delay={0.1}
                        />
                        <FeatureCard
                            title="Decentralized Intent"
                            description="Real-time syncing across Nexus nodes with focused, intention-based group discovery."
                            icon="🕸️"
                            delay={0.2}
                        />
                        <FeatureCard
                            title="Fluid Interactions"
                            description="Micro-animations and physics-based transitions that make every chat feel alive."
                            icon="✨"
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* --- How it Works --- */}
            <section className="py-32 px-6 bg-foreground/[0.02]">
                <div className="max-w-5xl mx-auto text-center space-y-16">
                    <h2 className="text-4xl font-black tracking-tight text-foreground">How it Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { step: '01', title: 'Join', text: 'Enter the Gapes protocol via email or stealth nexus.' },
                            { step: '02', title: 'Explore', text: 'Discover communities that match your interest and frequency.' },
                            { step: '03', title: 'Connect', text: 'Engage in slow, high-quality human conversations.' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.2 }}
                                className="space-y-4"
                            >
                                <span className="text-6xl font-black text-primary/10 italic leading-none">{item.step}</span>
                                <h4 className="text-xl font-bold">{item.title}</h4>
                                <p className="text-sm text-muted-foreground">{item.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="py-20 px-6 border-t border-border/5">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="space-y-4 text-center md:text-left">
                        <Logo className="h-8 w-auto opacity-50 contrast-0 grayscale mx-auto md:mx-0" />
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-30">© 2026 Gapes Protocol. All rights reserved.</p>
                    </div>
                    <div className="flex gap-8">
                        {['Mirror', 'X (Twitter)', 'Discord', 'Docs'].map(link => (
                            <a key={link} href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                                {link}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};
