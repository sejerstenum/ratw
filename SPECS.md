# SPECS.md — Race Across the World (RATW) Tracker

## 0) Product

**Name:** RATW Tracker — Route & Checkpoint Planner
**Audience:** Production staff (field + office), post, safety
**Goal:** Track possible routes (bus, taxi, private lifts), forecast arrivals to next checkpoints, and keep a live, editable overview per team and leg.

---

## 1) Scope (MVP)

* **5 Teams** supported out of the box (configurable later).
* **Leg selector:** Choose **Leg 1–6** globally; all views filter to the selected leg.
* **Connections plotting:** Add transport connections with **type** (bus/taxi/private lift/walking/ferry/etc.), **from → to city**, **departure**, **arrival**, **cost (optional)**, **notes**.
* **Mandatory breaks:** Insert **break/wait/overnight/job** blocks that adjust the route timeline and ETA.
* **Overview:** For each team, see a **timeline + table** of segments for the selected leg and a **forecasted arrival** at the next checkpoint.
* **Editable & resilient:** In‑place edits, reorder, delete. All dependent timings/forecasts update immediately.
* **Auto‑save & auto‑load:** Any change saves instantly; app loads last state on launch without user action.

### Non‑Goals (Phase 1)

* Live GPS tracking, map tiles, or crew logistics (can arrive in Phase 2).

---

## 2) Functional requirements

### 2.1 Teams & legs

* **Five teams** are created by default: Team A–E (renameable).
* Global **Leg Selector (1–6)** filters all data.
* Each team has a **route** composed of ordered **segments** (transport or break types).

### 2.2 Segment types

* **Transport:** bus, taxi, private lift, train, boat/ferry, walking.
* **Non‑transport:** break (rest), overnight, waiting, job.
  Each segment has: `id, teamId, legNo, type, fromCity, toCity, depTime, arrTime, cost?, currency?, notes?`.

### 2.3 Time rules & validation

* **Arrival must be after departure** (strict).
* Segments within a team+leg must not **overlap** (enforce or warn + suggest fix).
* **Mandatory break rules** (configurable presets): e.g., “overnight runs from 20:00 to 06:00” or explicit start/end.
* Changing any segment **recomputes** the downstream **forecasted arrival** to the next checkpoint.

### 2.4 Overview & forecasts

* **Team Overview** per leg:

  * cumulative elapsed time,
  * last completed city,
  * next checkpoint ETA (based on latest segment),
  * budget spent (optional) and remaining (if tracked).
* **Leg Summary**: table of all teams’ next checkpoint ETAs + latest status.

### 2.5 Editing flow

* Add a segment (form) → insert at selected index or append.
* Edit inline (times, cities, type, cost).
* Reorder via drag‑and‑drop.
* Delete with undo (10s snackbar).

### 2.6 Persistence (auto‑save/load)

* **Auto‑save** on every confirmed edit (debounced 250–500 ms).
* **Primary storage:** Cloud DB (e.g., Supabase/Firebase/SQLite via API).
* **Offline fallback:** localStorage/IndexedDB queue with background sync + conflict prompts.
* **Auto‑load** restores last workspace (selected leg, expanded team, unsynced drafts).

### 2.7 Import/Export

* Export selected leg/team as **CSV/Excel** (UTF‑8, semicolon‑aware).
* Import CSV with column mapping wizard; validate and report errors before commit.

### 2.8 Role access (lightweight)

* **Editor** (default): full CRUD.
* **Viewer:** read‑only.
* Auth via email/password or magic link. (No public access.)

---

## 3) UX & UI

* **Global header:** Leg selector (1–6), team quick filters, search by city.
* **Main pane:** For selected team → **Route Table** (segments) + **Timeline**.
* **Right pane:** **Leg Summary** (all teams’ ETAs and latest city).
* **Status indicators:** saving…, saved, offline, conflict.
* **Keyboard affordances:** Enter to save, Esc to cancel, ↑/↓ navigate rows.

---

## 4) Architecture

* **Frontend:** React + Vite, TypeScript, Tailwind.

* **State:** React Query (server state) + Zustand/Context (UI state).

* **Backend:** Node/Express (or Supabase RPC).

* **DB schema (minimal):**

  * `seasons(id, name)` (future‑proof)
  * `legs(id, number, name?, seasonId)`
  * `teams(id, code, name)`
  * `segments(id, teamId, legNo, type, fromCity, toCity, depTime, arrTime, cost, currency, notes, orderIdx)`
  * `user_settings(userId, lastLeg, uiPrefs)`

* **Time handling:** store **ISO 8601** UTC; display in user’s local TZ; guard against DST.

---

## 5) Autosave details

* Debounce write; display **non‑blocking** “Saving…” → “Saved”.
* Network failures queue writes; retry with exponential backoff.
* Conflict strategy: last‑write‑wins with **diff preview** and **merge** option.

---

## 6) Calculations

* **ETA to next checkpoint:** last `arrTime` in team’s current leg where `toCity == checkpointCity` or final segment.
* **Elapsed time:** sum of `(arrTime - depTime)` for all leg segments (optionally excluding break types from “moving time”).
* **Validation helpers:** reject if `arrTime <= depTime`; warn if segments gap is negative; highlight overlaps.

---

## 7) Testing & QA

* **Unit tests:** time validation, overlap detection, ETA calc.
* **Integration:** autosave queue, offline recovery, import/export round‑trip.
* **E2E (Playwright):** add/edit/reorder/delete scenario per team, per leg.

---

## 8) Performance & reliability

* Virtualize long tables; O(1) reorder via `orderIdx`.
* Guardrails for massive copy/paste imports.
* Service worker for PWA offline shell + background sync.

---

## 9) Security & privacy

* Role‑based permissions; all endpoints behind auth.
* HTTPS only; CSRF protection; input sanitation.
* Minimal PII (names only); no passports stored in MVP.

---

## 10) Acceptance criteria (MVP)

1. I can select **Leg 1–6**; all views filter accordingly.
2. I can add/edit/reorder/delete segments for **each of 5 teams**.
3. The app **auto‑saves** every change and **auto‑loads** previous state on relaunch.
4. Mandatory breaks affect ETAs.
5. Overlaps are flagged; invalid times are blocked.
6. CSV export/import works with validation.
7. Works offline and reconciles on reconnect without data loss.
