# RATW Tracker

The RATW Tracker is a planning tool for Race Across the World production teams. It keeps track of every team, their current leg, and their transport segments so the crew can forecast arrivals and coordinate logistics.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm 9+

## Getting started

```bash
npm install
npm run dev
```

This starts Vite on [http://localhost:5173](http://localhost:5173). The dev server automatically reloads when you edit files.

## Node BFF (MySQL persistence)

The frontend now talks to a lightweight Node/Express backend-for-frontend that stores segment snapshots in MySQL.

1. Create a `.env` file with your database credentials:

   ```bash
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   MYSQL_USER=ratw
   MYSQL_PASSWORD=super-secret
   MYSQL_DATABASE=ratw
   SEGMENTS_TABLE=segment_snapshots
   SEGMENTS_DATASET=default
   CORS_ORIGIN=http://localhost:5173
   ```

2. Start the backend:

   ```bash
   npm run server
   ```

   The service listens on port `4000` by default and automatically creates the `segment_snapshots` table if it does not exist.

3. In a second terminal start the Vite dev server with `npm run dev`. Requests to `/api/*` are proxied to the backend during development. When deploying the frontend separately, set `VITE_BFF_URL` to the BFF base URL (for example, `https://tracker.example.com/api`).

## Available scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and build the production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint against the project. |
| `npm run typecheck` | Run TypeScript in no-emit mode. |
| `npm run test` | Execute unit tests with Vitest. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:e2e` | Execute Playwright end-to-end tests. |

## Tooling

- **React + TypeScript** — core UI framework
- **Vite** — development server and bundler
- **Tailwind CSS** — utility-first styling
- **ESLint + Prettier** — linting and formatting
- **Vitest + Testing Library** — unit testing
- **Playwright** — end-to-end testing

## Continuous integration

GitHub Actions run linting, type checks, unit tests, Playwright tests, and the production build on every pull request.

## Documentation

- [SPECS.md](./SPECS.md)
- [PLAN.md](./PLAN.md)
- [AGENTS.md](./AGENTS.md)
