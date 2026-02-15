
import React from 'react';
import { motion } from 'framer-motion';

export const AuroraBackground = ({ children }: { children?: React.ReactNode }) => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#020617] text-white selection:bg-indigo-500/30">
            {/* Noise Texture Overlay */}
            <div
                className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Aurora Blobs */}
            <div className="absolute inset-0 z-[1] blur-[100px] sm:blur-[130px]">
                {/* Blob 1: Deep Purple - Top Left */}
                <motion.div
                    className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/40 mix-blend-screen"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Blob 2: Vibrant Indigo/Blue - Bottom Right */}
                <motion.div
                    className="absolute top-[20%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-indigo-700/30 mix-blend-screen"
                    animate={{
                        x: [0, -40, 0],
                        y: [0, -40, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Blob 3: Soft Blue - Bottom Left */}
                <motion.div
                    className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-900/30 mix-blend-screen"
                    animate={{
                        x: [0, 60, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Blob 4: Accent Purple - Center/Top */}
                <motion.div
                    className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-violet-800/20 mix-blend-screen"
                    animate={{
                        x: [0, -20, 0],
                        y: [0, 40, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 22,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* Content Overlay */}
            {children && <div className="relative z-10">{children}</div>}
        </div>
    );
};
