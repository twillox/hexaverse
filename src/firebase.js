import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCxrcZikhOxmZKSBOp-8hN2IbRzvw2mXkg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hexaverse-34a9a.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://hexaverse-34a9a-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hexaverse-34a9a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hexaverse-34a9a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "675451353900",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:675451353900:web:52d66fde8a5abd7293ca89",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BDSHY9EQ71"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth, ref, onValue, set, push, update, remove };
