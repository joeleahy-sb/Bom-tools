# BOM Changeover Tool

A collaborative web application for managing bill-of-materials (BOM) revision changeovers. Upload two BOM revisions, review what changed, validate the new build part-by-part, and track the full changeover workflow — all in real time across your team.

**Live app:** https://bom-validation.web.app

---

## What It Does

When a product BOM revision changes, engineers and production teams need to:

1. **Understand what changed** — which parts were added, removed, revised, or moved between sub-assemblies
2. **Review compatibility** — is the new BOM forward/backward compatible? What's the justification?
3. **Validate the build** — check every part in the new BOM off against physical inventory
4. **Orchestrate the changeover** — communicate to sourcing, update MES, print labels, run a test build

This tool covers all four steps in a single shared workspace. Any team member who opens the URL sees the same live state — no refresh needed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 (with Vite) |
| Styling | Inline styles using shared design tokens (`theme.js`) |
| Font | JetBrains Mono — optimized for P/N readability |
| Auth | Firebase Authentication (Google Sign-In) |
| Database / real-time sync | Firebase Firestore (`onSnapshot` listener) |
| Hosting | Firebase Hosting |
| Build tool | Vite 7 |

---

## Project Structure

```
bom-changeover-tool/
├── index.html                      # HTML shell (Vite entry point)
├── vite.config.js                  # Vite config (minimal)
├── package.json
└── src/
    ├── main.jsx                    # React root — mounts App into #root
    ├── index.css                   # Global CSS resets, scrollbar, animations
    ├── App.jsx                     # Root component — all state lives here
    ├── firebase.js                 # Firebase app init + Firestore export
    ├── theme.js                    # Design tokens (colors, typography)
    │
    ├── utils/
    │   ├── bomParser.js            # CSV/TSV parsing + sub-assembly grouping
    │   ├── bomDiff.js              # BOM comparison logic
    │   ├── bomExport.js            # CSV export for Part Mapping tab
    │   └── buildChecklist.js       # Generates the 8-phase changeover checklist
    │
    ├── hooks/
    │   ├── useAuth.js              # Google Sign-In auth state + domain enforcement
    │   ├── useFirestore.js         # Real-time Firestore subscribe + debounced save
    │   └── useValidation.js        # partKey helper + validation progress stats
    │
    └── components/
        ├── common/
        │   ├── Header.jsx          # Sticky top bar with user info, sign-out, saving indicator
        │   ├── TabNav.jsx          # Tab switcher with badge counts
        │   └── DropZone.jsx        # Drag-and-drop file upload zone
        ├── LoginScreen.jsx         # Google Sign-In screen (shown when unauthenticated)
        ├── UploadView.jsx          # Initial upload screen + metadata form
        ├── MappingTab.jsx          # Part Mapping review table
        ├── ValidationTab.jsx       # Build Validation checklist
        ├── ChangeoverChecklist.jsx  # 8-phase workflow checklist
        ├── LabelsTab.jsx           # Label printing + alternates reference
        └── SourcingTab.jsx         # Sourcing impact summary
```

---

## User Flow

### 0. Sign In
Users must sign in with a `@standardbots.com` Google account. The login screen shows a **Sign in with Google** button. The Google sign-in popup is pre-filtered to the standardbots.com domain. Any attempt to sign in with a non-standardbots.com account is rejected immediately. The signed-in user's avatar, email, and a **Sign out** button appear in the top-right of the header.

### 1. Upload
Drag and drop (or click to browse) two BOM files — old revision and new revision. Supported formats: `.csv`, `.tsv`, `.txt`. Fill in optional metadata (product name, revisions, target date) then click **Generate** to run the diff and open the tabs.

### 2. Part Mapping tab
All changed parts organized into five color-coded sections:
- **Revision Changes** — same base P/N, different rev suffix
- **Added Parts** — P/Ns only in the new BOM
- **Removed Parts** — P/Ns only in the old BOM
- **Quantity Changes** — same P/N, different quantity
- **Moved Parts** — same P/N but parent sub-assembly has a rev change

For each part, fill in forward/backward compatibility, justification, alternates, and a status (`needs_review` → `confirmed` / `rejected`). Use **Export Mapping CSV** to download the full table.

### 3. Build Validation tab
Every part in the new BOM listed by sub-assembly tab. For each part:
- Check off the checkbox when physically verified
- Toggle **Not Needed** (yellow) for parts that don't apply to this build
- Add a **note** for anything requiring attention
- Use **Add Missing Part** (red dashed button) to manually log parts not on the BOM

