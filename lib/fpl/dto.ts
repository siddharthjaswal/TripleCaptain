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
