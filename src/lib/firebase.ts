import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDW8WKPi-eOz-GWL-dMmA98djKkBterecA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shafi-link.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shafi-link",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shafi-link.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "240723343124",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:240723343124:web:fe06e817e95e26e372b401",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7PH0FJE2HG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const dbInit = getFirestore(app);
