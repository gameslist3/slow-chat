import { useState, useEffect } from 'react';
import { UsageStats } from '../services/usageService';
import { useAuth } from '../context/AuthContext';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const DAILY_FILE_LIMIT = 20;
const DAILY_SIZE_LIMIT = 20 * 1024 * 1024; // 20 MB

export function useUsageStats() {
    const { user } = useAuth();
    const [stats, setStats] = useState<UsageStats | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        const startOfDay = new Date().setHours(0, 0, 0, 0);

        let count = user.dailyUploadCount || 0;
        let size = user.dailyUploadSize || 0;
        let lastReset = user.lastUploadReset || 0;

        // Reset if necessary (usually backend or next fetch does this, but we can do it optimistically here if it's out of date)
        if (lastReset < startOfDay) {
            count = 0;
            size = 0;
        }

        setStats({
            count,
            size,
            limitCount: DAILY_FILE_LIMIT,
            limitSize: DAILY_SIZE_LIMIT,
            resetTime: startOfDay + 24 * 60 * 60 * 1000
        });

    }, [user]);

    return { stats, loading: false };
}
