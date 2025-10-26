import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows project hero content", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /triple captain/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/fantasy premier league companion/i),
    ).toBeVisible();
  });
});
