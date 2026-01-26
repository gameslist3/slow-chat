/**
 * Create Test Users Script
 * Run this in browser console after deploying to create test accounts
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export async function createTestUsers() {
    const testUsers = [
        { email: 'jack@gmail.com', password: 'jacknytro123', username: 'Jack' },
        { email: 'nytro@gmail.com', password: 'jacknytro123', username: 'Nytro' }
    ];

    for (const user of testUsers) {
        try {
            console.log(`Creating user: ${user.email}...`);

            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                user.email,
                user.password
            );

            // Create Firestore document
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                id: userCredential.user.uid,
                email: user.email,
                username: user.username,
                joinedGroups: ['system-updates'],
                createdAt: Date.now(),
                sessions: []
            });

            console.log(`✅ Created: ${user.email}`);
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`⚠️ User already exists: ${user.email}`);
            } else {
                console.error(`❌ Error creating ${user.email}:`, error.message);
            }
        }
    }

    console.log('✅ Test users setup complete!');
}

// Auto-run in development
if (import.meta.env.DEV) {
    // Uncomment to auto-create test users on app load
    // createTestUsers();
}
