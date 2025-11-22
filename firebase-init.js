/**
 * Firebase Initialization Module
 *
 * This module initializes Firebase services (Auth and Firestore).
 * Firebase configuration is safe to expose in client code as security
 * is enforced server-side through Firestore Security Rules.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

/**
 * Firebase Configuration
 *
 * Get this from Firebase Console > Project Settings > General > Your apps
 */
const firebaseConfig = {
  apiKey: "AIzaSyCW5SaGXRrQYdzDv3myjzV8ODS962gVrnI",
  authDomain: "genealogy-tree-de571.firebaseapp.com",
  projectId: "genealogy-tree-de571",
  storageBucket: "genealogy-tree-de571.firebasestorage.app",
  messagingSenderId: "987293002709",
  appId: "1:987293002709:web:f3c6e8e701fc07b2fe6b5c"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export commonly used Firestore functions for convenience
export {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

// Export commonly used Auth functions for convenience
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
