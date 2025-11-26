# Genealogy Data Structure

Complete documentation of the genealogy tree data model with event-based architecture, multi-type names, and comprehensive life event tracking.

## Table of Contents
- [Overview](#overview)
- [Firestore Collections](#firestore-collections)
- [Person Document Schema](#person-document-schema)
- [Field Details](#field-details)
- [Event Types](#event-types)
- [Example Documents](#example-documents)
- [ID Generation](#id-generation)
- [Validation Rules](#validation-rules)
- [Best Practices](#best-practices)

## Overview

The application uses a normalized event-based data structure where each person is a separate document in Firestore. Life events (birth, death, marriage, etc.) are stored in a unified events array for consistency and extensibility.

## Firestore Collections

### Collection: `trees/{treeId}/people/{personId}`

Each person is stored as a document. The document ID matches the `id` field within.

## Person Document Schema

```javascript
{
  // === Identity ===
  id: "tran_ha_minh",  // String (required, editable) - Unique identifier

  // === Names (Multi-type) ===
  names: [              // Array (required) - At least one name
    {
      type: "english" | "vietnamese" | "french" | "legal" | "birth" | "married" | "alias",
      first_name: "Kevin",
      middle_name: "",
      last_name: "Tran",
      display_name: "Tran Kevin",  // Auto-generated or custom
      is_current: true              // Boolean - One must be true
    }
  ],

  // === Basic Information ===
  gender: "M" | "F" | "U",  // String (required) - M=Male, F=Female, U=Unknown
  vital_status: "living" | "deceased" | "unknown",  // String (required)

  // === Events ===
  events: [             // Array (optional but recommended)
    {
      type: "birth",    // String (required) - Event type

      // Date fields
      date: "1990-03-15",  // String or null - Format varies by precision
      date_precision: "day",  // String - "day" | "month" | "year" | "decade" | "century" | "time"
      date_qualifier: "exact",  // String - "exact" | "circa" | "before" | "after" | "between"
      date_time: null,    // String - ISO 8601 with HH:MM (e.g., "1990-03-15T14:30")
      date_timezone: null,  // String - e.g., "UTC", "America/New_York"

      // Place fields
      place: "Ho Chi Minh City, Vietnam",  // String - Free text
      place_latitude: 10.8231,   // Number - Decimal degrees
      place_longitude: 106.6297,  // Number - Decimal degrees
      place_detail: "Cho Ray Hospital",  // String - Specific location

      // Metadata
      certainty: "certain",  // String - "certain" | "probable" | "possible" | "uncertain" | "living"
      source: "Church records, page 42",  // String - Source attribution
      notes: "Additional context",  // String - Notes

      // Relationship (for marriage events)
      union_id: null  // String - Links to unions array
    }
  ],

  // === Relationships ===
  father_id: null,      // String or null - Reference to father's document ID
  mother_id: null,      // String or null - Reference to mother's document ID

  unions: [             // Array (optional) - Marriages/partnerships
    {
      union_id: "union_abc123",  // String (required) - Auto-generated UUID
      spouse_id: "doe_jane",     // String (required) - Spouse document ID
      union_type: "marriage",    // String - "marriage" | "partnership" | "common_law"
      union_order: 1,            // Number - 1st marriage, 2nd, etc.
      status: "current",         // String - "current" | "ended"
      end_reason: null           // String or null - "divorce" | "death" | "separation"
    }
  ],

  // === Additional Information ===
  sibling_order: 1,     // Number or null - Birth order: 1, 2, 3...
  biography: "",        // String - Life story

  // === Metadata (for audit logging) ===
  created_at: serverTimestamp(),   // Timestamp - When created
  updated_at: serverTimestamp(),   // Timestamp - Last updated
  created_by_uid: "admin_uid",     // String - Who created
  updated_by_uid: "admin_uid"      // String - Who last updated
}
```

## Field Details

### Required Fields

1. **`id`** - Unique identifier (editable by admin)
2. **`names`** - At least one name, one must have `is_current: true`
3. **`gender`** - Must be "M", "F", or "U"
4. **`vital_status`** - Must be "living", "deceased", or "unknown"

### Names Array

Multi-type name support for international families:

- **`type`**: english, vietnamese, french, legal, birth, married, alias
- **`is_current`**: Exactly one name must be marked as current (used for display)
- **`display_name`**: Auto-generated from first/middle/last or custom

**Example:**
```javascript
names: [
  {
    type: "vietnamese",
    first_name: "Minh",
    middle_name: "Ha",
    last_name: "Tran",
    display_name: "Tran Ha Minh",
    is_current: true
  },
  {
    type: "english",
    first_name: "Kevin",
    middle_name: "",
    last_name: "Tran",
    display_name: "Tran Kevin",
    is_current: false
  }
]
```

### Date Fields

Date formats vary by precision:

| Precision | Format | Example |
|-----------|--------|---------|
| day | YYYY-MM-DD | "1990-03-15" |
| month | YYYY-MM | "1990-03" |
| year | YYYY | "1990" |
| decade | "NNNNs" | "1980s" |
| century | "Nth century" | "18th century" |
| time | YYYY-MM-DDTHH:MM | "1990-03-15T14:30" |

**Date Qualifiers:**
- `exact` - Precise date known
- `circa` - Approximate ("around 1990")
- `before` - Known to be before this date
- `after` - Known to be after this date
- `between` - Between two dates (use notes for second date)

**Time Precision:**
- Format: HH:MM (24-hour, no seconds)
- Optional timezone field for UTC offset or zone name

### Sibling Order

Use numbers to indicate birth order among siblings:
- `1` = first-born
- `2` = second-born
- `3` = third-born
- etc.

Leave `null` or omit if order is unknown.

**Note:** Future enhancement may support gaps for unknown siblings (e.g., person A is after person B, but unknown siblings exist between them).

### Vital Status

Separate from death event for clarity:

- **`living`** - Person is alive (death event should have `certainty: "living"`)
- **`deceased`** - Person has died (should have death event with date)
- **`unknown`** - Status unknown (historical records)

### Relationship Fields

- **`father_id` / `mother_id`**: Direct references to parent documents
- **`unions`**: Array of marriages/partnerships
  - Each union has unique `union_id`
  - Marriage events link via `union_id`
  - Track union order, status, and end reason

**Note:** Children are computed dynamically by finding all people whose `father_id` or `mother_id` reference this person.

## Event Types

Supported event types (extensible):

### Life Events
- **birth** - Birth
- **death** - Death
- **baptism** - Baptism/christening
- **burial** - Burial/cremation

### Relationship Events
- **marriage** - Marriage (links to union via `union_id`)
- **divorce** - Divorce
- **engagement** - Engagement

### Life Milestones
- **graduation** - Education completion
- **adoption** - Adoption
- **military** - Military service

### Migration Events
- **immigration** - Immigration to country
- **emigration** - Emigration from country
- **residence** - Residence change

### Occupation
- **occupation** - Career/job information

## Example Documents

### Example 1: Vietnamese Person with English Name

```json
{
  "id": "tran_ha_minh",
  "names": [
    {
      "type": "vietnamese",
      "first_name": "Minh",
      "middle_name": "Ha",
      "last_name": "Tran",
      "display_name": "Tran Ha Minh",
      "is_current": true
    },
    {
      "type": "english",
      "first_name": "Kevin",
      "middle_name": "",
      "last_name": "Tran",
      "display_name": "Kevin Tran",
      "is_current": false
    }
  ],
  "gender": "M",
  "vital_status": "living",
  "events": [
    {
      "type": "birth",
      "date": "1990-03-15",
      "date_precision": "day",
      "date_qualifier": "exact",
      "date_time": null,
      "date_timezone": null,
      "place": "Ho Chi Minh City, Vietnam",
      "place_latitude": 10.8231,
      "place_longitude": 106.6297,
      "place_detail": "Cho Ray Hospital",
      "certainty": "certain",
      "source": "Birth certificate",
      "notes": ""
    },
    {
      "type": "immigration",
      "date": "2010",
      "date_precision": "year",
      "date_qualifier": "circa",
      "place": "Paris, France",
      "certainty": "probable",
      "source": "Family records",
      "notes": "Came for university studies"
    }
  ],
  "father_id": "tran_van_minh",
  "mother_id": "nguyen_thi_lan",
  "unions": [],
  "sibling_order": 1,
  "biography": "Software engineer living in France",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "created_by_uid": "admin123",
  "updated_by_uid": "admin123"
}
```

### Example 2: Historical Person with Limited Information

```json
{
  "id": "smith_unknown",
  "names": [
    {
      "type": "english",
      "first_name": "Unknown",
      "middle_name": "",
      "last_name": "Smith",
      "display_name": "Smith Unknown",
      "is_current": true
    }
  ],
  "gender": "U",
  "vital_status": "deceased",
  "events": [
    {
      "type": "birth",
      "date": "18th century",
      "date_precision": "century",
      "date_qualifier": "circa",
      "place": null,
      "certainty": "uncertain",
      "source": "",
      "notes": "Estimated from family records"
    },
    {
      "type": "death",
      "date": null,
      "date_precision": null,
      "date_qualifier": null,
      "place": null,
      "certainty": "certain",
      "source": "",
      "notes": "Deceased but date unknown"
    }
  ],
  "father_id": null,
  "mother_id": null,
  "unions": [],
  "sibling_order": null,
  "biography": ""
}
```

### Example 3: Person with Marriage

```json
{
  "id": "doe_john",
  "names": [
    {
      "type": "english",
      "first_name": "John",
      "middle_name": "Robert",
      "last_name": "Doe",
      "display_name": "Doe John Robert",
      "is_current": true
    }
  ],
  "gender": "M",
  "vital_status": "living",
  "events": [
    {
      "type": "birth",
      "date": "1985-06-20",
      "date_precision": "day",
      "date_qualifier": "exact",
      "place": "New York, USA",
      "certainty": "certain",
      "source": "Birth certificate",
      "notes": ""
    },
    {
      "type": "marriage",
      "union_id": "union_doe_jane_001",
      "date": "2010-08-15",
      "date_precision": "day",
      "date_qualifier": "exact",
      "place": "Paris, France",
      "certainty": "certain",
      "source": "Marriage certificate",
      "notes": "Church wedding at Notre-Dame"
    }
  ],
  "father_id": "doe_james",
  "mother_id": "smith_mary",
  "unions": [
    {
      "union_id": "union_doe_jane_001",
      "spouse_id": "doe_jane",
      "union_type": "marriage",
      "union_order": 1,
      "status": "current",
      "end_reason": null
    }
  ],
  "sibling_order": 1,
  "biography": "Teacher living in Paris"
}
```

## ID Generation

IDs are auto-generated but editable by administrators.

### Format

`lastname_middlename_firstname` or `lastname_middlename_firstname_N` for duplicates

### Algorithm

1. Extract primary name (first with `is_current: true`)
2. Concatenate: `last_name middle_name first_name`
3. Convert to lowercase
4. Remove accents (ễ → e, ç → c, etc.)
5. Replace non-alphanumeric with underscore
6. Collapse multiple underscores
7. If duplicate exists, append `_2`, `_3`, etc.

### Examples

- "Tran Ha Minh" → `tran_ha_minh`
- "Nguyễn Văn An" → `nguyen_van_an`
- "Dupont Jean-Pierre" → `dupont_jean_pierre`
- Duplicate "John Doe" → `doe_john`, `doe_john_2`, `doe_john_3`

### Editing IDs

When admin changes an ID:
1. System validates uniqueness
2. Updates all references:
   - `father_id` in children
   - `mother_id` in children
   - `spouse_id` in spouses' unions
3. Updates Firestore document ID

## Validation Rules

### Client-Side

1. **ID**: Required, unique, lowercase alphanumeric + underscore
2. **Names**: At least one name, exactly one `is_current: true`
3. **Gender**: Must be "M", "F", or "U"
4. **Vital Status**: Required
5. **Events**:
   - Marriage events must have `union_id` linking to unions array
   - Date format must match `date_precision`
   - Coordinates must be valid lat/lng if provided
6. **Relationships**:
   - Parent IDs must exist in database
   - Spouse IDs must exist in database
   - No circular parent references (A → B → C → A)

### Firestore Rules

```javascript
match /people/{personId} {
  allow read: if true;
  allow create, update: if isAdmin() &&
    request.resource.data.id == personId &&
    request.resource.data.keys().hasAll(['id', 'gender', 'names', 'vital_status']) &&
    request.resource.data.gender in ['M', 'F', 'U'] &&
    request.resource.data.vital_status in ['living', 'deceased', 'unknown'] &&
    request.resource.data.names.size() > 0;
}
```

## Best Practices

1. **Use current name for display**: Mark one name as `is_current: true`
2. **Add birth event**: Even if date unknown, add with `certainty: "uncertain"`
3. **Consistent ID format**: Follow lastname_middlename_firstname convention
4. **Source citations**: Add sources for genealogical research
5. **Event notes**: Use notes field for additional context
6. **Bidirectional relationships**: When adding spouse, add union to both people
7. **Orphan management**: Track people with no connections for later linking
8. **Date precision**: Use appropriate precision (year vs day) based on source
9. **Place standardization**: Use consistent format (City, Country)
10. **Metadata tracking**: created_at/updated_at for audit trail

## Family Chart Conversion

The adapter (`toFamilyChartData.js`) converts this format for the Family Chart library:

```javascript
// Firestore format → Family Chart format
{
  id: "person_id",
  data: {
    gender: "M",
    display_name: "Current name's display_name",
    birth_date: "From birth event",
    death_date: "From death event or null if living",
    // ... other fields
  },
  rels: {
    parents: [father_id, mother_id],
    spouses: [spouse_ids from unions],
    children: [computed from all people with this person as parent]
  }
}
```
