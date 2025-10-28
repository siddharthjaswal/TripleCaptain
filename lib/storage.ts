export const LAST_ENTRY_STORAGE_KEY = "triple-captain:recent-entries";
export const MAX_RECENT_ENTRIES = 5;

export type StoredEntryProfile = {
  entryId: number;
  teamName: string;
  managerName: string;
  persistedAt: string;
};
