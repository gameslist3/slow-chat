import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-auto h-8", showText = false }) => {
    return (
        <div className={`relative flex items-center gap-2 ${className}`}>
            <img
                src="/logo.png"
                alt="Gapes Logo"
                className="w-full h-full object-contain brightness-100"
            />
        </div>
    );
};
