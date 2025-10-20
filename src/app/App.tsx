import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { LegSelector } from '../components/LegSelector';
import { TeamTabs } from '../components/TeamTabs';
import { RouteTable } from '../components/RouteTable/RouteTable';
import { SegmentsDevPanel } from '../features/segments/SegmentsDevPanel';
import { useSegmentsPersistence } from '../features/segments/segments.persistence';
import { LEG_NUMBERS, TEAM_IDS, type LegNumber, type TeamId } from '../features/segments/segments.types';

const DEFAULT_LEG: LegNumber = 1;
const DEFAULT_TEAM: TeamId = 'A';
const LEG_PREFERENCE_KEY = 'ratw:lastLeg';
const TEAM_PREFERENCE_KEY = 'ratw:lastTeam';

const parseLegParam = (value: string | null): LegNumber | null => {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return LEG_NUMBERS.includes(parsed as LegNumber) ? (parsed as LegNumber) : null;
};

export function App() {
  useSegmentsPersistence();
  const [searchParams, setSearchParams] = useSearchParams();
  const legParam = searchParams.get('leg');
  const parsedLeg = parseLegParam(legParam);
  const preferredLeg = useMemo<LegNumber | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem(LEG_PREFERENCE_KEY);
    if (!stored) {
      return null;
    }
    const numeric = Number(stored);
    return LEG_NUMBERS.includes(numeric as LegNumber) ? (numeric as LegNumber) : null;
  }, []);
  const activeLeg = parsedLeg ?? preferredLeg ?? DEFAULT_LEG;
  const [activeTeam, setActiveTeamState] = useState<TeamId>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_TEAM;
    }
    const stored = window.localStorage.getItem(TEAM_PREFERENCE_KEY) as TeamId | null;
    return stored && TEAM_IDS.includes(stored) ? stored : DEFAULT_TEAM;
  });

  const setActiveTeam = (team: TeamId) => {
    setActiveTeamState(team);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TEAM_PREFERENCE_KEY, team);
    }
  };

  useEffect(() => {
    if (parsedLeg === null && legParam !== null) {
      const next = new URLSearchParams(searchParams);
      next.delete('leg');
      setSearchParams(next, { replace: true });
    }
  }, [legParam, parsedLeg, searchParams, setSearchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(LEG_PREFERENCE_KEY, String(activeLeg));
  }, [activeLeg]);

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
          <h2 className="text-xl font-semibold">Iteration 5 · Autosave &amp; offline persistence</h2>
          <p className="mt-3 text-sm text-slate-300">
            The tracker now keeps working without a connection. Segments autosave to IndexedDB, queue for cloud sync, and
            raise a conflict banner if another device writes fresher data while you were offline.
          </p>
          <div className="mt-6 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <h3 className="font-medium text-white">What&apos;s new</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Debounced autosave queue that persists segments to IndexedDB every 300ms.</li>
                <li>Offline outbox with automatic cloud sync once connectivity returns.</li>
                <li>Conflict banner with a diff preview and controls to accept or override remote changes.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <h3 className="font-medium text-white">Up next</h3>
              <ul className="mt-2 space-y-1 text-slate-300">
                <li>Visual timeline synced with the Route Table.</li>
                <li>Leg summary panel for cross-team monitoring.</li>
                <li>Import and export flows for spreadsheet parity.</li>
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
