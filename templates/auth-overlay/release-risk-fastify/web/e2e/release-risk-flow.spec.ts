import { expect, test } from "@playwright/test";

import { DEMO_SERVICE_ID } from "../src/constants.js";

test.describe("authenticated release risk dashboard flow", () => {
  test("logs in and loads the release risk dashboard", async ({ page }) => {
    await page.goto(
      `/login?returnTo=/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
    );

    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("heading", { name: "Checkout API" })).toBeVisible();
    await expect(page.getByText("Checkout reliability release")).toBeVisible();
  });
});
