import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAtsrWtk2SGjemx1ptcIHBRo36KUN7cpOY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "uplevel-7095f.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "uplevel-7095f",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "uplevel-7095f.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "442554351367",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:442554351367:web:676e203da17a6130fb4fa2",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NLP3QCY9ZH"
};

export const isFirebaseConfigured = true;
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;