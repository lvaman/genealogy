/**
 * ID Generator Utility
 *
 * Generates unique person IDs from name components following the format:
 * lastname_middlename_firstname or lastname_middlename_firstname_N for duplicates
 *
 * Uses unidecode-style accent removal for international names.
 */

/**
 * Simple unidecode implementation for common diacritics
 * Converts accented characters to their ASCII equivalents
 */
function removeDiacritics(str) {
  const diacritics = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'ă': 'a', 'ą': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ę': 'e', 'ė': 'e', 'ě': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'į': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ő': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ű': 'u', 'ū': 'u',
    'ý': 'y', 'ÿ': 'y',
    'ñ': 'n', 'ń': 'n', 'ň': 'n',
    'ç': 'c', 'ć': 'c', 'č': 'c',
    'ş': 's', 'ś': 's', 'š': 's',
    'ž': 'z', 'ź': 'z', 'ż': 'z',
    'đ': 'd', 'ď': 'd',
    'ł': 'l', 'ľ': 'l',
    'ř': 'r', 'ŕ': 'r',
    'ť': 't',
    // Vietnamese
    'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u'
  };

  return str
    .split('')
    .map(char => diacritics[char.toLowerCase()] || char)
    .join('');
}

/**
 * Slugify a string for use in IDs
 * - Converts to lowercase
 * - Removes diacritics
 * - Replaces non-alphanumeric with underscores
 * - Collapses multiple underscores
 * - Removes leading/trailing underscores
 */
export function slugify(str) {
  if (!str) return '';

  return removeDiacritics(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')  // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .replace(/^_|_$/g, '');        // Remove leading/trailing underscores
}

/**
 * Generate a person ID from name components
 *
 * @param {Object} person - Person object with names array
 * @param {Set<string>} existingIds - Set of existing IDs to check for duplicates
 * @returns {string} Generated unique ID
 *
 * @example
 * generatePersonId(
 *   { names: [{ last_name: "Trần", middle_name: "Hà", first_name: "Minh", is_current: true }] },
 *   new Set()
 * )
 * // Returns: "tran_ha_minh"
 */
export function generatePersonId(person, existingIds = new Set()) {
  // Get primary name (first current name or first in array)
  const primaryName = person.names?.find(n => n.is_current) || person.names?.[0];

  if (!primaryName || !primaryName.last_name || !primaryName.first_name) {
    // Fallback for incomplete data
    return `person_${Date.now()}`;
  }

  const lastName = slugify(primaryName.last_name);
  const middleName = slugify(primaryName.middle_name);
  const firstName = slugify(primaryName.first_name);

  // Build base ID: lastname_middlename_firstname
  const parts = [lastName, middleName, firstName].filter(Boolean);
  const baseId = parts.join('_');

  // Handle duplicates with counter
  let finalId = baseId;
  let counter = 2;
  while (existingIds.has(finalId)) {
    finalId = `${baseId}_${counter}`;
    counter++;
  }

  return finalId;
}

/**
 * Update all references to an ID when it changes
 *
 * @param {Array} allPeople - Array of all person objects
 * @param {string} oldId - Previous ID
 * @param {string} newId - New ID
 * @returns {Array} Updated array of people
 */
export function updateIdReferences(allPeople, oldId, newId) {
  return allPeople.map(person => {
    const updated = { ...person };

    // Update parent references
    if (updated.father_id === oldId) {
      updated.father_id = newId;
    }
    if (updated.mother_id === oldId) {
      updated.mother_id = newId;
    }

    // Update spouse references in unions
    if (Array.isArray(updated.unions)) {
      updated.unions = updated.unions.map(union => ({
        ...union,
        spouse_id: union.spouse_id === oldId ? newId : union.spouse_id
      }));
    }

    return updated;
  });
}
