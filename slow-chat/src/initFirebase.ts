import { initializeSystemGroup, initializeSeedGroups } from './services/firebaseGroupService';

/**
 * Initialize Firebase database with system group and seed data
 * Run this once after setting up Firebase
 */
export async function initializeFirebase() {
    try {
        console.log('[Firebase] Initializing database...');

        await initializeSystemGroup();
        console.log('[Firebase] ✓ System group created');

        await initializeSeedGroups();
        console.log('[Firebase] ✓ Seed groups created');

        console.log('[Firebase] ✅ Initialization complete!');
    } catch (error) {
        console.error('[Firebase] ❌ Initialization failed:', error);
        throw error;
    }
}

// Run initialization on load
initializeFirebase().catch(console.error);
