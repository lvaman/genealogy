/**
 * Person Validator
 *
 * Client-side validation for person documents before saving to Firestore.
 * Validates required fields, data formats, and relationships.
 */

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
    this.name = 'ValidationError';
  }
}

/**
 * Person validator class
 */
export class PersonValidator {
  constructor(allPeople = []) {
    this.allPeople = allPeople;
    this.existingIds = new Set(allPeople.map(p => p.id));
  }

  /**
   * Validate a complete person object
   * @param {Object} person - Person object to validate
   * @param {boolean} isNew - Whether this is a new person (affects ID uniqueness check)
   * @returns {Array<ValidationError>} Array of validation errors (empty if valid)
   */
  validate(person, isNew = false) {
    const errors = [];

    // ID validation
    const idErrors = this.validateId(person.id, isNew ? null : person.id);
    errors.push(...idErrors);

    // Names validation
    const nameErrors = this.validateNames(person.names);
    errors.push(...nameErrors);

    // Gender validation
    const genderError = this.validateGender(person.gender);
    if (genderError) errors.push(genderError);

    // Vital status validation
    const vitalStatusError = this.validateVitalStatus(person.vital_status);
    if (vitalStatusError) errors.push(vitalStatusError);

    // Events validation
    if (person.events) {
      const eventErrors = this.validateEvents(person.events, person.unions);
      errors.push(...eventErrors);
    }

    // Relationships validation
    const relationshipErrors = this.validateRelationships(person);
    errors.push(...relationshipErrors);

    // Sibling order validation
    if (person.sibling_order !== null && person.sibling_order !== undefined) {
      const siblingError = this.validateSiblingOrder(person.sibling_order);
      if (siblingError) errors.push(siblingError);
    }

    return errors;
  }

  /**
   * Validate ID field
   */
  validateId(id, currentId = null) {
    const errors = [];

    if (!id || typeof id !== 'string') {
      errors.push(new ValidationError('id', 'ID is required'));
      return errors;
    }

    if (id.trim() === '') {
      errors.push(new ValidationError('id', 'ID cannot be empty'));
    }

    // Check format: lowercase alphanumeric with underscores
    if (!/^[a-z0-9_]+$/.test(id)) {
      errors.push(new ValidationError('id', 'ID must be lowercase letters, numbers, and underscores only'));
    }

    // Check uniqueness (skip if this is the person's current ID)
    if (id !== currentId && this.existingIds.has(id)) {
      errors.push(new ValidationError('id', 'ID already exists - must be unique'));
    }

    return errors;
  }

  /**
   * Validate names array
   */
  validateNames(names) {
    const errors = [];

    if (!Array.isArray(names) || names.length === 0) {
      errors.push(new ValidationError('names', 'At least one name is required'));
      return errors;
    }

    // Check that at least one name has is_current: true
    const hasCurrentName = names.some(n => n.is_current === true);
    if (!hasCurrentName) {
      errors.push(new ValidationError('names', 'One name must be marked as current'));
    }

    // Validate each name
    names.forEach((name, idx) => {
      if (!name.first_name || !name.last_name) {
        errors.push(new ValidationError(
          `names[${idx}]`,
          'Name must have at least first_name and last_name'
        ));
      }

      const validTypes = ['english', 'vietnamese', 'french', 'legal', 'birth', 'married', 'alias'];
      if (name.type && !validTypes.includes(name.type)) {
        errors.push(new ValidationError(
          `names[${idx}].type`,
          `Invalid name type. Must be one of: ${validTypes.join(', ')}`
        ));
      }
    });

    return errors;
  }

  /**
   * Validate gender
   */
  validateGender(gender) {
    if (!['M', 'F', 'U'].includes(gender)) {
      return new ValidationError('gender', 'Gender must be M (Male), F (Female), or U (Unknown)');
    }
    return null;
  }

  /**
   * Validate vital_status
   */
  validateVitalStatus(vitalStatus) {
    if (!['living', 'deceased', 'unknown'].includes(vitalStatus)) {
      return new ValidationError('vital_status', 'Vital status must be living, deceased, or unknown');
    }
    return null;
  }

