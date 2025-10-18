import type { KeyboardEvent } from 'react';

import { TEAM_IDS, type TeamId } from '../features/segments/segments.types';

interface TeamTabsProps {
  activeTeam: TeamId;
  onSelect: (team: TeamId) => void;
  className?: string;
}

const getNextIndex = (currentIndex: number, delta: number) => {
  const total = TEAM_IDS.length;
  return (currentIndex + delta + total) % total;
};

export function TeamTabs({ activeTeam, onSelect, className }: TeamTabsProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault();
        onSelect(TEAM_IDS[getNextIndex(index, 1)]);
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        onSelect(TEAM_IDS[getNextIndex(index, -1)]);
        break;
      }
      case 'Home': {
        event.preventDefault();
        onSelect(TEAM_IDS[0]);
        break;
      }
      case 'End': {
        event.preventDefault();
        onSelect(TEAM_IDS[TEAM_IDS.length - 1]);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div
      aria-label="Teams"
      className={`flex flex-wrap gap-2 ${className ?? ''}`.trim()}
      role="tablist"
    >
      {TEAM_IDS.map((team, index) => {
        const isActive = team === activeTeam;
        return (
          <button
            key={team}
            aria-selected={isActive}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              isActive
                ? 'bg-emerald-500 text-emerald-950 shadow shadow-emerald-500/30'
                : 'border border-slate-700 text-slate-200 hover:border-slate-500'
            }`}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => onSelect(team)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            Team {team}
          </button>
        );
      })}
    </div>
  );
}
