import { Link, NavLink, Outlet } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import { DEMO_SERVICE_ID } from "./constants.js";
import { HomeRoute } from "./routes/home.js";
import {
  ReleaseRiskDashboardRoute,
  releaseRiskDashboardAction,
  releaseRiskDashboardLoader,
} from "./routes/release-risk-dashboard.js";

export function RootLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Link className="app-brand" to="/">
            <span className="app-brand__title">__PROJECT_NAME__</span>
            <span className="app-brand__subtitle">PostgreSQL-first application</span>
          </Link>
          <nav className="app-nav" aria-label="Primary">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `app-nav__link${isActive ? " active" : ""}`
              }
              end
            >
              Home
            </NavLink>
            <NavLink
              to={`/release-risk-dashboard?serviceId=${DEMO_SERVICE_ID}`}
              className={({ isActive }) =>
                `app-nav__link${isActive ? " active" : ""}`
              }
            >
              Release risk dashboard
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
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
        path: "release-risk-dashboard",
        loader: releaseRiskDashboardLoader,
        action: releaseRiskDashboardAction,
        element: <ReleaseRiskDashboardRoute />,
      },
    ],
  },
];
