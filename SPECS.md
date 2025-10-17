Product name

Race Across the World — Route & Checkpoint Tracker (RATW Tracker)

1) Purpose

A lightweight, production‑side web application to manage team routes, connections, and leg progress during the filming of Race Across the World. The tool supports fast updates when contestants make new choices, provides real‑time overviews, and ensures continuity across sessions.

2) Core requirements

Auto‑save and auto‑load: Application state persists locally and/or to a database. Any action (adding a route, editing a connection, switching legs) is saved immediately. On reopening, the last saved state is loaded automatically.

Multi‑team tracking: Default setup for 5 teams, each with an independent route view.

Leg selector: Dropdown or navigation to switch between legs (1 through 6).

Transport plotting: Ability to add transport connections:

Type (bus, taxi, private lift, walking, ferry, etc.)

Departure time

Arrival time

From city → To city

Cost (optional)

Mandatory breaks: Insert stops (e.g., overnight, waiting, jobs) that adjust timeline and arrival forecasts.

Dynamic overview: Generate an overview of each team’s progress through the leg (timeline view + table summary).

Customizability: Editing, reordering, or deleting routes as contestants change plans. Immediate recalculation of arrival times.

Leg progression: Each team can progress independently but tied to the current leg.

3) Users & roles

Production staff (primary) — edit and update transport routes and checkpoints in real time.

Producers/Post (secondary) — view‑only access to team progress per leg.

No public/contestant access. Authentication can be light (internal use only).

4) Technical features

Frontend: React (with hooks, context for state), styled components or Tailwind.

Backend: Node.js + Express or serverless functions. Lightweight DB (SQLite, Supabase, or Firebase) for persistence.

State handling: Auto‑save via API or localStorage fallback if offline.

Visualization: Table + timeline/graph view per team.

Deployment: GitHub + Vercel/Netlify for quick deployment.
