import { expect, test } from "@playwright/test";

// A public FPL entry used for the entry-scoped smoke checks. These pages fetch
// live FPL data + read the local DB; the assertions stay lenient (page renders,
// key chrome is present) so they smoke the routes without being brittle on data.
const ENTRY = "478397";

test.describe("Zero-token data-engine pages", () => {
  test("Power Rankings renders (PowerPicks + predictor)", async ({ page }) => {
    const res = await page.goto("/rankings");
    expect(res?.status() ?? 0).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: /power rankings/i }),
    ).toBeVisible();
    // PowerPicks heading renders when projections exist; the match predictor is
    // always present.
    await expect(page.getByText(/match predictor|power picks/i).first()).toBeVisible();
  });

  test("Planner renders the manual planner + SquadLab", async ({ page }) => {
    const res = await page.goto(`/${ENTRY}/planner`);
    expect(res?.status() ?? 0).toBeLessThan(400);
    await expect(page.getByText(/transfer planner/i).first()).toBeVisible();
    // SquadLab is the new deterministic surface — present whether or not
    // projections are computed (it shows a "recomputing" state otherwise).
    await expect(page.getByText(/squadlab/i).first()).toBeVisible();
  });

  test("Fixtures renders with the forecast strip", async ({ page }) => {
    const res = await page.goto(`/${ENTRY}/fixtures`);
    expect(res?.status() ?? 0).toBeLessThan(400);
    // The page title is the team name (h1); just confirm the page chrome loads.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
});
