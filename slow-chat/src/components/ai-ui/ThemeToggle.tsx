import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('ui-theme');
        if (saved) return saved === 'dark';
        return document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('ui-theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('ui-theme', 'light');
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className="ui-button-ghost rounded-full w-10 h-10 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="Toggle Theme"
        >
            {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500 animate-in zoom-in duration-300" />
            ) : (
                <Moon className="w-5 h-5 text-slate-700 animate-in zoom-in duration-300" />
            )}
        </button>
    );
};
