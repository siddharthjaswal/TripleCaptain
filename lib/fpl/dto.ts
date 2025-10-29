export type ProfileDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  overallPoints: number;
  overallRank: number | null;
};

export type TotalsDTO = {
  entryId: number;
  currentEvent: number;
  totalPoints: number;
  overallRank: number | null;
};

export type LatestGwDTO = {
  entryId: number;
  event: number;
  points: number;
  rank: number | null;
  pointsOnBench: number;
  chipUsed: string | null;
  isLive: boolean;
  isFinished: boolean;
  players: LatestGwPlayerDTO[];
};

export type GameweekDeadlineDTO = {
  nextGameweek: number;
  deadline: string;
  isBeforeDeadline: boolean;
};

export type SummaryDTO = {
  profile: ProfileDTO;
  totals: TotalsDTO;
  latest: LatestGwDTO;
  nextDeadline: GameweekDeadlineDTO | null;
};

export type LatestGwPlayerDTO = {
  elementId: number;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  slot: number;
  isBench: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  multiplier: number;
  points: number;
  rawPoints: number;
  photo: string | null;
  teamId: number | null;
  teamCode: number | null;
};

export type LeagueSummaryDTO = {
  id: number;
  name: string;
  shortName: string | null;
  entryRank: number | null;
  entryLastRank: number | null;
  type: "classic" | "h2h";
};

export type LeagueTableEntryDTO = {
  entryId: number;
  rank: number | null;
  lastRank: number | null;
  entryName: string;
  playerName: string;
  points: number;
  totalPoints: number;
};

export type LeagueStandingDTO = {
  leagueId: number;
  leagueName: string;
  page: number;
  hasNextPage: boolean;
  gameweek: number | null;
  entries: LeagueTableEntryDTO[];
};

export type LeaguesViewDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  currentEvent: number | null;
  leagues: LeagueSummaryDTO[];
  selectedLeagueId: number | null;
  selectedLeague: LeagueStandingDTO | null;
};

export type FixtureDTO = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamBadge: string;
  awayTeamBadge: string;
  homeScore: number | null;
  awayScore: number | null;
  kickoffTime: string | null;
  finished: boolean;
  started: boolean;
};

export type FixturePlayerDTO = {
  elementId: number;
  name: string;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  multiplier: number;
};

export type FixturesViewDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  event: number;
  fixtures: FixtureDTO[];
  playersByFixture: Map<number, FixturePlayerDTO[]>;
};