A progress bar per sub-assembly tracks completion. The **Show Summary** button lists all flagged and missing items across all sections.

### 4. Changeover Checklist tab
Eight workflow phases with ownership and auto-generated action items:

| # | Phase | Owner |
|---|---|---|
| 1 | Initiation & ECN | Hardware + Process Eng |
| 2 | Part Mapping Review | Hardware → Production |
| 3 | Sourcing & Procurement | Production → Sourcing |
| 4 | Test Build | Process Eng + Assembly |
| 5 | Marvin & MES Setup | Process Engineer |
| 6 | Labeling & Changeover | Process Eng + Inventory |
| 7 | Communication & Rollout | Process Engineer |
| 8 | Verification & Closeout | Process Eng + Assembly Lead |

Action items are populated from the diff — e.g. Phase 2 lists the specific added/removed parts, Phase 6 calculates how many labels to print.

### 5. Labels & Alternates tab
Quick reference for the parts team: which parts need new labels (with reason), and which old revisions are suggested as alternates in MES.

### 6. Sourcing Impact tab
Three panels: new POs needed, orders to cancel or reduce, and quantity adjustments with delta highlighted green/red.

---

## Architecture

### State Management

All application state lives in `App.jsx` and is passed down as props. No external state library (Redux, Zustand, etc.) is used — the state tree is flat enough that one level of prop drilling is clean.

**Key state variables:**

| Variable | Type | Purpose |
|---|---|---|
| `oldRows` / `newRows` | `NormalisedRow[]` | Parsed BOM data |
| `metadata` | `{ product, oldRev, newRev, date }` | Changeover context |
| `mappingEdits` | `{ [fullPN]: { fwd, bwd, just, alt, status } }` | User edits per changed part |
| `checks` | `{ [partKey]: boolean }` | Checkbox state per part in Validation |
| `flags` | `{ [partKey]: 'not_needed' \| null }` | Flag state per part |
| `notes` | `{ [partKey]: string }` | Note text per part |
| `missingParts` | `{ [sectionName]: Part[] }` | Manually added missing parts |
| `phaseChecks` | `{ [itemId]: boolean }` | Checked items in Changeover Checklist |

`diff` and `newSections` are derived via `useMemo` — they recompute when `oldRows`/`newRows` change and are never stored directly in state.

### Real-Time Sync

State is persisted to a single Firestore document: `changeovers/current`.

```
useFirestore.js
  subscribe(onData)  →  onSnapshot listener  →  pushed to all clients (~200ms)
  save(data)         →  debounced 800ms       →  setDoc to Firestore
```

**Echo suppression:** Each write is stamped with `_savedAt: Date.now()`. When the resulting `onSnapshot` fires back on the same client, if `_savedAt` matches the last write, the update is skipped — preventing the user's own save from interrupting their current typing.

**Conflict resolution:** Last write wins. This is appropriate here — team members typically work on different parts/sections simultaneously.

### BOM Parsing (`utils/bomParser.js`)

Handles the variability of real-world BOM exports:

- **Encoding:** Tries UTF-8 first, falls back to UTF-16 (common for SolidWorks exports)
- **Delimiter:** Auto-detected (comma vs tab)
- **Column headers:** Fuzzy matched, case-insensitive — "Part Number", "PartNo", "P/N" all resolve correctly
- **Sub-assembly grouping:** Two strategies:
  - *Leveled item numbers* (e.g. `1`, `1.1`, `1.2`, `2`, `2.1`): groups by leading integer; top-level rows with no decimal children go to "Miscellaneous"
  - *Sub-category column:* groups by the `subCategory` field

Each row normalises to:
```js
{
  itemNo, pn, rev, desc, qty, uom,
  subCategory, procurementType,
  fullPN   // `${pn}-${rev}` — unique key used throughout the app
}
```

### BOM Diff (`utils/bomDiff.js`)

Parts are matched using `fullPN` (P/N + rev as one string). The diff produces:

```js
{
  added:      [],   // fullPN only in new BOM
  removed:    [],   // fullPN only in old BOM
  changed:    [],   // same base P/N, different rev
  qtyChanged: [],   // same fullPN, different total qty
  moved:      [],   // same fullPN, but parent sub-assembly rev-changed
  unchanged:  [],
}
```

