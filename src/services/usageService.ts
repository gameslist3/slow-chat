import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

const DAILY_FILE_LIMIT = 20;
const DAILY_SIZE_LIMIT = 20 * 1024 * 1024; // 20 MB

export interface UsageStats {
    count: number;
    size: number;
    limitCount: number;
    limitSize: number;
    resetTime: number;
}

/**
 * Fetches and synchronizes user upload usage stats
 */
export const getUsageStats = async (userId: string): Promise<UsageStats> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData) throw new Error('User not found');

    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);

    let count = userData.dailyUploadCount || 0;
    let size = userData.dailyUploadSize || 0;
    let lastReset = userData.lastUploadReset || 0;

    // If last reset was before today, reset stats in DB
    if (lastReset < startOfDay) {
        await updateDoc(userRef, {
            dailyUploadCount: 0,
            dailyUploadSize: 0,
            lastUploadReset: startOfDay
        });
        count = 0;
        size = 0;
    }

    return {
        count,
        size,
        limitCount: DAILY_FILE_LIMIT,
        limitSize: DAILY_SIZE_LIMIT,
        resetTime: startOfDay + 24 * 60 * 60 * 1000
    };
};

/**
 * Increments the usage stats after a successful upload
 */
export const updateUsage = async (userId: string, fileSize: number): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        dailyUploadCount: increment(1),
        dailyUploadSize: increment(fileSize)
    });
};

/**
 * Checks if user has reached their daily limit
 */
export const checkUploadLimit = async (userId: string, nextFileSize: number): Promise<{ allowed: boolean; reason?: string; resetIn?: string }> => {
    const stats = await getUsageStats(userId);
    
    if (stats.count >= stats.limitCount) {
        return { 
            allowed: false, 
            reason: 'Daily file count limit reached',
            resetIn: formatRemainingTime(stats.resetTime)
        };
    }
    
    if (stats.size + nextFileSize > stats.limitSize) {
        return { 
            allowed: false, 
            reason: 'Daily data transfer limit reached (20MB)',
            resetIn: formatRemainingTime(stats.resetTime)
        };
    }
    
    return { allowed: true };
};

const formatRemainingTime = (resetTime: number): string => {
    const remaining = resetTime - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};
