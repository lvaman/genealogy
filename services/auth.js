/**
 * Authentication Service Module
 *
 * Handles admin authentication and user state management.
 */

import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from '../firebase-init.js';

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User credential
 * @throws {Error} If sign-in fails
 */
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current authenticated user
 * @returns {object|null} Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}
