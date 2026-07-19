import { expect, test } from "@playwright/test";

import { DEMO_PROJECT_ID } from "../src/constants.js";

test.describe("authenticated sample dashboard flow", () => {
  test("logs in and approves a release through the UI", async ({ page }) => {
    await page.goto(`/login?returnTo=/sample-dashboard?projectId=${DEMO_PROJECT_ID}`);

    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByRole("heading", { name: "Agentic SQL Demo" }),
    ).toBeVisible();

    const releaseRow = page.locator("tbody tr").filter({
      hasText: "Initial contract-driven release",
    });

    await expect(releaseRow).toContainText("draft");
    await releaseRow.getByRole("button", { name: "Approve" }).click();
    await expect(releaseRow).toContainText("approved");
  });
});
