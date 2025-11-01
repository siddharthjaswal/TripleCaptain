import { useEffect, useState } from "react";
import type { LeagueTableEntryDTO, LatestGwDTO } from "@/lib/fpl/dto";

type TeamPicksResponse = {
  captain: {
    playerId: number;
    playerName: string;
    playerPhoto: string | null;
  } | null;
  teamPicks: LatestGwDTO;
};

type EnrichedEntry = LeagueTableEntryDTO & {
  isLoading?: boolean;
};

export function useLeagueTeamPicks(
  entries: LeagueTableEntryDTO[],
  gameweek: number | null,
  enabled: boolean = true
) {
  const [enrichedEntries, setEnrichedEntries] = useState<EnrichedEntry[]>(entries);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch if enabled, have entries, have gameweek, and < 20 entries
    if (!enabled || !gameweek || entries.length >= 20 || entries.length === 0) {
      setEnrichedEntries(entries);
      return;
    }

    // Initialize with loading state
    setEnrichedEntries(entries.map(e => ({ ...e, isLoading: true })));
    setIsLoading(true);

    // Fetch picks for each entry with slight delay to avoid rate limiting
    const fetchAllPicks = async () => {
      const results = await Promise.allSettled(
        entries.map(async (entry, index) => {
          // Add small delay between requests (100ms per entry)
          await new Promise(resolve => setTimeout(resolve, index * 100));

          try {
            const response = await fetch(
              `/api/entries/${entry.entryId}/picks/${gameweek}`
            );

            if (!response.ok) {
              throw new Error("Failed to fetch picks");
            }

            const data: TeamPicksResponse = await response.json();

            return {
              ...entry,
              ...(data.captain && { captain: data.captain }),
              ...(data.teamPicks && { teamPicks: data.teamPicks }),
              isLoading: false,
            };
          } catch (error) {
            console.error(`Failed to fetch picks for entry ${entry.entryId}:`, error);
            return {
              ...entry,
              isLoading: false,
            };
          }
        })
      );

      // Update state as entries load
      const finalEntries = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        return { ...entries[index], isLoading: false };
      });

      setEnrichedEntries(finalEntries);
      setIsLoading(false);
    };

    fetchAllPicks();
  }, [entries, gameweek, enabled]);

  return {
    entries: enrichedEntries,
    isLoading,
  };
}
