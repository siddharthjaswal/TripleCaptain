import { expect, test } from "@playwright/test";

// Lenient route smoke tests for the dashboard surfaces added this cycle: each
// should respond OK and render its page chrome (heading), without asserting on
// data that varies by season. A public FPL entry is used.
const ENTRY = "478397";

test.describe("Dashboard routes render", () => {
  test("summary dashboard", async ({ page }) => {
    const res = await page.goto(`/${ENTRY}`, { timeout: 60_000 });
    expect(res?.status() ?? 0).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("gameweek (Live Center + Lineup Watch)", async ({ page }) => {
    const res = await page.goto(`/${ENTRY}/gameweek`, { timeout: 60_000 });
    expect(res?.status() ?? 0).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });

  test("alerts center", async ({ page }) => {
    const res = await page.goto(`/${ENTRY}/alerts`, { timeout: 60_000 });
    expect(res?.status() ?? 0).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: /alerts/i })).toBeVisible();
  });

  test("leagues (Rivals Watch)", async ({ page }) => {
    const res = await page.goto(`/${ENTRY}/leagues`, { timeout: 90_000 });
    expect(res?.status() ?? 0).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  });
});

test.describe("Mobile bottom nav fits a small screen", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test("the 7-item mobile nav does not overflow at 360px", async ({ page }) => {
    await page.goto(`/${ENTRY}/gameweek`, { timeout: 60_000 });
    const nav = page.getByTestId("mobile-nav");
    await expect(nav).toBeVisible();
    expect(await nav.locator("a").count()).toBe(7);
    // No horizontal overflow: content fits within the container's width.
    const { scrollW, clientW } = await nav.evaluate((el) => ({
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
    }));
    expect(scrollW).toBeLessThanOrEqual(clientW + 1);
  });
});
