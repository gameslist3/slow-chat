import { useState, useEffect } from 'react';
import { getUsageStats, UsageStats } from '../services/usageService';
import { useAuth } from '../context/AuthContext';

export function useUsageStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const load = async () => {
            try {
                const s = await getUsageStats(user.id);
                setStats(s);
            } catch (err) {
                console.error('Failed to load usage stats:', err);
            } finally {
                setLoading(false);
            }
        };

        load();
        
        // Refresh every 5 minutes to keep it relatively fresh
        const interval = setInterval(load, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user?.id]);

    return { stats, loading };
}
