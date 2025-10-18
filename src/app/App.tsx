import { Link } from 'react-router-dom';

import { SegmentsDevPanel } from '../features/segments/SegmentsDevPanel';

export function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Race Across the World</p>
            <h1 className="text-2xl font-semibold">RATW Tracker</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link className="transition hover:text-white" to="/">
              Dashboard
            </Link>
            <a className="transition hover:text-white" href="https://github.com/" rel="noreferrer" target="_blank">
              Support
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-lg shadow-slate-950/60">
          <h2 className="text-xl font-semibold">Iteration 1 · Domain models in motion</h2>
          <p className="mt-3 text-sm text-slate-300">
            Segment, team, and leg types are now defined with a Zustand-powered in-memory store. Use the console below to seed
            new journeys, tweak timing, and prune entries before the richer route table arrives in the next iteration.
          </p>
          <div className="mt-6 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <h3 className="font-medium text-white">What&apos;s new</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Strict TypeScript enums for teams, legs, and segment types.</li>
                <li>Sample data for all five teams on Leg 1.</li>
                <li>Zustand store with add, edit, delete, and automatic ordering.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <h3 className="font-medium text-white">Up next</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Leg selector synced to URL state.</li>
                <li>Team tabs for quick context switching.</li>
                <li>Editable route table on top of this store.</li>
              </ul>
            </div>
          </div>
        </section>

        <SegmentsDevPanel />
      </main>
    </div>
  );
}

export default App;
