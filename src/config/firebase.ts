import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHeRwgi7rPT2u-PueQ4Pz2mjhA5paWxPA",
    authDomain: "slowchat-ba812.firebaseapp.com",
    projectId: "slowchat-ba812",
    storageBucket: "slowchat-ba812.firebasestorage.app",
    messagingSenderId: "310630321728",
    appId: "1:310630321728:web:d03e74b00d1a50ceb419a5",
    measurementId: "G-JB5GRC7YLF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
