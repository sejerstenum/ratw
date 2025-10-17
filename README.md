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
