# Genealogy Data Structure

This document describes the data model for the genealogy tree application.

## Table of Contents
- [Overview](#overview)
- [Firestore Collections](#firestore-collections)
- [Person Document Schema](#person-document-schema)
- [Field Details](#field-details)
- [Example Documents](#example-documents)
- [Family Chart Conversion](#family-chart-conversion)
- [Validation Rules](#validation-rules)
- [Creating Your First Person](#creating-your-first-person)
- [Best Practices](#best-practices)
- [Future Schema Extensions](#future-schema-extensions)

## Overview

The application uses a normalized data structure where each person is a separate document in Firestore. Relationships are established through ID references.

## Firestore Collections

### Collection: `trees/{treeId}/people/{personId}`

Each person is stored as a document with the following structure:

## Person Document Schema

```javascript
{
  // === Identity Fields ===
  id: "unique_person_id",             // String (required) - Unique identifier (lastname_middlename_firstname)

  // === Name Fields ===
  display_name: "Smith John Robert",  // String (required) - Full display name (lastname middlename firstname)
  first_name: "Robert",               // String (required) - Given name
  middle_name: "John",                // String (optional) - Middle name(s)
  last_name: "Smith",                 // String (required) - Family name
  other_first_names: ["Bob"],         // Array<String> (optional) - Additional given names
  nicknames: ["Bobby", "Rob"],        // Array<String> (optional) - Known nicknames

  // === Biological Information ===
  gender: "M",                        // String (required) - "M" for male, "F" for female
  sibling_order: "a",                 // String (optional) - Birth order: "a", "b", "c"...

  // === Life Events ===
  birth: {
    date: "1980-01-15",               // String (optional) - ISO date, year only, or null
    place: "New York, USA"            // String (optional) - Birth location or null
  },
  death: {
    date: "",                         // String (optional) - ISO date, "" = living, null = unknown
    place: ""                         // String (optional) - Death location or null
  },

  // === Family Relationships ===
  father_id: "father_person_id",      // String (optional) - Reference to father's document
  mother_id: "mother_person_id",      // String (optional) - Reference to mother's document

  unions: [                           // Array (optional) - Marriages/partnerships
    {
      spouse_id: "spouse_person_id",  // String (required) - Reference to spouse's document
      marriage_date: "2005-06-20",    // String (optional) - Union date
      marriage_place: "Paris, France" // String (optional) - Union location
    }
  ],

  // === Additional Information ===
  biography: "Life story...",         // String (optional) - Detailed biography
  original_code: "ABC123"             // String (optional) - Legacy identifier or reference code
}
```

## Field Details

### Required Fields

Only three fields are strictly required:
1. **`id`** - Unique identifier for the person
2. **`gender`** - Must be "M" or "F" (used for tree layout and styling)
3. **`display_name`** or **`first_name` + `last_name`** - For card display

### Name Fields

- **`display_name`**: The preferred full name for display (e.g., "Smith John Robert") following the "Lastname Middlename Firstname" convention.
- **`first_name`**: Given name or first name
- **`middle_name`**: Middle name(s) or patronymic
- **`last_name`**: Surname or family name
- **`other_first_names`**: Alternative first names (e.g., baptismal names)
- **`nicknames`**: Common nicknames or diminutives

### Date Field Semantics

Date fields have special meaning based on their value:

| Value | Meaning | Display |
|-------|---------|---------|
| `null` | Truly unknown | "Unknown" |
| `""` (empty string) | For death: person is living<br>For birth: unknown | "Living" or "Unknown" |
| `"1980"` | Year only | "1980" |
| `"1980-01-15"` | Full date (ISO 8601) | Formatted by locale |
| `"circa 1800"` | Approximate or text date | As written |

**Important**: For living people, set `death.date` to empty string `""`, not `null`.

### Relationship Fields

- **`father_id`** and **`mother_id`**: Direct references to parent documents
- **`unions`**: Array of marriage/partnership records
  - Can have multiple unions (remarriages, multiple spouses)
  - Each union includes spouse reference and optional date/place

**Note**: Children are computed dynamically by scanning all people whose `father_id` or `mother_id` reference this person.

### Sibling Order

Use lowercase letters to indicate birth order among siblings:
- `"a"` = first-born
- `"b"` = second-born
- `"c"` = third-born
- etc.

Leave `null` or omit if order is unknown.

### Biography

Free-text field for detailed life history, stories, accomplishments, etc.

## Example Documents

### Example 1: Living Person with Complete Information

```json
{
  "id": "smith_john_robert",
  "display_name": "Smith John Robert",
  "first_name": "John",
  "middle_name": "Robert",
  "last_name": "Smith",
  "other_first_names": ["Rob"],
  "nicknames": ["Bobby"],
  "gender": "M",
  "sibling_order": "a",
  "birth": {
    "date": "1980-01-15",
    "place": "New York, USA"
  },
  "death": {
    "date": "",
    "place": ""
  },
  "father_id": "smith_james",
  "mother_id": "jones_mary",
  "unions": [
    {
      "spouse_id": "doe_jane",
      "marriage_date": "2005-06-20",
      "marriage_place": "Paris, France"
    }
  ],
  "biography": "Software engineer and family genealogist.",
  "original_code": null
}
```

### Example 2: Historical Person with Limited Information

```json
{
  "id": "smith_unknown_ancestor",
  "display_name": "Unknown Ancestor",
  "first_name": "Unknown Ancestor",
  "middle_name": null,
  "last_name": "Smith",
  "other_first_names": [],
  "nicknames": [],
  "gender": "M",
  "sibling_order": null,
  "birth": {
    "date": "1800",
    "place": null
  },
  "death": {
    "date": null,
    "place": null
  },
  "father_id": null,
  "mother_id": null,
  "unions": [],
  "biography": "",
  "original_code": null
}
```

## Family Chart Conversion

The application automatically converts this canonical format to the Family Chart library format:

```javascript
// Canonical format (Firestore)
{
  id: "person_id",
  father_id: "dad_id",
  mother_id: "mom_id",
  unions: [{ spouse_id: "spouse_id" }]
  // ... other fields
}

// Converted to Family Chart format
{
  id: "person_id",
  data: {
    gender: "M",
    display_name: "...",
    // ... all other fields
  },
  rels: {
    parents: ["dad_id", "mom_id"],
    spouses: ["spouse_id"],
    children: ["child1_id", "child2_id"]  // computed
  }
}
```

## Validation Rules

When creating or editing people:

1. **ID must be unique** across all people in the tree
2. **Gender must be "M" or "F"**
3. **Parent/spouse references must exist** in the database
4. **Dates should follow ISO 8601** when specific (YYYY-MM-DD)
5. **Empty arrays are preferred over null** for array fields
6. **Empty strings are preferred over null** for optional text fields (except when meaning matters)

## Creating Your First Person

To add a person via Firebase Console:

1. Go to Firestore Database
2. Navigate to collection: `trees/main/people`
3. Click "Add document"
4. Document ID: Use a unique identifier (e.g., `john_smith`)
5. Add fields manually or paste JSON

**Quick Start Template**:
```json
{
  "id": "your_name",
  "display_name": "Your Name",
  "first_name": "Name",
  "middle_name": "",
  "last_name": "Your",
  "other_first_names": [],
  "nicknames": [],
  "gender": "M",
  "sibling_order": null,
  "birth": {
    "date": "1990-01-01",
    "place": "Your City"
  },
  "death": {
    "date": "",
    "place": ""
  },
  "father_id": null,
  "mother_id": null,
  "unions": [],
  "biography": "This is my biography.",
  "original_code": null
}
```

## Best Practices

1. **Use consistent ID naming**: Consider format like `lastname_middlename_firstname` (e.g., `smith_john_robert`)
2. **Keep display_name updated**: It's used for card titles and should follow "Lastname Middlename Firstname" format.
3. **Document unknowns**: Use `null` for truly unknown or incomplete information vs `""` for not applicable
4. **Add siblings in order**: Use `sibling_order` to maintain birth order
5. **Bidirectional relationships**: Ensure parent-child and spouse relationships are mutual
6. **Start simple, expand later**: Begin with basic fields, add details over time

## Future Schema Extensions

Optional fields that may be added later:
- `photos: []` - Array of image URLs
- `occupation: ""` - Primary profession
- `education: ""` - Educational background
- `residence: []` - Array of locations lived
- `notes: []` - Array of research notes
- `sources: []` - Citations for genealogical research
- `privacy_level: "public"` - Privacy controls
