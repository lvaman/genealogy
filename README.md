# Genealogy Tree - Architecture & Design

This document explains the technical architecture and design decisions for the genealogy tree application.

## Table of Contents

- [Overview](#overview)
- [Quick Links](#quick-links)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)
- [Data Model](#data-model)
- [Security](#security)
- [Internationalization](#internationalization)
- [Performance](#performance)
- [Browser Support](#browser-support)
- [Local Development](#local-development)
- [Deployment](#deployment)

## Overview

A publicly viewable, admin-editable genealogy tree built with vanilla JavaScript, Firebase, and D3.js (via Family Chart library). Hosted on GitHub Pages with security enforced through Firestore Rules.

## Quick Links

- **Data Structure**: See [DATA_STRUCTURE.md](doc/DATA_STRUCTURE.md) for complete schema
- **Firebase Setup**: See [FIREBASE_SETUP.md](doc/FIREBASE_SETUP.md) for deployment guide
- **Roadmap**: See [IMPLEMENTATION_PHASES.md](doc/IMPLEMENTATION_PHASES.md) for development phases

## Tech Stack

**Frontend:**
- HTML5/CSS3 with responsive design
- Vanilla JavaScript (ES Modules)
- Family Chart Library v0.9.0 (D3.js-based)
- Firebase SDK (modular v10)

**Backend:**
- Firebase Authentication (Email/Password)
- Cloud Firestore (NoSQL database)
- Firestore Security Rules (server-side enforcement)

**Hosting:**
- GitHub Pages (static files)

## Architecture

### Directory Structure

```
site/
├── index.html               # Entry point
├── style.css                # Global styles
├── app.js                   # Application bootstrap
├── firebase-init.js         # Firebase SDK initialization
├── i18n.js                  # Internationalization (en/fr/vi)
├── services/                # Business logic
│   ├── auth.js              # Authentication operations
│   └── firestore.js         # Database operations
├── adapters/                # Data transformation
│   └── toFamilyChartData.js # Canonical -> Family Chart format
└── components/              # UI components
    ├── chart.js             # Chart rendering
    └── ui.js                # UI helpers
```

### Data Flow

```
Firestore (canonical schema)
    ↓ fetch
services/firestore.js
    ↓ raw data
adapters/toFamilyChartData.js
    ↓ Family Chart format
components/chart.js
    ↓ render
D3 Visualization
```

## Design Decisions

### 1. Public Read, Admin Write

**Decision:** Tree data is publicly readable; only admins can modify.

**Rationale:**
- Genealogy is for extended family viewing
- No login friction for casual viewers
- Data integrity through controlled admin access
- Security enforced server-side via Firestore Rules

### 2. Firebase Backend

**Decision:** Use Firebase instead of custom server.

**Rationale:**
- No server management required
- Automatic scaling
- Built-in real-time sync capabilities
- Generous free tier
- Mature security system

### 3. Vanilla JavaScript

**Decision:** No framework (React/Vue/Angular).

**Rationale:**
- No build step required
- Smaller bundle size
- Framework longevity (no breaking changes)
- Easy for contributors
- GitHub Pages friendly

### 4. Family Chart Library

**Decision:** Use `family-chart` D3 wrapper.

**Rationale:**
- Battle-tested in production
- Feature-rich (zoom, pan, layouts)
- Active maintenance
- Flexible data format
- TypeScript support

### 5. Trilingual from Day One

**Decision:** Built-in i18n for en/fr/vi.

**Rationale:**
- Family spans multiple cultures
- Critical for accessibility
- Easier to build in than retrofit
- Simple key-value dictionary system

## Data Model

See [DATA_STRUCTURE.md](doc/DATA_STRUCTURE.md) for complete schema documentation.

**Key points:**
- Each person is a Firestore document
- Relationships via ID references
- Children computed dynamically
- Special date semantics (null vs empty string)

## Security

### Firebase Config Safety

The Firebase config in `firebase-init.js` is safe to commit because:
- API keys are public identifiers, not secrets
- Security enforced by Firestore Rules (server-side)
- Domain restrictions prevent abuse
- Rate limiting prevents quota exhaustion

### Firestore Rules

```javascript
// Public read
match /trees/{treeId}/people/{personId} {
  allow read: if true;
  allow write: if isAdmin();
}

// Admin check
function isAdmin() {
  return request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid))
      .data.role == 'admin';
}
```

## Internationalization

**Languages:** English (default), French, Vietnamese

**Implementation:**
- Dictionary-based translation: `t(key)`
- Language persisted in `localStorage`
- Locale-aware date formatting
- Names stored as-is (not translated)

**Example:**
```javascript
t('unknown')  // "Unknown" | "Inconnu" | "Không rõ"
```

## Performance

**Current:** Single fetch of all people (suitable for <5000 people)

**Future optimizations:**
- Paginated fetching
- Lazy-loading subtrees
- Ancestry/progeny depth limits
- Firestore query limits

## Browser Support

**Target:** Modern evergreen browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Requirements:**
- ES modules support
- Fetch API
- CSS custom properties

## Local Development

ES modules require HTTP(S):

```bash
# Python
cd site
python3 -m http.server 8000

# Node.js
npx http-server site

# VS Code
# Use Live Server extension
```

Open: `http://localhost:8000`

## Deployment

### GitHub Pages

1. Enable in repo settings
2. Set source: `main` branch, `/site` folder
3. Access at: `https://username.github.io/genealogy`

### Firebase Setup

1. Follow [FIREBASE_SETUP.md](doc/FIREBASE_SETUP.md)
2. Update `site/firebase-init.js` with config
3. Deploy rules: `firebase deploy --only firestore:rules`
4. Create admin user and grant role
