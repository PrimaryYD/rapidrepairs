import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAKPdZpmFdPWemlN8p_mzFGH4aDtcvi65g",
    authDomain: "rapid-repair-15fa8.firebaseapp.com",
    projectId: "rapid-repair-15fa8",
    storageBucket: "rapid-repair-15fa8.firebasestorage.app",
    messagingSenderId: "902237798132",
    appId: "1:902237798132:web:cf922a1915af7fe91b28a1"
};


// @ts-ignore
import { initializeAuth, getReactNativePersistence, browserLocalPersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ✅ Prevent duplicate app error
const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

// ✅ Fixed Auth initialization for both Web & Native
let firebaseAuth;
if (Platform.OS === 'web') {
    firebaseAuth = getAuth(app);
} else {
    try {
        // Double check if function exists to prevent crash on Native
        const persistence = typeof getReactNativePersistence === 'function' 
            ? getReactNativePersistence(AsyncStorage) 
            : undefined;
            
        firebaseAuth = initializeAuth(app, {
            persistence: persistence
        });
    } catch (e) {
        console.warn("Firebase Auth init failed on native, falling back to getAuth", e);
        firebaseAuth = getAuth(app);
    }
}

export const auth = firebaseAuth;

// ✅ Forced long-polling to prevent Firestore hang on Web
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

export const storage = getStorage(app, "gs://rapid-repair-15fa8.firebasestorage.app");
export default function FirebaseConfig() { return null; }