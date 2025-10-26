import type {
  EntryHistory,
  EntryPicks,
  EntryProfile,
  EntryCurrentHistory,
} from "./schemas";
import type { LatestGwDTO, ProfileDTO, TotalsDTO } from "./dto";

export function mapProfile(entry: EntryProfile): ProfileDTO {
  return {
    entryId: entry.id,
    teamName: entry.name,
    managerName: `${entry.player_first_name} ${entry.player_last_name}`.trim(),
    overallPoints: entry.summary_overall_points,
    overallRank: entry.summary_overall_rank,
  };
}

export function mapTotals(
  entry: EntryProfile,
  currentEvent: number,
): TotalsDTO {
  return {
    entryId: entry.id,
    currentEvent,
    totalPoints: entry.summary_overall_points,
    overallRank: entry.summary_overall_rank,
  };
}

export function mapLatestGameweek(params: {
  entryId: number;
  currentEvent: number;
  history: EntryHistory;
  picks?: EntryPicks | null;
  isLive: boolean;
}): LatestGwDTO {
  const { entryId, currentEvent, history, picks, isLive } = params;
  const historyRecord = findHistoryRecord(history.current, currentEvent);

  if (!historyRecord) {
    throw new Error("Unable to determine latest gameweek data for entry");
  }

  const benchPoints =
    picks?.entry_history.points_on_bench ?? historyRecord.points_on_bench;

  const chipUsed =
    picks?.active_chip ??
    history.chips.find((chip) => chip.event === historyRecord.event)?.name ??
    null;

  return {
    entryId,
    event: historyRecord.event,
    points: historyRecord.points,
    rank: historyRecord.rank ?? historyRecord.overall_rank ?? null,
    pointsOnBench: benchPoints,
    chipUsed,
    isLive,
  };
}

function findHistoryRecord(
  history: EntryCurrentHistory[],
  event: number,
): EntryCurrentHistory | undefined {
  if (history.length === 0) {
    return undefined;
  }

  const matched = history.find((item) => item.event === event);
  return matched ?? history[history.length - 1];
}
