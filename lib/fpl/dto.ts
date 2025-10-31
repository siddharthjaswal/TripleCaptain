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
  previousRank: number | null;
  rankChange: number | null; // Negative = improved (rank went down), Positive = worsened (rank went up)
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

export type LeagueRaceEntryDTO = {
  entryId: number;
  entryName: string;
  playerName: string;
  history: Array<{
    event: number;
    totalPoints: number;
  }>;
};

export type LeagueRaceDTO = {
  leagueId: number;
  leagueName: string;
  entries: LeagueRaceEntryDTO[];
};

export type LeaguesViewDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  currentEvent: number | null;
  leagues: LeagueSummaryDTO[];
  selectedLeagueId: number | null;
  selectedLeague: LeagueStandingDTO | null;
  leagueRace: LeagueRaceDTO | null;
};

export type FixtureDTO = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
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
  teamId: number;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  multiplier: number;
};

export type FixturesViewDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  currentEvent: number;
  event: number;
  fixtures: FixtureDTO[];
  playersByFixture: Map<number, FixturePlayerDTO[]>;
};

export type GameweekViewDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  currentEvent: number;
  gameweek: LatestGwDTO;
};

// Predictions feature DTOs

export type FixtureDifficultyDTO = {
  opponent: string;
  opponentShort: string;
  difficulty: number; // 1-5 scale (1=easiest, 5=hardest)
  isHome: boolean;
};

export type CaptainPickDTO = {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  team: string;
  expectedPoints: number;
  form: number;
  fixture: FixtureDifficultyDTO | null;
  chanceOfPlaying: number | null; // 0-100 or null if no injury
  reasoning: string;
};

export type PlayerPredictionDTO = {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  expectedPoints: number;
  fixture: FixtureDifficultyDTO | null;
};

export type PredictedXIDTO = {
  formation: string; // e.g., "3-4-3"
  totalPredictedPoints: number;
  goalkeeper: PlayerPredictionDTO;
  defenders: PlayerPredictionDTO[];
  midfielders: PlayerPredictionDTO[];
  forwards: PlayerPredictionDTO[];
  bench: PlayerPredictionDTO[];
  captain: number; // playerId of recommended captain
};

export type TransferPlayerOutDTO = {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  cost: number; // in millions
  expectedPoints: number;
  form: number;
  reasoning: string;
};

export type TransferPlayerInDTO = {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  cost: number; // in millions
  expectedPoints: number;
  form: number;
  upcomingFixtures: FixtureDifficultyDTO[];
  selectedByPercent: number;
  reasoning: string;
};

export type TransferSuggestionDTO = {
  playerOut: TransferPlayerOutDTO;
  playerIn: TransferPlayerInDTO;
  netCost: number; // Positive = costs money, Negative = saves money
};

export type ChipRecommendationDTO = {
  chipName: "Triple Captain" | "Bench Boost" | "Free Hit" | "Wildcard";
  recommend: boolean;
  reasoning: string;
  bestGameweek?: number;
  potentialPoints?: number;
};

export type DifferentialPickDTO = {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  position: "GK" | "DEF" | "MID" | "FWD";
  team: string;
  cost: number;
  expectedPoints: number;
  form: number;
  ownership: number; // selected_by_percent
  fixture: FixtureDifficultyDTO | null;
  upcomingFixtures: FixtureDifficultyDTO[];
  reasoning: string;
  upsideScore: number; // ep_next / ownership ratio
};

export type TeamFixtureRunDTO = {
  teamId: number;
  teamName: string;
  teamShort: string;
  fixtures: Array<{
    gameweek: number;
    opponent: string;
    opponentShort: string;
    difficulty: number;
    isHome: boolean;
  }>;
  averageDifficulty: number;
  recommendation: "target" | "avoid" | "neutral";
};

export type FixtureAnalysisDTO = {
  bestFixtureRuns: TeamFixtureRunDTO[]; // Teams with easiest fixtures
  worstFixtureRuns: TeamFixtureRunDTO[]; // Teams with hardest fixtures
  gameweeksAnalyzed: number; // How many GWs ahead we analyzed
};

export type PredictionsDTO = {
  nextGameweek: number;
  captainPicks: CaptainPickDTO[];
  predictedXI: PredictedXIDTO;
  transferSuggestions: TransferSuggestionDTO[];
  chipRecommendations: ChipRecommendationDTO[];
  differentialPicks: DifferentialPickDTO[];
  fixtureAnalysis: FixtureAnalysisDTO;
  budgetAvailable: number; // Money in bank (in millions)
  disclaimer: string;
};
