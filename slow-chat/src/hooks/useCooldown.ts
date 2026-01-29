import { useState, useEffect, useCallback } from 'react';

// Cooldown logic: 
// 1-200 members: 2s
// 201-500 members: 5s
// 501-1000 members: 8s
export const getCooldownDuration = (memberCount: number): number => {
    if (memberCount <= 200) return 2;
    if (memberCount <= 500) return 5;
    return 8;
};

export const useCooldown = (groupId: string, memberCount: number) => {
    // Store cooldowns in localStorage or mapped object to persist slightly? 
    // For now simple state, but keys per group
    // Actually, specs say "Per-user, per-group cooldown".

    const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

    useEffect(() => {
        const timer = setInterval(() => {
            setCooldowns(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(key => {
                    if (next[key] > 0) {
                        next[key] -= 1;
                        changed = true;
                    } else {
                        // Cleanup
                        // delete next[key]; // Optional
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const triggerCooldown = useCallback(() => {
        const duration = getCooldownDuration(memberCount);
        setCooldowns(prev => ({
            ...prev,
            [groupId]: duration
        }));
    }, [groupId, memberCount]);

    return {
        remaining: cooldowns[groupId] || 0,
        triggerCooldown
    };
};
