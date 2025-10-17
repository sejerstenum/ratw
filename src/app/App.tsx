import { Link } from 'react-router-dom';

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
          <h2 className="text-xl font-semibold">Welcome aboard</h2>
          <p className="mt-3 text-sm text-slate-300">
            This iteration sets up the tooling, design system, and testing harness for the RATW Tracker. Start the dev server and
            you&rsquo;ll find Tailwind utilities, routing, and testing ready to go for the next iterations of the plan.
          </p>
          <div className="mt-6 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <h3 className="font-medium text-white">Next steps</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Define domain models (Iteration 1).</li>
                <li>Implement leg selector and team tabs (Iteration 2).</li>
                <li>Build the editable route table (Iteration 3).</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <h3 className="font-medium text-white">Tooling check</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Linting &amp; formatting via ESLint + Prettier.</li>
                <li>Unit tests powered by Vitest + Testing Library.</li>
                <li>Playwright ready for end-to-end coverage.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
