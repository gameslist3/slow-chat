import { useState, useEffect } from 'react';

export const useCooldown = (groupId: string, memberCount: number) => {
    const [remaining, setRemaining] = useState(0);

    // Tiered Cooldown: 0-100->2s, 101-200->4s, 201-500->6s, 501-1000->8s
    const calculateCooldown = () => {
        if (memberCount <= 100) return 2000;
        if (memberCount <= 200) return 4000;
        if (memberCount <= 500) return 6000;
        if (memberCount <= 1000) return 8000;
        return 10000; // Cap for > 1000
    };

    const triggerCooldown = () => {
        const duration = calculateCooldown();
        setRemaining(Math.ceil(duration / 1000));

        // Store end time in localStorage for persistence
        const endTime = Date.now() + duration;
        localStorage.setItem(`cooldown_${groupId}`, endTime.toString());
    };

    // Check storage on mount/interval
    useEffect(() => {
        const check = () => {
            const stored = localStorage.getItem(`cooldown_${groupId}`);
            if (stored) {
                const end = parseInt(stored);
                const left = Math.ceil((end - Date.now()) / 1000);
                if (left > 0) setRemaining(left);
                else {
                    setRemaining(0);
                    localStorage.removeItem(`cooldown_${groupId}`);
                }
            }
        };

        const interval = setInterval(check, 1000); // Poll every second for UI Update
        check(); // Initial
        return () => clearInterval(interval);
    }, [groupId]);

    return { remaining, triggerCooldown };
};

// Export useChat from the dedicated file
export { useChat } from './useChat';
