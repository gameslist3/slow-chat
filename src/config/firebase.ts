import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHeRwgi7rPT2u-PueQ4Pz2mjhA5paWxPA",
    authDomain: "gapes-ba812.firebaseapp.com",
    projectId: "gapes-ba812",
    storageBucket: "gapes-ba812.appspot.com",
    messagingSenderId: "310630321728",
    appId: "1:310630321728:web:d03e74b00d1a50ceb419a5",
    measurementId: "G-JB5GRC7YLF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable persistence
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err: any) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistence failed: Browser not supported');
        }
    });
}

export { auth, db, storage };
export default app;
