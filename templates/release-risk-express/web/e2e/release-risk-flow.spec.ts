import { expect, test } from "@playwright/test";

import { DEMO_SERVICE_ID } from "../src/constants.js";

test.describe("release risk dashboard flow", () => {
  test("loads seeded risk data and approves a release through the UI", async ({
    page,
  }) => {
    await page.goto(`/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`);

    await expect(
      page.getByRole("heading", { name: "Payments API" }),
    ).toBeVisible();

    const releaseRow = page
      .getByRole("listitem")
      .filter({ hasText: "Release Alpha" });

    await expect(releaseRow).toBeVisible();
    await expect(releaseRow).toContainText("draft");
    await expect(releaseRow).toContainText("risk medium");

    await releaseRow.getByRole("button", { name: "Approve" }).click();

    await expect(releaseRow).toContainText("approved");
  });
});
