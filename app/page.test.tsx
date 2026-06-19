import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// UserMenu is an async server component that imports next-auth (which breaks the
// vitest module resolver and can't be rendered by Testing Library); MyTeamShortcut
// fetches /api/me. Stub both — this test covers the static hero.
vi.mock("@/components/UserMenu", () => ({ UserMenu: () => null }));
vi.mock("@/components/MyTeamShortcut", () => ({ MyTeamShortcut: () => null }));

import Home from "./page";

describe("Home page", () => {
  it("renders project hero", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /triple\s*captain/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/your ultimate fpl companion/i),
    ).toBeInTheDocument();
  });
});
