export const LAST_ENTRY_STORAGE_KEY = "triple-captain:recent-entries";
export const MAX_RECENT_ENTRIES = 5;
export const LAST_LEAGUE_STORAGE_KEY = "triple-captain:league-preferences";

export type StoredEntryProfile = {
  entryId: number;
  teamName: string;
  managerName: string;
  persistedAt: string;
};

type StoredLeaguePreferences = Record<string, number>;

export function getStoredLeaguePreference(entryId: number): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_LEAGUE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredLeaguePreferences;
    const value = parsed?.[String(entryId)];
    return typeof value === "number" ? value : null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to read stored league preference", error);
    }
    return null;
  }
}

export function setStoredLeaguePreference(entryId: number, leagueId: number) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.localStorage.getItem(LAST_LEAGUE_STORAGE_KEY);
    const parsed: StoredLeaguePreferences = raw
      ? (JSON.parse(raw) as StoredLeaguePreferences)
      : {};
    parsed[String(entryId)] = leagueId;
    window.localStorage.setItem(
      LAST_LEAGUE_STORAGE_KEY,
      JSON.stringify(parsed),
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to store league preference", error);
    }
  }
}
