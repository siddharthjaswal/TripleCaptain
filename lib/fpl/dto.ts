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
};

export type SummaryDTO = {
  profile: ProfileDTO;
  totals: TotalsDTO;
  latest: LatestGwDTO;
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
  entries: LeagueTableEntryDTO[];
};

export type LeaguesViewDTO = {
  entryId: number;
  teamName: string;
  leagues: LeagueSummaryDTO[];
  selectedLeagueId: number | null;
  selectedLeague: LeagueStandingDTO | null;
};
