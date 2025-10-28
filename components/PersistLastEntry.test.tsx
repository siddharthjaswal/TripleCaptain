import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { PersistLastEntry } from "./PersistLastEntry";
import { LAST_ENTRY_STORAGE_KEY } from "@/lib/storage";

describe("PersistLastEntry", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists entry details into localStorage", async () => {
    render(
      <PersistLastEntry
        entryId={456}
        teamName="Test FC"
        managerName="Jamie Doe"
      />,
    );

    await waitFor(() => {
      const raw = window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = raw ? JSON.parse(raw) : null;
      expect(parsed[0]).toMatchObject({
        entryId: 456,
        teamName: "Test FC",
        managerName: "Jamie Doe",
      });
    });
  });

  it("moves existing entries to the top instead of duplicating", async () => {
    window.localStorage.setItem(
      LAST_ENTRY_STORAGE_KEY,
      JSON.stringify([
        {
          entryId: 111,
          teamName: "Old Team",
          managerName: "Alex",
          persistedAt: new Date(0).toISOString(),
        },
        {
          entryId: 456,
          teamName: "Test FC",
          managerName: "Jamie Doe",
          persistedAt: new Date(1).toISOString(),
        },
      ]),
    );

    render(
      <PersistLastEntry
        entryId={456}
        teamName="Test FC"
        managerName="Jamie Doe"
      />,
    );

    await waitFor(() => {
      const raw = window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = raw ? JSON.parse(raw) : [];
      expect(parsed).toHaveLength(2);
      expect(parsed[0].entryId).toBe(456);
    });
  });
});
