import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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


// ✅ Prevent duplicate app error
const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

export const auth = getAuth(app);

// ✅ Forced long-polling to prevent Firestore hang on Web
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

export const storage = getStorage(app, "gs://rapid-repair-15fa8.firebasestorage.app");