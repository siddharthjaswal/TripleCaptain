import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { RecentEntryCard } from "./RecentEntryCard";
import { LAST_ENTRY_STORAGE_KEY } from "@/lib/storage";

describe("RecentEntryCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders nothing when no recent entry exists", () => {
    render(<RecentEntryCard />);
    expect(screen.queryByText(/Recently Viewed/i)).toBeNull();
  });

  it("renders stored entries and allows navigation", async () => {
    const payload = [
      {
        entryId: 123,
        teamName: "Triple Captain",
        managerName: "Alex Smith",
        persistedAt: new Date(Date.now() - 60_000).toISOString(),
      },
      {
        entryId: 456,
        teamName: "Double Switch",
        managerName: "Jamie Doe",
        persistedAt: new Date(Date.now() - 120_000).toISOString(),
      },
    ];
    window.localStorage.setItem(
      LAST_ENTRY_STORAGE_KEY,
      JSON.stringify(payload),
    );

    render(<RecentEntryCard />);

    expect(screen.getByText(/Triple Captain/i)).toBeInTheDocument();
    expect(screen.getByText(/Double Switch/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Open Dashboard/i })[0],
    ).toHaveAttribute("href", "/123");
  });

  it("clears storage when Clear is clicked", () => {
    const payload = [
      {
        entryId: 123,
        teamName: "Triple Captain",
        managerName: "Alex Smith",
        persistedAt: new Date().toISOString(),
      },
    ];
    window.localStorage.setItem(
      LAST_ENTRY_STORAGE_KEY,
      JSON.stringify(payload),
    );

    render(<RecentEntryCard />);

    fireEvent.click(screen.getByRole("button", { name: /Clear All/i }));

    expect(window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY)).toBeNull();
  });
});
