export const TEAM_IDS = ['A', 'B', 'C', 'D', 'E'] as const;

export type TeamId = (typeof TEAM_IDS)[number];

export interface Team {
  id: TeamId;
  name: string;
}

export const TEAMS: Team[] = TEAM_IDS.map((id) => ({
  id,
  name: `Team ${id}`,
}));
