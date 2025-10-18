# PLAN.md — Iterative Implementation Plan

This plan breaks the RATW Tracker MVP into short iterations you can test end‑to‑end. Each iteration includes **goals, scope, acceptance criteria, test script, and deliverables**. Branch naming follows `feat/<topic>`; merge via PR into `dev`, then into `main` when stable.

## Status

- [x] Iteration 0 — Repo scaffold & CI
- [x] Iteration 1 — Domain models & state layer
- [x] Iteration 2 — Leg selector (1–6) & team tabs (A–E)
- [x] Iteration 3 — RouteTable (editable grid) + validation
- [ ] Iteration 4 — Mandatory breaks & ETA calculations
- [ ] Iteration 5 — Autosave & autoload (local + cloud API)
- [ ] Iteration 6 — Summary panel & timeline view
- [ ] Iteration 7 — Import/Export (CSV/Excel)
- [ ] Iteration 8 — Polish, access control, and release

---

## Iteration 0 — Repo scaffold & CI

**Goals:** Vite + React + TypeScript, Tailwind, linting, testing, CI.
**Scope:**

* Scaffold project; add Tailwind; add ESLint + Prettier + Husky (pre‑commit lint/typecheck).
* Add Jest/Vitest + Playwright; GitHub Actions (build + unit + e2e).
* Commit baseline docs: SPECS.md, AGENTS.md, PLAN.md.

**Acceptance:**

* `npm run dev` serves app; `npm run test` and GH Actions pass.
* README has quick‑start.

**Test script:**

1. Clone; `npm i`; `npm run dev`.
2. Run `npm run test` (unit) and `npm run test:e2e` (placeholder e2e).
3. Confirm Tailwind styles render.

**Deliverables:** `main` with working scaffold.

---

## Iteration 1 — Domain models & state layer

**Goals:** Types and stores for Legs, Teams, Segments; stub UI.
**Scope:**

* Define TypeScript types/enums (segment types, leg numbers 1–6, Team A–E).
* Create local in‑memory store (Zustand/Context) with CRUD for segments.
* Seed with sample data for five teams on Leg 1.

**Acceptance:**

* Add/edit/delete segments in memory via dev UI panel (no persistence yet).
* Types compile under `--strict`.

**Test script:**

* Add a bus segment; edit times; delete; ensure order index updates.

**Deliverables:** `feat/models-state`, PR → `dev`.

---

## Iteration 2 — Leg selector (1–6) & team tabs (A–E)

**Goals:** Global leg filter and quick team switching.
**Scope:**

* LegSelector component (persist to URL `?leg=` and local UI state).
* TeamTabs with five tabs; keyboard nav.
* Views filter by leg + team.

**Acceptance:**

* Changing leg updates the table to the correct segments.
* URL reflects active leg; refresh preserves selection.

**Test script:**

* Switch to Leg 3; add a segment; switch to Leg 1; verify separation.

**Deliverables:** `feat/leg-selector-tabs`.

---

## Iteration 3 — RouteTable (editable grid) + validation

**Goals:** Inline editing with rules.
**Scope:**

* RouteTable with rows: type, fromCity, toCity, depTime, arrTime, cost, notes.
* Validation: arr > dep; non‑overlapping within team+leg; friendly messages.
* Reorder via drag handle (DnD‑Kit).
* Undo delete (toast 10s).

**Acceptance:**

* Cannot save invalid times/overlaps.
* Reordering persists visually and in store.

**Test script:**

* Create overlapping segment → see error; fix → save; delete → undo.

**Deliverables:** `feat/route-table` with unit tests for validators.

---

## Iteration 4 — Mandatory breaks & ETA calculations

**Goals:** Break presets and next‑checkpoint ETA.
**Scope:**

* Segment presets: `break`, `overnight (20:00–06:00)`, `waiting`, `job`.
* Helpers to compute cumulative elapsed time (movement vs all) and ETA to next checkpoint (last segment’s arrival or `toCity == checkpointCity`).

**Acceptance:**

* Inserting an overnight adjusts ETA accordingly.
* Elapsed time & ETA recompute on edit/reorder.

**Test script:**

* Add transport + overnight + transport; verify ETA shift.

**Deliverables:** `feat/breaks-eta` with unit tests for time math.

---

## Iteration 5 — Autosave & autoload (local + cloud API)

**Goals:** Persistence with offline tolerance.
**Scope:**

* Autosave queue (debounced 300ms) to local IndexedDB.
* Simple backend or Supabase table for segments, teams, legs.
* Sync on reconnect; conflict banner (last‑write‑wins + diff preview).
* Restore last leg/team on launch.

**Acceptance:**

* Close tab → reopen → state restored.
* Toggle offline in devtools, make edits, go online → changes sync.

**Test script:**

* Edit segment while offline; verify outbox drains after reconnect.

**Deliverables:** `feat/persistence-autosave` with integration tests.

---

## Iteration 6 — Summary panel & timeline view

**Goals:** At‑a‑glance leg status per team + visual timeline.
**Scope:**

* SummaryPanel: ETA next checkpoint, last city, elapsed time for all five teams.
* Timeline bars aligned with RouteTable rows; hover details; scroll‑sync.

**Acceptance:**

* Changes in table reflect instantly in summary & timeline.

**Test script:**

* Modify arrival time; see immediate update in both views.

**Deliverables:** `feat/summary-timeline`.

---

## Iteration 7 — Import/Export (CSV/Excel)

**Goals:** Seamless data I/O for spreadsheets.
**Scope:**

* Export current leg/team to CSV; semicolon aware.
* Import wizard with column mapping, preview, and error report; no partial commits.

**Acceptance:**

* Round‑trip: export → edit in Excel → import → identical data set.
* Bad rows are reported with line numbers & reasons.

**Test script:**

* Import with a row where arr ≤ dep → blocked with message.

**Deliverables:** `feat/io-csv` with unit tests for parser.

---

## Iteration 8 — Polish, access control, and release

**Goals:** Viewer role, a11y, performance, docs.
**Scope:**

* Auth light (viewer/editor); protect routes; HTTPS only.
* Virtualize RouteTable for >200 rows; keyboard nav.
* Update docs; add screenshots/GIFs; version tag `v1.0.0`.

**Acceptance:**

* Viewer can’t edit; Editor can.
* No console errors; Lighthouse a11y ≥ 90 on core screens.

**Test script:**

* Log in as viewer; confirm edit controls disabled.

**Deliverables:** `release/1.0.0` tag on `main`.

---

## Branch & PR policy

* Create feature branches per iteration.
* Open PRs early; CI must pass; require at least one approval.
* Use Conventional Commits; attach short loom/GIF for UI PRs.

---

## Test data seed (example)

* Teams A–E; Leg 1 with 2–3 segments each (bus + overnight + bus).
* Checkpoint city for Leg 1: `Santarém` (example).
* Times spanning 2025‑10‑27 to 2025‑10‑30 (ISO UTC).

---

## Rollback & recovery

* Keep daily DB backups; export CSV after each filming day.
* Feature flags for Timeline and Import until stable.
* If persistence fails, app falls back to IndexedDB and warns the user.
