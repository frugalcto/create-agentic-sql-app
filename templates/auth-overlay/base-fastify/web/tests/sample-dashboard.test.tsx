import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DashboardData } from "../src/api/client.js";
import { DEMO_PROJECT_ID } from "../src/constants.js";
import {
  SampleDashboardRoute,
  sampleDashboardLoader,
} from "../src/routes/sample-dashboard.js";

const dashboardFixture: DashboardData = {
  project: {
    id: DEMO_PROJECT_ID,
    name: "Agentic SQL Demo",
  },
  actorRole: "owner",
  canTransitionReleases: true,
  releases: [
    {
      id: "00000000-0000-0000-0000-000000000020",
      name: "Initial contract-driven release",
      status: "draft",
    },
  ],
};

function createDashboardRouter(initialEntry: string) {
  return createMemoryRouter(
    [
      {
        path: "/sample-dashboard",
        loader: sampleDashboardLoader,
        element: <SampleDashboardRoute />,
      },
    ],
    { initialEntries: [initialEntry] },
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("sample dashboard route", () => {
  it("renders loaded data with cookie-backed API requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => dashboardFixture,
    });
    vi.stubGlobal("fetch", fetchMock);

    const router = createDashboardRouter(
      `/sample-dashboard?projectId=${DEMO_PROJECT_ID}`,
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "Agentic SQL Demo" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/sample-dashboard?projectId=${DEMO_PROJECT_ID}`,
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });
});
