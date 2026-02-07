import logoLight from "../../assets/Gapes.png";
import logoDark from "../../assets/Gapes-blue.png";
import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Icon } from '../common/Icon';
import logoLight from '../../assets/logo-light.png';
import logoDark from '../../assets/logo-dark.png';
export const LandingPage = ({ onGetStarted, onSignIn }: { onGetStarted: () => void, onSignIn: () => void }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const x = clientX / innerWidth;
        const y = clientY / innerHeight;
        mouseX.set(x);
        mouseY.set(y);
    };

    const springConfig = { damping: 25, stiffness: 150 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    const moveX = useTransform(x, [0, 1], [-50, 50]);
    const moveY = useTransform(y, [0, 1], [-50, 50]);
    const glowX = useTransform(x, [0, 1], ['0%', '100%']);
    const glowY = useTransform(y, [0, 1], ['0%', '100%']);

    return (
        <div
            className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
            onMouseMove={handleMouseMove}
        >
            {/* --- Global Background is handled in App.tsx --- */}

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center space-y-12 md:space-y-16 group">
                {/* Brand Identifier */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-8 flex flex-col items-center"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 mb-4 relative"
                    >
                        <img src={logoLight} alt="Gapes Logo" className="w-full h-full object-contain drop-shadow-2xl dark:hidden block" />
                        <img src={logoDark} alt="Gapes Logo" className="w-full h-full object-contain drop-shadow-2xl hidden dark:block" />
                    </motion.div>

                    <h1 className="text-[clamp(3.5rem,13vw,10rem)] font-black tracking-tighter text-foreground leading-[0.85] select-none opacity-30 group-hover:opacity-100 transition-opacity duration-700">
                        Gapes.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary opacity-80">
                            Connected.
                        </span>
                    </h1>
                </motion.div>

                {/* Narrative Layer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1.2 }}
                    className="text-muted-foreground/60 text-lg md:text-2xl font-medium max-w-xl leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100"
                >
                    Experience the next generation of social interaction.
                    Simple, fast, and beautifully designed.
                </motion.p>

                {/* Command Center */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200"
                >
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary w-full h-16 md:h-18 text-sm font-bold tracking-widest uppercase rounded-2xl shadow-primary/25"
                        onClick={onGetStarted}
                    >
                        Sign Up
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        className="glass-panel w-full h-16 md:h-18 text-sm font-bold tracking-widest uppercase rounded-2xl text-muted-foreground hover:text-white border border-white/5 transition-all"
                        onClick={onSignIn}
                    >
                        Sign In
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
};
