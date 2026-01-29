import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const AbstractBackground: React.FC = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth physics for depth effect
    const springConfig = { damping: 50, stiffness: 200 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Calculate relative offset from center (-1 to 1)
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            mouseX.set(x);
            mouseY.set(y);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                const x = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
                const y = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
                mouseX.set(x);
                mouseY.set(y);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [mouseX, mouseY]);

    return (
        <div className="motion-bg-container">
            {/* Base Deep Glow */}
            <motion.div
                className="abstract-glow glow-1"
                style={{
                    x: springX.get() * 40,
                    y: springY.get() * 40,
                }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.15, 0.2, 0.15],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Accent Accent Glow */}
            <motion.div
                className="abstract-glow glow-2"
                style={{
                    x: springX.get() * -60,
                    y: springY.get() * -60,
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            {/* Subtle Drift Glow */}
            <motion.div
                className="abstract-glow glow-3"
                style={{
                    x: springX.get() * 20,
                    y: springY.get() * -30,
                }}
                animate={{
                    opacity: [0.05, 0.1, 0.05],
                    scale: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Fine Texture Noise */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
        </div>
    );
};
