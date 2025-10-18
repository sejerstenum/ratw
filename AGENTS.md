# AGENTS.md — File Structure, Conventions, Do’s & Don’ts

This document is for engineers (and Codex) working on RATW Tracker. It defines **project layout**, **naming**, **component responsibilities**, **Git workflow**, and **code standards** to keep the codebase small, fast, and reliable on location.

---

## 1) Repo structure

```
ratw-tracker/
├─ .editorconfig
├─ .env.example
├─ .gitignore
├─ package.json
├─ README.md
├─ SPECS.md
├─ AGENTS.md
├─ vite.config.ts
├─ tsconfig.json
├─ public/
│   └─ index.html
└─ src/
    ├─ app/
    │   ├─ App.tsx
    │   └─ routes.tsx
    ├─ components/
    │   ├─ LegSelector.tsx
    │   ├─ TeamTabs.tsx
    │   ├─ RouteTable/
    │   │   ├─ RouteTable.tsx
    │   │   ├─ SegmentRow.tsx
    │   │   └─ NewSegmentRow.tsx
    │   ├─ Timeline/
    │   │   └─ Timeline.tsx
    │   ├─ SummaryPanel.tsx
    │   └─ UI/ (buttons, inputs, modal, toast)
    ├─ features/
    │   ├─ legs/
    │   │   ├─ legs.api.ts
    │   │   └─ legs.store.ts
    │   ├─ teams/
    │   │   ├─ teams.api.ts
    │   │   └─ teams.store.ts
    │   ├─ segments/
    │   │   ├─ segments.api.ts
    │   │   ├─ segments.store.ts
    │   │   └─ segments.validators.ts
    │   └─ auth/
    │       ├─ auth.api.ts
    │       └─ useAuth.ts
    ├─ lib/
    │   ├─ time.ts (ISO handling, tz, overlap checks)
    │   ├─ autosave.ts (debounce + queue)
    │   ├─ storage.ts (IndexedDB/localStorage adapter)
    │   └─ csv.ts (import/export helpers)
    ├─ pages/
    │   ├─ LegView.tsx (default view: selector + team overview + table + timeline)
    │   └─ TeamView.tsx (focused work per team)
    ├─ styles/
    │   └─ index.css (Tailwind)
    └─ tests/
        ├─ unit/
        │   ├─ time.spec.ts
        │   ├─ validators.spec.ts
        │   └─ autosave.spec.ts
        └─ e2e/
            └─ leg_routing.spec.ts
```

---

## 2) Naming & data conventions

* **TypeScript first.** All `.tsx/.ts` with strict mode.
* Times stored as **ISO 8601 (UTC)** strings: `YYYY-MM-DDTHH:mm:ssZ`. Display local TZ only in UI.
* Segment keys: `id, teamId, legNo, type, fromCity, toCity, depTime, arrTime, cost?, currency?, notes?, orderIdx`.
* Segment `type` enum: `"bus" | "taxi" | "privateLift" | "train" | "boat" | "walk" | "break" | "overnight" | "waiting" | "job"`.
* Avoid nullable where possible; prefer explicit empty arrays or defaults.

---

## 3) Components & responsibilities

* **LegSelector**: pick **1–6**; persists to `user_settings` and URL (e.g., `?leg=3`).
* **TeamTabs**: five tabs (A–E); keyboard‑navigable.
* **RouteTable**: editable grid for segments with inline validate; shows save state per row. Keep the table `table-fixed` with `min-w-0` cells and `break-words`/`whitespace-pre-wrap` classes on Type/From/To spans so long city names wrap instead of overflowing.
* **Timeline**: visual bar chart of segments with hover details; scroll‑sync with table.
* **SummaryPanel**: per‑team ETA to next checkpoint, last city, cumulative elapsed time.
* **Toasts/Modals**: non‑blocking confirmations; undo delete (10s).

---

## 4) Autosave & offline

* Use a **debounced queue** (single writer).
* UI shows **Saving / Saved / Offline**.
* Failed writes retry with backoff; keep an **outbox** in IndexedDB.
* Conflict policy: last‑write‑wins + diff banner; offer **Apply Theirs / Keep Mine / Merge**.

---

## 5) Validation & rules

* Block save if `arrTime <= depTime`.
* Highlight **overlaps** within the same team+leg.
* Standardize **mandatory breaks** (config presets); breaks count toward elapsed time but flagged as non‑movement.

---

## 6) Git workflow (with Codex)

* **Branches:** `main` (stable), `dev` (integration), `feat/*`, `fix/*`.
* **Commits:** Conventional Commits, e.g., `feat(segments): add reorder drag handle`.
* **PRs:** small, focused; include screenshots/GIF and test notes.
* **Reviews:** 1 approval required; CI must pass (lint, typecheck, tests).
* **Releases:** semantic versioning; tag on `main`.

**Commit message template**

```
<type>(<scope>): <summary>

[why]
[what]
[how tested]
```

---

## 7) Environment & scripts

* `NODE_ENV`, `VITE_API_URL` in `.env` / `.env.local`.
* Scripts: `dev`, `build`, `preview`, `test`, `lint`, `typecheck`.

---

## 8) Do’s & Don’ts

### Do’s

* Do keep components small and pure; lift state up sparingly.
* Do unit‑test **time math** and **autosave**.
* Do guard against DST/timezone pitfalls by always storing UTC.
* Do virtualize tables if rows > 200.
* Do handle import errors gracefully with a diff preview before commit.

### Don’ts

* Don’t hard‑code teams or legs; use config/state.
* Don’t block the UI during network calls.
* Don’t assume continuous connectivity.
* Don’t introduce map/GPS until MVP ships.

---

## 9) PR checklist

* [ ] Types pass (`tsc --noEmit`)
* [ ] Unit tests added/updated
* [ ] No console errors/warnings
* [ ] Accessibility basics: labels, focus order, keyboard nav
* [ ] Screenshots/GIF of UI change
* [ ] Docs updated (SPECS/README)

---

## 10) Future extensions

* Map overlay (Leaflet/Mapbox), crew logistics, role RBAC, FX budgets, checkpoint forms, audit log, SSO/2FA.
