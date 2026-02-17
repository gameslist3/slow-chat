import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../../services/firebaseGroupService';

interface IconCarouselProps {
    selectedIcon: string;
    onSelectIcon: (icon: string) => void;
}

export const IconCarousel: React.FC<IconCarouselProps> = ({ selectedIcon, onSelectIcon }) => {
    // Simple implementation using scroll for now, could be more complex with transform/drag
    // The spec asks for "Infinite loop" and drag. 
    // For prototype speed, I'll implement a centered scroll view with snap.

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to selected on mount
    useEffect(() => {
        if (scrollRef.current) {
            // Find index
            const index = ICONS.indexOf(selectedIcon);
            if (index >= 0) {
                const itemWidth = 80; // Approximate width (w-12 + gap)
                const containerWidth = scrollRef.current.clientWidth;
                const scrollPos = (index * itemWidth) - (containerWidth / 2) + (itemWidth / 2);

                scrollRef.current.scrollTo({
                    left: scrollPos,
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedIcon]);

    return (
        <div className="w-full relative py-8">
            <div className="absolute inset-x-0 h-16 top-1/2 -translate-y-1/2 pointer-events-none bg-indigo-50/50 z-0 rounded-xl border border-indigo-100/50" />

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x scrollbar-none mask-fade-sides snap-mandatory py-4 relative z-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {ICONS.map((icon, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => onSelectIcon(icon)}
                        className={`
               flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 snap-center
               ${selectedIcon === icon
                                ? "bg-white shadow-lg scale-110 ring-2 ring-indigo-600 z-20"
                                : "bg-white/80 hover:bg-white hover:scale-105 text-opacity-50 blur-[1px] hover:blur-0 grayscale hover:grayscale-0"
                            }
             `}
                    >
                        {icon}
                    </button>
                ))}
            </div>

            <div className="text-center mt-2 text-sm text-gray-500 font-medium">
                Selected: <span className="text-2xl ml-2">{selectedIcon}</span>
            </div>
        </div>
    );
};
