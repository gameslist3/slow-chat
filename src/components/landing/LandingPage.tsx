import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';

export const LandingPage = ({ onGetStarted, onSignIn }: { onGetStarted: () => void, onSignIn: () => void }) => {
    return (
        <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden bg-[#050608]">
            {/* --- Refined Minimalist Background --- */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-primary/20 rounded-full blur-[160px]"
                />
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center space-y-12 md:space-y-20">
                {/* Brand Identifier */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-6"
                >
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 glass-panel rounded-full border border-white/5 shadow-2xl">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                        <span className="text-[10px] font-protocol font-black tracking-[0.4em] uppercase text-primary/80">Nexus Protocol v4.0</span>
                    </div>

                    <h1 className="text-[clamp(2.8rem,11vw,9rem)] font-black tracking-[-0.05em] text-foreground leading-[0.82] uppercase italic selection:bg-primary selection:text-white">
                        SlowChat. <br />
                        <span className="text-primary italic opacity-90">Connected.</span>
                    </h1>
                </motion.div>

                {/* Narrative Layer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1.2 }}
                    className="text-muted-foreground/50 text-base md:text-2xl font-medium max-w-2xl leading-relaxed tracking-tight"
                >
                    A high-fidelity communication environment built for intention and depth.
                    Synchronizing human interaction across the decentralized nexus.
                </motion.p>

                {/* Command Center */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full max-w-xl"
                >
                    <motion.button
                        whileHover={{ scale: 1.05, y: -4, boxShadow: "0 25px 50px -12px rgba(var(--primary-rgb), 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary w-full h-16 md:h-22 text-[10px] md:text-xs font-protocol font-black tracking-[0.4em] uppercase rounded-[2rem]"
                        onClick={onGetStarted}
                    >
                        Initiate Sync
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.95 }}
                        className="glass-panel w-full h-16 md:h-22 text-[10px] md:text-xs font-protocol font-black tracking-[0.4em] uppercase rounded-[2rem] text-muted-foreground hover:text-white border border-white/5 transition-all duration-500"
                        onClick={onSignIn}
                    >
                        Access Hub
                    </motion.button>
                </motion.div>

                {/* Sub-system Status */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 1.5, duration: 3 }}
                    className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 font-protocol text-[8px] md:text-[10px] tracking-[0.4em] uppercase text-muted-foreground"
                >
                    <div className="flex items-center gap-3">
                        <Icon name="users" className="w-4 h-4 opacity-50" />
                        <span>1,248 Nodes Online</span>
                    </div>
                    <div className="hidden md:block w-1 h-1 bg-muted-foreground rounded-full opacity-20" />
                    <div className="flex items-center gap-3">
                        <Icon name="message" className="w-4 h-4 opacity-50" />
                        <span>Decentralized Mesh</span>
                    </div>
                </motion.div>
            </div>

            {/* Aesthetic Overlays */}
            <div className="absolute inset-0 border-[40px] border-white/[0.01] pointer-events-none" />
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-secondary/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        </div>
    );
};