**Rev change detection:** Strips the rev suffix and matches on base P/N. Same base P/N with different revs = rev change (not a separate add + remove).

**Moved part detection:** For each unchanged part, checks whether its parent sub-assembly appears in the `changed` list. If so, the part is flagged as "moved."

### Authentication (`hooks/useAuth.js`)

Authentication is handled via Firebase Auth with Google Sign-In.

```
useAuth.js
  onAuthStateChanged  →  sets user state (undefined = loading, null = signed out)
  signInWithPopup     →  Google OAuth popup, pre-filtered to standardbots.com
  domain check        →  signs out + shows error if email ∉ @standardbots.com
```

The `hd: 'standardbots.com'` parameter hints to Google to pre-select the right account in the popup. Domain enforcement happens in two places:

1. **Client-side** (`useAuth.js`): `onAuthStateChanged` checks `user.email.endsWith('@standardbots.com')` and immediately calls `signOut` if not matching
2. **Server-side** (`firestore.rules`): Firestore rejects all reads/writes unless `request.auth.token.email` matches `.*@standardbots\.com` and the email is verified

### Theme (`theme.js`)

All colors and semantic tokens are exported as `T`:

```js
import { T } from './theme';
// T.bg, T.card, T.border
// T.text, T.textMid, T.textSoft
// T.green, T.red, T.orange, T.blue, T.purple, T.accent
```

To restyle the entire app, edit `theme.js`. No colors are hardcoded in components.

---

## Local Development

```bash
cd bom-changeover-tool
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server uses the same Firebase project as production (`bom-validation`), so changes made during development will appear in the live app. Be mindful of this if others are actively using it.

---

## Build & Deploy

From the repo root (`Bom-tools/`):

```bash
npm run build --prefix bom-changeover-tool
firebase deploy
```

The `firebase.json` at the repo root points `"public"` at `bom-changeover-tool/dist`.

- **Firebase project:** `bom-validation`
- **Hosting URL:** https://bom-validation.web.app

---

## Modifying the Codebase

### Changing how BOMs are parsed
Edit `src/utils/bomParser.js`. Column header matching and row normalisation are in `parseCSVText()`. Sub-assembly grouping logic is in `parseBOMSections()`.

### Changing what the diff detects
Edit `src/utils/bomDiff.js`. `diffBOMs()` is a pure function with no side effects — safe to test in isolation.

### Editing checklist phases or action items
Edit `src/utils/buildChecklist.js`. Each phase is a plain object with an `items` array. Items have access to the `diff` object so action item text can reference specific part numbers.

### Adding a new tab
1. Create `src/components/YourTab.jsx`
2. Import it in `App.jsx`
3. Add an entry to the `tabs` array in `App.jsx`
4. Add a render condition: `{activeTab === 'yourtab' && <YourTab ... />}`
5. Pass whatever state the tab needs as props

### Changing colors or fonts
Edit `src/theme.js` for colors. Edit `src/index.css` for the font stack and global resets.

### Supporting multiple concurrent projects
The Firestore path is hardcoded as `changeovers/current` in `src/hooks/useFirestore.js` (`DOC_PATH` constant). To support multiple projects, replace it with a dynamic path (e.g. `changeovers/${projectId}`) and add a project selector to the upload screen.

---

## Firebase Notes

- **Firestore document:** `changeovers/current` — one document holds the entire app state
- **Firestore rules:** Defined in `firestore.rules` at the repo root. Deployed alongside the app via `firebase deploy`. Only authenticated `@standardbots.com` users with a verified email can read or write
- **API key:** The config in `src/firebase.js` is intentionally client-side — this is standard for Firebase web apps. Security is enforced by Firestore rules and Auth, not by hiding the key
- **Read/write volume:** Each client holds one persistent `onSnapshot` subscription (one read). Writes are debounced to at most one per 800ms of user activity
- **Adding a new user:** No action needed — any person with a `@standardbots.com` Google account can sign in automatically. Access is domain-based, not user-by-user
- **Revoking access:** Remove the user from your Google Workspace org, or restrict the Firebase Auth sign-in method in the Firebase Console

## Firebase Console Setup

When deploying to a new Firebase project, one manual step is required:

1. Go to **Firebase Console → Authentication → Sign-in method**
2. Enable **Google** as a sign-in provider
3. Save

Everything else (Firestore rules, hosting) is fully managed by `firebase deploy`.
