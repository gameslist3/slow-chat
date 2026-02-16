
import React from 'react';

export const AuroraBackground = ({ children }: { children?: React.ReactNode }) => {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0B1220]">
            {/* Fluid Radial Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen opacity-30 blur-[100px] animate-pulse"
                style={{ background: 'radial-gradient(circle, #243A6B 0%, transparent 70%)' }} />

            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen opacity-20 blur-[120px]"
                style={{ background: 'radial-gradient(circle, #182B52 0%, transparent 70%)' }} />

            <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] rounded-full mix-blend-overlay opacity-10 blur-[80px] animate-float"
                style={{ background: 'radial-gradient(circle, #7FA6FF 0%, transparent 70%)' }} />

            {/* Content Overlay */}
            {children && <div className="relative z-10 w-full h-full">{children}</div>}
        </div>
    );
};