  /**
   * Validate events array
   */
  validateEvents(events, unions = []) {
    const errors = [];

    if (!Array.isArray(events)) {
      errors.push(new ValidationError('events', 'Events must be an array'));
      return errors;
    }

    const unionIds = new Set(unions?.map(u => u.union_id) || []);

    events.forEach((event, idx) => {
      // Validate event type
      const validTypes = [
        'birth', 'death', 'marriage', 'divorce', 'baptism', 'burial',
        'engagement', 'graduation', 'adoption', 'immigration', 'emigration',
        'occupation', 'residence', 'military'
      ];
      if (!event.type || !validTypes.includes(event.type)) {
        errors.push(new ValidationError(
          `events[${idx}].type`,
          'Invalid event type'
        ));
      }

      // Marriage events must link to a union
      if (event.type === 'marriage' && !event.union_id) {
        errors.push(new ValidationError(
          `events[${idx}].union_id`,
          'Marriage event must have union_id'
        ));
      }

      // If union_id provided, check it exists
      if (event.union_id && !unionIds.has(event.union_id)) {
        errors.push(new ValidationError(
          `events[${idx}].union_id`,
          'Marriage event union_id does not match any union'
        ));
      }

      // Validate date format based on precision
      if (event.date && event.date_precision) {
        const dateError = this.validateDateFormat(event.date, event.date_precision, idx);
        if (dateError) errors.push(dateError);
      }

      // Validate coordinates if provided
      if (event.place_latitude !== null && event.place_latitude !== undefined) {
        if (typeof event.place_latitude !== 'number' || event.place_latitude < -90 || event.place_latitude > 90) {
          errors.push(new ValidationError(
            `events[${idx}].place_latitude`,
            'Latitude must be a number between -90 and 90'
          ));
        }
      }

      if (event.place_longitude !== null && event.place_longitude !== undefined) {
        if (typeof event.place_longitude !== 'number' || event.place_longitude < -180 || event.place_longitude > 180) {
          errors.push(new ValidationError(
            `events[${idx}].place_longitude`,
            'Longitude must be a number between -180 and 180'
          ));
        }
      }

      // Validate certainty
      if (event.certainty) {
        const validCertainties = ['certain', 'probable', 'possible', 'uncertain', 'living'];
        if (!validCertainties.includes(event.certainty)) {
          errors.push(new ValidationError(
            `events[${idx}].certainty`,
            'Invalid certainty value'
          ));
        }
      }
    });

    return errors;
  }

  /**
   * Validate date format based on precision
   */
  validateDateFormat(date, precision, eventIdx) {
    const formats = {
      'day': /^\d{4}-\d{2}-\d{2}$/,
      'month': /^\d{4}-\d{2}$/,
      'year': /^\d{4}$/,
      'decade': /^\d{4}s$/,
      'century': /^\d+(st|nd|rd|th) century$/i,
      'time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
    };

    if (precision === 'decade' || precision === 'century') {
      // Allow text for these
      return null;
    }

    const regex = formats[precision];
    if (regex && !regex.test(date)) {
      return new ValidationError(
        `events[${eventIdx}].date`,
        `Date format must match precision "${precision}"`
      );
    }

    return null;
  }

  /**
   * Validate relationships
   */
  validateRelationships(person) {
    const errors = [];

    // Validate parent IDs exist
    if (person.father_id && !this.personExists(person.father_id)) {
      errors.push(new ValidationError('father_id', 'Father ID references non-existent person'));
    }

    if (person.mother_id && !this.personExists(person.mother_id)) {
      errors.push(new ValidationError('mother_id', 'Mother ID references non-existent person'));
    }

    // Check for circular parent references
    const circularError = this.checkCircularParents(person.id, person.father_id, person.mother_id);
    if (circularError) {
      errors.push(circularError);
    }

    // Validate union spouse IDs
    if (Array.isArray(person.unions)) {
      person.unions.forEach((union, idx) => {
        if (union.spouse_id && !this.personExists(union.spouse_id)) {
          errors.push(new ValidationError(
            `unions[${idx}].spouse_id`,
            'Spouse ID references non-existent person'
          ));
        }

        // Validate union_type
        const validTypes = ['marriage', 'partnership', 'common_law'];
        if (union.union_type && !validTypes.includes(union.union_type)) {
          errors.push(new ValidationError(
            `unions[${idx}].union_type`,
            'Invalid union type'
          ));
        }

        // Validate status
        const validStatuses = ['current', 'ended'];
        if (union.status && !validStatuses.includes(union.status)) {
          errors.push(new ValidationError(
            `unions[${idx}].status`,
            'Union status must be current or ended'
          ));
        }
      });
    }

    return errors;
  }

  /**
   * Validate sibling order
   */
  validateSiblingOrder(siblingOrder) {
    if (typeof siblingOrder !== 'number' || siblingOrder < 1 || !Number.isInteger(siblingOrder)) {
      return new ValidationError('sibling_order', 'Sibling order must be a positive integer (1, 2, 3...)');
    }
    return null;
  }

  /**
   * Check if a person ID exists
   */
  personExists(personId) {
    return this.existingIds.has(personId);
  }

  /**
   * Check for circular parent references
   */
  checkCircularParents(personId, fatherId, motherId) {
    const visited = new Set([personId]);
    const toCheck = [fatherId, motherId].filter(Boolean);

    while (toCheck.length > 0) {
      const currentId = toCheck.pop();

      if (visited.has(currentId)) {
        return new ValidationError(
          'relationships',
          'Circular parent relationship detected'
        );
      }

      visited.add(currentId);

      // Find this person and add their parents to check
      const person = this.allPeople.find(p => p.id === currentId);
      if (person) {
        if (person.father_id) toCheck.push(person.father_id);
        if (person.mother_id) toCheck.push(person.mother_id);
      }
    }

    return null;
  }
}
