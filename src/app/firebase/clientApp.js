import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDuUEafvE_UXtNEpU--AnkO6bh_8l5j0I8",
  authDomain: "premarket-homes.firebaseapp.com",
  projectId: "premarket-homes",
  storageBucket: "premarket-homes.firebasestorage.app",
  messagingSenderId: "186906128986",
  appId: "1:186906128986:web:92415d938bc835479c5e63",
  measurementId: "G-82L9C6VDW5"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
