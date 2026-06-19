import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows project hero content", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /triple\s*captain/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/your ultimate fpl companion/i),
    ).toBeVisible();
  });
});
