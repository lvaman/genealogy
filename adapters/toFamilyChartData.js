/**
 * Data Adapter Module
 *
 * Converts canonical person objects (Firestore schema) to Family Chart format.
 *
 * Schema (event-based):
 * {
 *   id, gender, vital_status,
 *   names: [{ type, first_name, middle_name, last_name, display_name, is_current }],
 *   events: [{ type, date, place, ... }],
 *   father_id, mother_id,
 *   unions: [{ union_id, spouse_id, union_type, union_order, status, end_reason }],
 *   sibling_order, biography
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
 * Get display name from names array (current name or first name)
 */
function getDisplayName(person) {
  if (Array.isArray(person.names) && person.names.length > 0) {
    const currentName = person.names.find(n => n.is_current) || person.names[0];
    return currentName.display_name ||
           `${currentName.last_name} ${currentName.middle_name} ${currentName.first_name}`.trim().replace(/\s+/g, ' ');
  }

  // Fallback to old schema
  return person.display_name || '';
}

/**
 * Extract event data by type from events array
 */
function getEventData(events, eventType) {
  if (!Array.isArray(events)) return { date: null, place: null };

  const event = events.find(e => e.type === eventType);
  if (!event) return { date: null, place: null };

  return {
    date: event.date || null,
    place: event.place || null
  };
}

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

    // Get birth/death data from events array
    const birthData = person.events ? getEventData(person.events, 'birth') : {
      date: person.birth?.date ?? null,
      place: person.birth?.place ?? null
    };

    const deathData = person.events ? getEventData(person.events, 'death') : {
      date: person.death?.date ?? null,
      place: person.death?.place ?? null
    };

    // Build data object with all fields needed for display
    const data = {
      // Required field
      gender: person.gender || 'M',

      // Display name (from names array or fallback)
      display_name: getDisplayName(person),

      // Name fields (for backward compatibility with chart display)
      first_name: person.names?.[0]?.first_name || person.first_name || '',
      middle_name: person.names?.[0]?.middle_name || person.middle_name || '',
      last_name: person.names?.[0]?.last_name || person.last_name || '',
      other_first_names: person.other_first_names || [],
      nicknames: person.nicknames || [],

      // Event fields
      birth_date: birthData.date,
      birth_place: birthData.place,
      death_date: deathData.date,
      death_place: deathData.place,

      // Vital status
      vital_status: person.vital_status || null,

      // Union information (keep for detailed display)
      unions: person.unions || [],

      // Additional fields
      biography: person.biography ?? '',
      sibling_order: person.sibling_order ?? null
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

    // Check gender is valid (now including U for Unknown)
    if (!['M', 'F', 'U'].includes(person.data.gender)) {
      errors.push(`Person ${person.id} has invalid gender: ${person.data.gender}`);
    }
  });

  return errors;
}
