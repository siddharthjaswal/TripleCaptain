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
      expect(parsed).toMatchObject({
        entryId: 456,
        teamName: "Test FC",
        managerName: "Jamie Doe",
      });
    });
  });
});
