import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { LegSelector } from '../components/LegSelector';
import { TeamTabs } from '../components/TeamTabs';
import { RouteTable } from '../components/RouteTable/RouteTable';
import { SegmentsDevPanel } from '../features/segments/SegmentsDevPanel';
import { LEG_NUMBERS, type LegNumber, type TeamId } from '../features/segments/segments.types';

const DEFAULT_LEG: LegNumber = 1;
const DEFAULT_TEAM: TeamId = 'A';

const parseLegParam = (value: string | null): LegNumber | null => {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return LEG_NUMBERS.includes(parsed as LegNumber) ? (parsed as LegNumber) : null;
};

export function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const legParam = searchParams.get('leg');
  const parsedLeg = parseLegParam(legParam);
  const activeLeg = parsedLeg ?? DEFAULT_LEG;
  const [activeTeam, setActiveTeam] = useState<TeamId>(DEFAULT_TEAM);

  useEffect(() => {
    if (parsedLeg === null && legParam !== null) {
      const next = new URLSearchParams(searchParams);
      next.delete('leg');
      setSearchParams(next, { replace: true });
    }
  }, [legParam, parsedLeg, searchParams, setSearchParams]);

  const handleLegSelect = (leg: LegNumber) => {
    const next = new URLSearchParams(searchParams);
    if (leg === DEFAULT_LEG) {
      next.delete('leg');
    } else {
      next.set('leg', String(leg));
    }
    setSearchParams(next, { replace: true });
  };

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
          <h2 className="text-xl font-semibold">Iteration 4 · Mandatory breaks &amp; ETA forecasting</h2>
          <p className="mt-3 text-sm text-slate-300">
            Route management gains momentum: mandatory break presets now slot into the Route Table with one click, and
            the tracker computes live ETAs for the next checkpoint plus total vs moving time for each team.
          </p>
          <div className="mt-6 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <h3 className="font-medium text-white">What&apos;s new</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>One-click break, overnight, waiting, and job presets anchored to the latest segment.</li>
                <li>Automatic recalculation of moving vs total elapsed time per team and leg.</li>
                <li>Checkpoint ETA forecasting that updates whenever segments are edited or reordered.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <h3 className="font-medium text-white">Up next</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Autosave and offline-aware persistence.</li>
                <li>Visual timeline synced with the Route Table.</li>
                <li>Leg summary panel for cross-team monitoring.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <LegSelector className="w-full md:w-44" activeLeg={activeLeg} onSelect={handleLegSelect} />
            <TeamTabs
              activeTeam={activeTeam}
              className="justify-start md:justify-end"
              onSelect={setActiveTeam}
            />
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">
            Viewing Team {activeTeam} on Leg {activeLeg}
          </p>
        </section>

        <RouteTable legNo={activeLeg} teamId={activeTeam} />

        <SegmentsDevPanel activeLeg={activeLeg} activeTeam={activeTeam} />
      </main>
    </div>
  );
}

export default App;
