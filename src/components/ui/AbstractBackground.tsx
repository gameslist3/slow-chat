import React from 'react';
import { motion } from 'framer-motion';

export const AbstractBackground: React.FC = () => {
    return (
        <div className="motion-bg-container">
            {/* Primary Brand Shape */}
            <motion.div
                className="abstract-shape shape-1"
                animate={{
                    x: [0, 50, -30, 0],
                    y: [0, -40, 60, 0],
                    scale: [1, 1.1, 0.9, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Secondary Accent Shape */}
            <motion.div
                className="abstract-shape shape-2"
                animate={{
                    x: [0, -60, 40, 0],
                    y: [0, 80, -30, 0],
                    scale: [1, 1.2, 0.8, 1],
                }}
                transition={{
                    duration: 40,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            {/* Subtle Depth Shape */}
            <motion.div
                className="abstract-shape shape-3"
                animate={{
                    opacity: [0.1, 0.2, 0.1],
                    scale: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Noise Overlay for Texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
        </div>
    );
};
