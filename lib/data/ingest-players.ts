import { prisma } from "../prisma";

/**
 * Per-player career history from FPL `element-summary/{id}` → history_past.
 * Gives us xG/xA/minutes/points per past season for every current player,
 * which powers the custom xP model. Concurrency-limited, idempotent.
 */

const API = "https://fantasy.premierleague.com/api";
const CONCURRENCY = 6;

type HistoryPast = {
  season_name: string;
  element_code: number;
  minutes: number;
  starts: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  total_points: number;
  expected_goals: string;
  expected_assists: string;
};

async function fetchSummary(id: number): Promise<{ history_past: HistoryPast[] } | null> {
  try {
    const res = await fetch(`${API}/element-summary/${id}/`, {
      headers: { "User-Agent": "triple-captain-ingest/1.0", Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as { history_past: HistoryPast[] };
  } catch {
    return null;
  }
}

export async function ingestPlayerHistory(onProgress?: (done: number, total: number) => void): Promise<number> {
  const players = await prisma.player.findMany({ select: { id: true } });
  const ids = players.map((p) => p.id);
  let written = 0;
  let done = 0;
  let i = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < ids.length) {
        const id = ids[i++];
        const summary = await fetchSummary(id);
        done++;
        if (onProgress && done % 50 === 0) onProgress(done, ids.length);
        if (!summary?.history_past?.length) continue;
        for (const h of summary.history_past) {
          const games = Math.max(1, Math.round(h.minutes / 90));
          await prisma.historicalPlayerSeason.upsert({
            where: { playerId_season: { playerId: id, season: h.season_name } },
            update: {
              playerCode: h.element_code,
              minutes: h.minutes,
              starts: h.starts ?? 0,
              goals: h.goals_scored,
              assists: h.assists,
              cleanSheets: h.clean_sheets,
              xG: Number(h.expected_goals) || 0,
              xA: Number(h.expected_assists) || 0,
              points: h.total_points,
              ppg: Math.round((h.total_points / games) * 100) / 100,
            },
            create: {
              playerId: id,
              playerCode: h.element_code,
              season: h.season_name,
              minutes: h.minutes,
              starts: h.starts ?? 0,
              goals: h.goals_scored,
              assists: h.assists,
              cleanSheets: h.clean_sheets,
              xG: Number(h.expected_goals) || 0,
              xA: Number(h.expected_assists) || 0,
              points: h.total_points,
              ppg: Math.round((h.total_points / games) * 100) / 100,
            },
          });
          written++;
        }
      }
    }),
  );

  return written;
}
