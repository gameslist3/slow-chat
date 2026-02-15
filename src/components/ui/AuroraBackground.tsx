
import React, { useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

export const AuroraBackground = ({ children }: { children?: React.ReactNode }) => {
    return (
        <div
            className="fixed inset-0 z-[-1] overflow-hidden text-white selection:bg-indigo-500/30"
            style={{
                background: 'linear-gradient(180deg, #112040 0%, #0D1320 100%)'
            }}
        >
            {/* Specific Blurred Element from Design */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div style={{ width: '583px', height: '405.15px', position: 'relative', opacity: 0.50, boxShadow: '180px 180px 180px rgba(0,0,0,0.5)', filter: 'blur(90px)' }}>
                    <div style={{ width: '349.58px', height: '392.30px', left: '34.64px', top: '12.85px', position: 'absolute', background: '#6A90E8' }}></div>
                    <div style={{ width: '583px', height: '376px', left: '0px', top: '0px', position: 'absolute', background: '#292F94' }}></div>
                    <div style={{ width: '337px', height: '257px', left: '180px', top: '117px', position: 'absolute', background: '#121929' }}></div>
                </div>
            </div>

            {/* Content Overlay */}
            {children && <div className="relative z-10">{children}</div>}
        </div>
    );
};
