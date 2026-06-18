import { expect, test } from "@playwright/test";

import { DEMO_PROJECT_ID } from "../src/constants.js";

test.describe("sample dashboard flow", () => {
  test("loads seeded data and approves a release through the UI", async ({
    page,
  }) => {
    await page.goto(`/sample-dashboard?projectId=${DEMO_PROJECT_ID}`);

    await expect(
      page.getByRole("heading", { name: "Agentic SQL Demo" }),
    ).toBeVisible();

    const releaseRow = page.locator("tbody tr").filter({ hasText: "Initial contract-driven release" });

    await expect(releaseRow).toBeVisible();
    await expect(releaseRow).toContainText("draft");

    await releaseRow.getByRole("button", { name: "Approve" }).click();

    await expect(releaseRow).toContainText("approved");
  });
});
