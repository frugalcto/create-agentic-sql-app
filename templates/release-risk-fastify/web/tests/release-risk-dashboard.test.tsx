import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReleaseRiskDashboardData } from "../src/api/client.js";
import { DEMO_SERVICE_ID } from "../src/constants.js";
import {
  ReleaseRiskDashboardRoute,
  releaseRiskDashboardAction,
  releaseRiskDashboardLoader,
} from "../src/routes/release-risk-dashboard.js";

const dashboardFixture: ReleaseRiskDashboardData = {
  service: {
    id: DEMO_SERVICE_ID,
    name: "Payments API",
  },
  actorRole: "owner",
  canTransitionReleases: true,
  releases: [
    {
      id: "00000000-0000-0000-0000-000000000020",
      name: "Release Alpha",
      version: "1.4.0",
      status: "draft",
      riskScore: 34,
      riskLevel: "medium",
      riskFactors: {
        openCriticalIncidents: 0,
        openHighIncidents: 1,
        openMediumIncidents: 1,
        openSupportTickets: 1,
        openPullRequests: 2,
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
        action: releaseRiskDashboardAction,
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
  it("renders loaded risk data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => dashboardFixture,
      }),
    );

    const router = createDashboardRouter(
      `/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
    );

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Payments API" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Release Alpha/)).toBeInTheDocument();
    expect(screen.getByText(/draft/)).toBeInTheDocument();
    expect(screen.getByText(/risk medium \(34\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("renders API error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: "PERMISSION_DENIED",
            category: "business_rule",
            displayMessage: "You do not have permission to perform this action.",
          },
        }),
      }),
    );

    const router = createDashboardRouter(
      `/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
    );

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("You do not have permission to perform this action.");
  });

  it("submits the expected release transition payload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => dashboardFixture,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          release: {
            id: "00000000-0000-0000-0000-000000000020",
            serviceId: DEMO_SERVICE_ID,
            name: "Release Alpha",
            version: "1.4.0",
            status: "approved",
            risk: {
              riskScore: 34,
              riskLevel: "medium",
              riskFactors: dashboardFixture.releases[0].riskFactors,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...dashboardFixture,
          releases: [
            {
              ...dashboardFixture.releases[0],
              status: "approved",
            },
          ],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const router = createDashboardRouter(
      `/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
    );
    const user = userEvent.setup();

    render(<RouterProvider router={router} />);

    await screen.findByRole("button", { name: "Approve" });
    await user.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/releases/00000000-0000-0000-0000-000000000020/transition",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ targetStatus: "approved" }),
        }),
      );
    });
  });
});
