export const LAST_ENTRY_STORAGE_KEY = "triple-captain:last-entry";

export type StoredEntryProfile = {
  entryId: number;
  teamName: string;
  managerName: string;
  persistedAt: string;
};
