/**
 * Data Adapter Module
 *
 * Converts canonical person objects (Firestore schema) to Family Chart format.
 *
 * Canonical schema:
 * {
 *   id, last_name, middle_name, first_name, display_name,
 *   other_first_names[], nicknames[], sibling_order, gender,
 *   birth: { date, place }, death: { date, place },
 *   father_id, mother_id, unions: [{ spouse_id, marriage_date, marriage_place }],
 *   biography, original_code
 * }
 *
 * Family Chart schema:
 * {
 *   id,
 *   data: { gender, ...custom fields },
 *   rels: { parents: [], spouses: [], children: [] }
 * }
 */

/**
 * Convert canonical people array to Family Chart data format
 * @param {Array} people - Array of person objects from Firestore
 * @returns {Array} Array in Family Chart format
 */
export function toFamilyChartData(people) {
  if (!Array.isArray(people) || people.length === 0) {
    return [];
  }

  // Build children map by scanning all father_id/mother_id references
  const childrenByParent = new Map();
  people.forEach(person => {
    const parentIds = [person.father_id, person.mother_id].filter(Boolean);
    parentIds.forEach(parentId => {
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, []);
      }
      childrenByParent.get(parentId).push(person.id);
    });
  });

  // Convert each person
  return people.map(person => {
    // Extract parents
    const parents = [person.father_id, person.mother_id].filter(Boolean);

    // Extract unique spouse IDs from unions
    const spouses = Array.isArray(person.unions)
      ? [...new Set(person.unions.map(u => u.spouse_id).filter(Boolean))]
      : [];

    // Get children from the map
    const children = childrenByParent.get(person.id) || [];

    // Build data object with all fields needed for display
    const data = {
      // Required field
      gender: person.gender || 'M',

      // Name fields
      display_name: person.display_name || '',
      first_name: person.first_name || '',
      middle_name: person.middle_name || '',
      last_name: person.last_name || '',
      other_first_names: person.other_first_names || [],
      nicknames: person.nicknames || [],

      // Event fields
      birth_date: person.birth?.date ?? null,
      birth_place: person.birth?.place ?? null,
      death_date: person.death?.date ?? null,
      death_place: person.death?.place ?? null,

      // Union information (keep for detailed display)
      unions: person.unions || [],

      // Additional fields
      biography: person.biography ?? '',
      sibling_order: person.sibling_order ?? null,
      original_code: person.original_code ?? null
    };

    return {
      id: person.id,
      data,
      rels: {
        parents,
        spouses,
        children
      }
    };
  });
}

/**
 * Validate that all relationship references are valid
 * @param {Array} familyChartData - Data in Family Chart format
 * @returns {Array} Array of validation errors (empty if valid)
 */
export function validateRelationships(familyChartData) {
  const errors = [];
  const idSet = new Set(familyChartData.map(p => p.id));

  familyChartData.forEach(person => {
    // Check parents exist
    person.rels.parents.forEach(parentId => {
      if (!idSet.has(parentId)) {
        errors.push(`Person ${person.id} references missing parent: ${parentId}`);
      }
    });

    // Check spouses exist
    person.rels.spouses.forEach(spouseId => {
      if (!idSet.has(spouseId)) {
        errors.push(`Person ${person.id} references missing spouse: ${spouseId}`);
      }
    });

    // Check children exist
    person.rels.children.forEach(childId => {
      if (!idSet.has(childId)) {
        errors.push(`Person ${person.id} references missing child: ${childId}`);
      }
    });

    // Check gender is valid
    if (!['M', 'F'].includes(person.data.gender)) {
      errors.push(`Person ${person.id} has invalid gender: ${person.data.gender}`);
    }
  });

  return errors;
}
