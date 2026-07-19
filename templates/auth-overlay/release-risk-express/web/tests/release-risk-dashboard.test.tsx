import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReleaseRiskDashboardData } from "../src/api/client.js";
import { DEMO_SERVICE_ID } from "../src/constants.js";
import {
  ReleaseRiskDashboardRoute,
  releaseRiskDashboardLoader,
} from "../src/routes/release-risk-dashboard.js";

const dashboardFixture: ReleaseRiskDashboardData = {
  service: {
    id: DEMO_SERVICE_ID,
    name: "Checkout API",
  },
  actorRole: "owner",
  canTransitionReleases: true,
  releases: [
    {
      id: "00000000-0000-0000-0000-000000000020",
      name: "Checkout reliability release",
      version: "1.4.0",
      status: "draft",
      riskScore: 37,
      riskLevel: "medium",
      riskFactors: {
        openCriticalIncidents: 0,
        openHighIncidents: 1,
        openMediumIncidents: 1,
        openSupportTickets: 1,
        openPullRequests: 3,
      },
    },
  ],
};

function createDashboardRouter(initialEntry: string) {
  return createMemoryRouter(
    [
      {
        path: "/release-risk-dashboard",
        loader: releaseRiskDashboardLoader,
        element: <ReleaseRiskDashboardRoute />,
      },
    ],
    { initialEntries: [initialEntry] },
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("release risk dashboard route", () => {
  it("renders loaded data with cookie-backed API requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => dashboardFixture,
    });
    vi.stubGlobal("fetch", fetchMock);

    const router = createDashboardRouter(
      `/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "Checkout API" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });
});
