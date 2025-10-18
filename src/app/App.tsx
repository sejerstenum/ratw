import { useState } from 'react';
import { LEG_NUMBERS, type LegNumber } from '../features/legs/legs.types';
import { LegView } from '../pages/LegView';
import { TEAMS, type TeamId } from '../features/teams/teams.types';

const App = () => {
  const [selectedLeg, setSelectedLeg] = useState<LegNumber>(1);
  const [selectedTeam, setSelectedTeam] = useState<TeamId>('A');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>RATW Tracker — Dev Controls</h1>
          <p className="subtitle">
            Iterate on segment models &amp; in-memory store. Add, edit, and delete segments for each
            team to validate behaviour before persistence is introduced.
          </p>
        </div>
        <div className="filters">
          <label className="filter">
            <span>Leg</span>
            <select
              value={selectedLeg}
              onChange={(event) => setSelectedLeg(Number(event.target.value) as LegNumber)}
            >
              {LEG_NUMBERS.map((legNumber) => (
                <option key={legNumber} value={legNumber}>
                  Leg {legNumber}
                </option>
              ))}
            </select>
          </label>
          <label className="filter">
            <span>Team</span>
            <select
              value={selectedTeam}
              onChange={(event) => setSelectedTeam(event.target.value as TeamId)}
            >
              {TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main>
        <LegView leg={selectedLeg} teamId={selectedTeam} />
      </main>
    </div>
  );
};

export default App;
