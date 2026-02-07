import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const CollaborativeBackground = () => {
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        const x = clientX / innerWidth;
        const y = clientY / innerHeight;
        mouseX.set(x);
        mouseY.set(y);
    };

    // Use a lighter spring config for smoother, floaty feel
    const springConfig = { damping: 50, stiffness: 100 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    const moveX = useTransform(x, [0, 1], [-30, 30]);
    const moveY = useTransform(y, [0, 1], [-30, 30]);

    // Subtle glow movement
    const glowX = useTransform(x, [0, 1], ['20%', '80%']);
    const glowY = useTransform(y, [0, 1], ['20%', '80%']);

    return (
        <div
            className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]"
        >
            <BackgroundEffect mouseX={mouseX} mouseY={mouseY} />
            {/* Dark mode overlay adjustment */}
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
        </div>
    );
};

const BackgroundEffect = ({ mouseX, mouseY }: { mouseX: any, mouseY: any }) => {

    React.useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            mouseX.set(x);
            mouseY.set(y);
        };
        window.addEventListener('mousemove', handleMove);
        return () => window.removeEventListener('mousemove', handleMove);
    }, [mouseX, mouseY]);

    const springConfig = { damping: 40, stiffness: 200 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    const moveX = useTransform(x, [0, 1], [-60, 60]);
    const moveY = useTransform(y, [0, 1], [-60, 60]);
    const glowX = useTransform(x, [0, 1], ['0%', '100%']);
    const glowY = useTransform(y, [0, 1], ['0%', '100%']);

    return (
        <>
            <motion.div
                style={{ x: moveX, y: moveY }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vw] h-[160vw] bg-primary/10 rounded-full blur-[180px]"
            />
            <motion.div
                style={{ left: glowX, top: glowY }}
                className="absolute w-[120vw] h-[120vw] bg-secondary/10 rounded-full blur-[160px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 opacity-70"
            />
        </>
    );
};
