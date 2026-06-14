import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DashboardData } from "../src/api/client.js";
import { DEMO_PROJECT_ID } from "../src/constants.js";
import {
  SampleDashboardRoute,
  sampleDashboardAction,
  sampleDashboardLoader,
} from "../src/routes/sample-dashboard.js";

const dashboardFixture: DashboardData = {
  project: {
    id: DEMO_PROJECT_ID,
    name: "Sample Project",
  },
  actorRole: "owner",
  canTransitionReleases: true,
  releases: [
    {
      id: "00000000-0000-0000-0000-000000000020",
      name: "Release Alpha",
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
        action: sampleDashboardAction,
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
  it("renders loaded data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => dashboardFixture,
      }),
    );

    const router = createDashboardRouter(
      `/sample-dashboard?projectId=${DEMO_PROJECT_ID}`,
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: "Sample Project" })).toBeInTheDocument();
    expect(screen.getByText(/Release Alpha/)).toBeInTheDocument();
    expect(screen.getByText(/draft/)).toBeInTheDocument();
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
      `/sample-dashboard?projectId=${DEMO_PROJECT_ID}`,
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
            projectId: DEMO_PROJECT_ID,
            name: "Release Alpha",
            status: "approved",
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
      `/sample-dashboard?projectId=${DEMO_PROJECT_ID}`,
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
