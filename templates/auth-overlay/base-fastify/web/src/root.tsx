import { Form, Link, NavLink, Outlet, useLoaderData } from "react-router-dom";
import type { LoaderFunctionArgs, RouteObject } from "react-router-dom";

import { ApiClientError, getCurrentUser, logout, type CurrentUserResponse } from "./api/client.js";
import { DEMO_PROJECT_ID } from "./constants.js";
import { HomeRoute } from "./routes/home.js";
import { LoginRoute, loginAction } from "./routes/login.js";
import {
  SampleDashboardRoute,
  sampleDashboardAction,
  sampleDashboardLoader,
} from "./routes/sample-dashboard.js";

export interface RootLoaderData {
  currentUser: CurrentUserResponse | null;
}

export async function rootLoader(): Promise<RootLoaderData> {
  try {
    const currentUser = await getCurrentUser();
    return { currentUser };
  } catch (error) {
    if (error instanceof ApiClientError && error.details.code === "UNAUTHENTICATED") {
      return { currentUser: null };
    }

    return { currentUser: null };
  }
}

export async function logoutAction() {
  try {
    await logout();
  } catch {
    // Clearing the cookie is still attempted server-side when a session exists.
  }

  return null;
}

export function RootLayout() {
  const { currentUser } = useLoaderData<RootLoaderData>();

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
            {currentUser ? (
              <NavLink
                to={`/sample-dashboard?projectId=${DEMO_PROJECT_ID}`}
                className={({ isActive }) =>
                  `app-nav__link${isActive ? " active" : ""}`
                }
              >
                Sample dashboard
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `app-nav__link${isActive ? " active" : ""}`
                }
              >
                Sign in
              </NavLink>
            )}
          </nav>
          {currentUser ? (
            <div className="session-panel">
              <span className="session-panel__email">{currentUser.email}</span>
              <Form method="post" action="/logout">
                <button className="button button--ghost" type="submit">
                  Sign out
                </button>
              </Form>
            </div>
          ) : null}
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
    loader: rootLoader,
    children: [
      {
        index: true,
        element: <HomeRoute />,
      },
      {
        path: "login",
        action: loginAction,
        element: <LoginRoute />,
      },
      {
        path: "logout",
        action: logoutAction,
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
