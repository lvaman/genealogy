# Firebase Setup Guide

This guide walks you through setting up Firebase for the genealogy tree application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Step 1: Create Firebase Project](#step-1-create-firebase-project)
- [Step 2: Enable Firestore Database](#step-2-enable-firestore-database)
- [Step 3: Enable Authentication](#step-3-enable-authentication)
- [Step 4: Register Web App](#step-4-register-web-app)
- [Step 5: Update Firebase Configuration](#step-5-update-firebase-configuration)
- [Step 6: Add Authorized Domain for GitHub Pages](#step-6-add-authorized-domain-for-github-pages)
- [Step 7: Install Firebase CLI](#step-7-install-firebase-cli)
- [Step 8: Login to Firebase](#step-8-login-to-firebase)
- [Step 9: Initialize Firebase in Project](#step-9-initialize-firebase-in-project)
- [Step 10: Deploy Firestore Security Rules](#step-10-deploy-firestore-security-rules)
- [Step 11: Create Admin User Account](#step-11-create-admin-user-account)
- [Step 12: Grant Admin Role](#step-12-grant-admin-role)
- [Step 13: Create Your First Person](#step-13-create-your-first-person)
- [Step 14: Test Locally](#step-14-test-locally)
- [Step 15: Add More People](#step-15-add-more-people)
- [Troubleshooting](#troubleshooting)
  - [Error: "Permission denied"](#error-permission-denied)
  - [Error: "Auth domain not authorized"](#error-auth-domain-not-authorized)
  - [No data showing](#no-data-showing)
  - [Tree not rendering](#tree-not-rendering)
- [Data Structure Reference](#data-structure-reference)
- [Security Best Practices](#security-best-practices)
- [Next Steps](#next-steps)
- [Support](#support)

## Prerequisites

- Google account
- Node.js and npm installed (for Firebase CLI)
- Access to the genealogy repository

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "genealogy-tree")
4. Accept terms and click "Continue"
5. Enable Gemini in Firebase (optional)
6. Disable Google Analytics (optional for this project)
7. Click "Create project"
8. Wait for project to be created, then click "Continue"

## Step 2: Enable Firestore Database

1. In Firebase Console, click on "Build" in the left menu, then click "Firestore Database"
2. Click "Create database"
3. Select "Standard edition"
4. Choose a location close to your users (e.g., `us-central1` or `europe-west1`)
5. Select "Start in production mode (recommended for new projects)"
6. Click "Start"

## Step 3: Enable Authentication

1. In the Firebase Console, click on "Build" in the left menu, then click "Authentication"
2. Click "Get started"
3. Click on "Email/Password" provider
4. Enable "Email/Password" (toggle switch)
5. Leave "Email link (passwordless sign-in)" disabled
6. Click "Save"

## Step 4: Register Web App

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the Web icon (`</>`)
5. Enter app nickname (e.g., "Genealogy Web App")
6. Check "Also set up Firebase Hosting"
7. Click "Register app"
8. You will land on the "Add Firebase SDK" screen. Copy the `firebaseConfig` object shown
9. Click "Next" until the end and then "Continue to console"

## Step 5: Update Firebase Configuration

1. Open `site/firebase-init.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

3. Save the file

## Step 6: Add Authorized Domain for GitHub Pages

1. In Firebase Console, go to "Authentication"
2. Click on "Settings" tab
3. Scroll to "Authorized domains"
4. Click "Add domain"
5. Enter your GitHub Pages domain:
   - Format: `username.github.io` or `orgname.github.io`
   - Example: `lvaman.github.io`
6. Click "Add"

Note: If using a custom domain, add that domain instead.

## Step 7: Install Firebase CLI

Open a terminal and install Firebase CLI globally:

```bash
npm install -g firebase-tools
```

Verify installation:

```bash
firebase --version
```

## Step 8: Login to Firebase

```bash
firebase login
```

When prompted, respond as follows:
- Enable Gemini in Firebase features? `Yes`
- Allow Firebase to collect CLI and Emulator Suite usage and error reporting information? `No`

This will open a browser window for Google authentication. Sign in with the account that owns the Firebase project.

## Step 9: Initialize Firebase in Project

Navigate to your project root directory:

```bash
cd /path/to/genealogy
```

Initialize Firebase:

```bash
firebase init
```

Select the following options:
- Which Firebase features? Select:
  - `Firestore: Configure security rules and indexes files for Firestore`
  - (Use Space to select, Enter to confirm)
- Use an existing project: Select your project
- What file should be used for Firestore Rules? `firestore.rules` (default)
- What file should be used for Firestore indexes? `firestore.indexes.json` (default)

## Step 10: Deploy Firestore Security Rules

Review the rules in `firestore.rules`, then deploy:

```bash
firebase deploy --only firestore:rules
```

Expected output:
```
✔  Deploy complete!
```

## Step 11: Create Admin User Account

### Option A: Using Firebase Console (Recommended)

1. Go to "Authentication" in Firebase Console
2. Click "Users" tab
3. Click "Add user"
4. Enter email address for admin (e.g., `admin@example.com`)
5. Enter a strong password
6. Click "Add user"
7. Copy the User UID shown in the users list

### Option B: Using Firebase CLI

```bash
firebase auth:import users.json --hash-algo=BCRYPT
```

## Step 12: Grant Admin Role

You need to add the admin user to the `users` collection in Firestore.

### Option A: Using Firebase Console

1. Go to "Firestore Database" in Firebase Console
2. Click "Start collection"
3. Collection ID: `users`
4. Click "Next"
5. Document ID: Paste the User UID from Step 11
6. Add field:
   - Field: `role`
   - Type: `string`
   - Value: `admin`
7. Click "Save"

### Option B: Using Firestore Node.js Script

Create a file `scripts/create-admin.js`:

```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function createAdmin(uid) {
  await db.collection('users').doc(uid).set({
    role: 'admin'
  });
  console.log(`Admin role granted to user: ${uid}`);
}

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node create-admin.js <USER_UID>');
  process.exit(1);
}

createAdmin(uid).then(() => process.exit(0));
```

**Note:** Ensure you have installed the `firebase-admin` SDK (`npm install firebase-admin`) in your project for this script to run correctly.

Run it:

```bash
node scripts/create-admin.js <USER_UID>
```

## Step 13: Create Your First Person

Now create a person in the tree to test with:

1. In "Firestore Database", click "Start collection" (or navigate to existing)
2. Collection ID: `trees`
3. Click "Next"
4. Document ID: `main` (this is your tree ID)
5. Click "Save" (we'll add fields in subcollection)
6. Click on the `main` document
7. Click "Start collection" (subcollection)
8. Collection ID: `people`
9. Click "Next"
10. Document ID: `first_person` (or use a unique ID)
11. Click "Auto-ID" if you prefer Firebase to generate one
12. Add the following fields:

| Field | Type | Value |
|-------|------|-------|
| `id` | string | `first_person` (same as document ID) |
| `display_name` | string | Your full name |
| `first_name` | string | Your first name |
| `middle_name` | string | Your middle name (or "") |
| `last_name` | string | Your last name |
| `other_first_names` | array | [] (empty array) |
| `nicknames` | array | [] (empty array) |
| `gender` | string | `M` or `F` |
| `sibling_order` | null | null |
| `birth` | map | (click "Add field" below) |
| `death` | map | (click "Add field" below) |
| `father_id` | null | null |
| `mother_id` | null | null |
| `unions` | array | [] (empty array) |
| `biography` | string | "Your bio here" |
| `original_code` | null | null |

For the `birth` map, add:
- Field: `date`, Type: string, Value: `"1990-01-01"` (your birth date)
- Field: `place`, Type: string, Value: `"Your City"` (or null)

For the `death` map, add:
- Field: `date`, Type: string, Value: `""` (empty string means living)
- Field: `place`, Type: string, Value: `""` (empty string)

13. Click "Save"

**Tip**: See [DATA_STRUCTURE.md](DATA_STRUCTURE.md) for a complete template you can copy/paste as JSON.

## Step 14: Test Locally

1. Start a local web server:
```bash
cd site
python3 -m http.server 8000
```

2. Open browser: `http://localhost:8000`
3. You should see your first person in the tree!
4. Click "Admin Login"
5. Sign in with your admin credentials from Step 11
6. Verify you see "Logged in as: your-email"

## Step 15: Add More People

To build your family tree:

1. Create parent documents:
   - Set their `gender`, names, dates
   - Leave `father_id` and `mother_id` as `null` if unknown

2. Link the first person to parents:
   - Edit your first person document
   - Set `father_id` to the father's document ID
   - Set `mother_id` to the mother's document ID

3. Add siblings:
   - Create new people with same `father_id` and `mother_id`
   - Use `sibling_order`: `"a"`, `"b"`, `"c"` for birth order

4. Add spouse:
   - Create spouse document
   - Edit your person's `unions` array, add object:
     ```json
     {
       "spouse_id": "spouse_document_id",
       "marriage_date": "2010-06-15",
       "marriage_place": "City, Country"
     }
     ```

**Important**: The tree automatically computes children by finding people whose `father_id` or `mother_id` match a person's `id`.

## Troubleshooting

### Error: "Permission denied"
- Check rules are deployed: `firebase deploy --only firestore:rules`
- Verify rules allow public read: `allow read: if true`

### Error: "Auth domain not authorized"
- Add your domain in Authentication → Settings → Authorized domains

### No data showing
- Check browser console for errors (F12)
- Verify person document has required fields: `id`, `gender`, `display_name`
- Ensure Firebase config in `firebase-init.js` is correct

### Tree not rendering
- At least one person must exist in `trees/main/people`
- Person must have `gender` field set to "M" or "F"
- Check that document ID matches the `id` field inside

## Data Structure Reference

See [DATA_STRUCTURE.md](DATA_STRUCTURE.md) for:
- Complete field definitions
- Example documents
- Field validation rules
- Best practices

## Security Best Practices

1. **Keep service account keys secure** - Never commit to git
2. **Use strong passwords** for admin accounts
3. **Enable 2FA** on your Google account
4. **Review Firestore usage** regularly in console
5. **Set billing alerts** to avoid unexpected charges

## Next Steps

After setup is complete:

1. Add more family members to your tree
2. Test all three languages (EN/FR/VI)
3. Deploy to GitHub Pages (see [IMPLEMENTATION_PHASES.md](IMPLEMENTATION_PHASES.md))
4. Begin Phase 4 (Enhanced Features)

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- Project issues: See [IMPLEMENTATION_PHASES.md](IMPLEMENTATION_PHASES.md)
