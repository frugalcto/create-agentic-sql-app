import { Link, Outlet } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import { DEMO_PROJECT_ID } from "./constants.js";
import { HomeRoute } from "./routes/home.js";
import {
  SampleDashboardRoute,
  sampleDashboardAction,
  sampleDashboardLoader,
} from "./routes/sample-dashboard.js";

export function RootLayout() {
  return (
    <main>
      <nav>
        <Link to="/">Home</Link>
        {" | "}
        <Link to={`/sample-dashboard?projectId=${DEMO_PROJECT_ID}`}>
          Sample dashboard
        </Link>
      </nav>
      <Outlet />
    </main>
  );
}

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomeRoute />,
      },
      {
        path: "sample-dashboard",
        loader: sampleDashboardLoader,
        action: sampleDashboardAction,
        element: <SampleDashboardRoute />,
      },
    ],
  },
];
