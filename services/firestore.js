/**
 * Firestore Service Module
 *
 * Handles all interactions with Firestore database for genealogy data.
 */

import { db, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from '../firebase-init.js';

// Default tree ID
const DEFAULT_TREE_ID = 'main';

/**
 * Fetch all people from a genealogy tree
 * @param {string} treeId - Tree identifier
 * @returns {Promise<Array>} Array of person objects with id
 */
export async function fetchPeople(treeId = DEFAULT_TREE_ID) {
  try {
    const peopleCollection = collection(db, `trees/${treeId}/people`);
    const snapshot = await getDocs(peopleCollection);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching people:', error);
    throw error;
  }
}

/**
 * Fetch a single person by ID
 * @param {string} personId - Person identifier
 * @param {string} treeId - Tree identifier
 * @returns {Promise<object|null>} Person object or null if not found
 */
export async function fetchPerson(personId, treeId = DEFAULT_TREE_ID) {
  try {
    const personDoc = doc(db, `trees/${treeId}/people`, personId);
    const snapshot = await getDoc(personDoc);

    if (snapshot.exists()) {
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching person:', error);
    throw error;
  }
}

/**
 * Create or update a person
 * (Admin only - enforced by Firestore rules)
 * @param {string} personId - Person identifier
 * @param {object} personData - Person data object
 * @param {string} treeId - Tree identifier
 * @returns {Promise<void>}
 */
export async function savePerson(personId, personData, treeId = DEFAULT_TREE_ID) {
  try {
    const personDoc = doc(db, `trees/${treeId}/people`, personId);
    await setDoc(personDoc, personData, { merge: true });
  } catch (error) {
    console.error('Error saving person:', error);
    throw error;
  }
}

/**
 * Update specific fields of a person
 * (Admin only - enforced by Firestore rules)
 * @param {string} personId - Person identifier
 * @param {object} updates - Fields to update
 * @param {string} treeId - Tree identifier
 * @returns {Promise<void>}
 */
export async function updatePerson(personId, updates, treeId = DEFAULT_TREE_ID) {
  try {
    const personDoc = doc(db, `trees/${treeId}/people`, personId);
    await updateDoc(personDoc, updates);
  } catch (error) {
    console.error('Error updating person:', error);
    throw error;
  }
}

/**
 * Delete a person
 * (Admin only - enforced by Firestore rules)
 * @param {string} personId - Person identifier
 * @param {string} treeId - Tree identifier
 * @returns {Promise<void>}
 */
export async function deletePerson(personId, treeId = DEFAULT_TREE_ID) {
  try {
    const personDoc = doc(db, `trees/${treeId}/people`, personId);
    await deleteDoc(personDoc);
  } catch (error) {
    console.error('Error deleting person:', error);
    throw error;
  }
}
