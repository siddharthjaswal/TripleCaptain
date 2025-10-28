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
  players: LatestGwPlayerDTO[];
};

export type SummaryDTO = {
  profile: ProfileDTO;
  totals: TotalsDTO;
  latest: LatestGwDTO;
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
