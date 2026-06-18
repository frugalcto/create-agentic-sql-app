import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReleaseRiskDashboardData } from "../src/api/client.js";
import { DEMO_SERVICE_ID, DEMO_VIEWER_USER_ID } from "../src/constants.js";
import {
  ReleaseRiskDashboardRoute,
  releaseRiskDashboardAction,
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
      await screen.findByRole("heading", { name: "Checkout API" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Checkout reliability release/)).toBeInTheDocument();
    expect(screen.getByLabelText("Status: draft")).toBeInTheDocument();
    expect(screen.getByLabelText("Risk level: medium")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByText(/create-agentic-sql-app/)).toBeInTheDocument();
  });

  it("passes demo actor context through the API client", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...dashboardFixture,
        actorRole: "viewer",
        canTransitionReleases: false,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const router = createDashboardRouter(
      `/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}&demoUserId=${DEMO_VIEWER_USER_ID}`,
    );

    render(<RouterProvider router={router} />);

    await screen.findByRole("heading", { name: "Checkout API" });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-demo-user-id": DEMO_VIEWER_USER_ID,
        }),
      }),
    );
  });

  it("renders loading state while loader is pending", async () => {
    let resolveResponse: ((value: unknown) => void) | null = null;
    const pendingResponse = new Promise((resolve) => {
      resolveResponse = resolve;
    });

    vi.stubGlobal("fetch", vi.fn(() => pendingResponse as Promise<Response>));

    const router = createDashboardRouter(
      `/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
    );

    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Loading release risk dashboard...",
    );

    resolveResponse?.({
      ok: true,
      json: async () => dashboardFixture,
    });
    expect(
      await screen.findByRole("heading", { name: "Checkout API" }),
    ).toBeInTheDocument();
  });

  it("renders empty state when no releases are returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...dashboardFixture,
          releases: [],
        }),
      }),
    );

    const router = createDashboardRouter(
      `/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`,
    );

    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "No releases returned for this service yet.",
    );
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
            name: "Checkout reliability release",
            version: "1.4.0",
            status: "approved",
            risk: {
              riskScore: 37,
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
