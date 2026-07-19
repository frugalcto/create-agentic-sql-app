import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import {
  ApiClientError,
  getReleaseRiskDashboard,
  isReleaseStatus,
  transitionRelease,
  type ReleaseRiskDashboardData,
} from "../api/client.js";
import {
  buildReleaseRiskDashboardPath,
  DEMO_ADMIN_USER_ID,
  DEMO_EMPTY_SERVICE_ID,
  DEMO_SERVICE_ID,
  DEMO_VIEWER_USER_ID,
} from "../constants.js";
import { EmptyState } from "../components/EmptyState.js";
import { ErrorState } from "../components/ErrorState.js";
import { LoadingState } from "../components/LoadingState.js";

export interface ReleaseRiskDashboardLoaderData {
  dashboard?: ReleaseRiskDashboardData;
  error?: string;
}

export interface ReleaseRiskDashboardActionData {
  error?: string;
}

function getStatusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized === "draft" || normalized === "approved" || normalized === "released") {
    return `badge badge--${normalized}`;
  }

  return "badge badge--muted";
}

function getRiskBadgeClass(level: string): string {
  const normalized = level.toLowerCase();

  if (normalized === "high" || normalized === "critical") {
    return "badge badge--released";
  }

  if (normalized === "medium") {
    return "badge badge--approved";
  }

  return "badge badge--muted";
}

function resolveDemoUserId(value: FormDataEntryValue | string | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function releaseRiskDashboardLoader({
  request,
}: LoaderFunctionArgs): Promise<ReleaseRiskDashboardLoaderData> {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId") ?? DEMO_SERVICE_ID;
  const demoUserId = resolveDemoUserId(url.searchParams.get("demoUserId"));

  try {
    const dashboard = await getReleaseRiskDashboard(serviceId, demoUserId);
    return { dashboard };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { error: error.details.displayMessage };
    }

    return { error: "Something went wrong." };
  }
}

export async function releaseRiskDashboardAction({
  request,
}: ActionFunctionArgs): Promise<ReleaseRiskDashboardActionData | null> {
  const formData = await request.formData();
  const releaseId = formData.get("releaseId");
  const targetStatus = formData.get("targetStatus");
  const demoUserId = resolveDemoUserId(formData.get("demoUserId"));

  if (typeof releaseId !== "string" || typeof targetStatus !== "string") {
    return { error: "The request failed validation." };
  }

  if (!isReleaseStatus(targetStatus)) {
    return { error: "The request failed validation." };
  }

  try {
    await transitionRelease(releaseId, targetStatus, demoUserId);
    return null;
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { error: error.details.displayMessage };
    }

    return { error: "Something went wrong." };
  }
}

function DemoControls({
  serviceId,
  demoUserId,
}: {
  serviceId: string;
  demoUserId?: string;
}) {
  return (
    <article className="card demo-panel">
      <h2>Demo controls (development only)</h2>
      <p className="architecture-note">
        This page renders contract data returned by PostgreSQL-backed API procedures.
        Risk scoring and release transitions are enforced in PostgreSQL. The API route is
        intentionally thin. React does not calculate release risk or permissions.
      </p>
      <ul className="demo-links">
        <li>
          <Link
            className="button button--ghost"
            to={buildReleaseRiskDashboardPath(serviceId, DEMO_ADMIN_USER_ID)}
          >
            Owner context (admin@example.com)
          </Link>
        </li>
        <li>
          <Link
            className="button button--ghost"
            to={buildReleaseRiskDashboardPath(serviceId, DEMO_VIEWER_USER_ID)}
          >
            Viewer context (viewer@example.com)
          </Link>
        </li>
        <li>
          <Link
            className="button button--ghost"
            to={buildReleaseRiskDashboardPath(DEMO_EMPTY_SERVICE_ID, demoUserId)}
          >
            Empty service dashboard
          </Link>
        </li>
      </ul>
      <p className="architecture-note">
        Stop the API server to observe a system error state. See{" "}
        <code>docs/screenshots/README.md</code> for capture guidance.
      </p>
    </article>
  );
}

export function ReleaseRiskDashboardRoute() {
  const loaderData = useLoaderData<ReleaseRiskDashboardLoaderData>();
  const actionData = useActionData<ReleaseRiskDashboardActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const submittedTransitionRef = useRef(false);
  const serviceId = searchParams.get("serviceId") ?? DEMO_SERVICE_ID;
  const demoUserId = resolveDemoUserId(searchParams.get("demoUserId"));
  const isLoading = navigation.state === "loading";
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (isSubmitting) {
      submittedTransitionRef.current = true;
      setActionNotice(null);
      return;
    }

    if (!submittedTransitionRef.current || navigation.state !== "idle") {
      return;
    }

    submittedTransitionRef.current = false;
    setActionNotice(
      actionData?.error ? null : "Transition submitted. The latest status is shown below.",
    );
  }, [actionData?.error, isSubmitting, navigation.state]);

  if (isLoading) {
    return <LoadingState message="Loading release risk dashboard..." />;
  }

  if (loaderData.error) {
    return (
      <section className="page-stack">
        <ErrorState message={loaderData.error} />
        <DemoControls serviceId={serviceId} demoUserId={demoUserId} />
      </section>
    );
  }

  const dashboard = loaderData.dashboard;

  if (!dashboard) {
    return <ErrorState message="Something went wrong." />;
  }

  if (dashboard.releases.length === 0) {
    return (
      <section className="page-stack">
        <article className="card">
          <h1>{dashboard.service.name}</h1>
          <p className="architecture-note">
            Risk scoring and release rules are computed in PostgreSQL procedures.
          </p>
          <div className="meta-grid">
            <div>
              <div className="meta-label">Service ID</div>
              <div className="meta-value">{dashboard.service.id}</div>
            </div>
            <div>
              <div className="meta-label">Demo actor role</div>
              <div className="meta-value">{dashboard.actorRole}</div>
            </div>
          </div>
        </article>
        <EmptyState message="No releases returned for this service yet." />
        <DemoControls serviceId={serviceId} demoUserId={demoUserId} />
      </section>
    );
  }

  return (
    <section className="page-stack">
      <article className="card">
        <h1>{dashboard.service.name}</h1>
        <p className="architecture-note">
          Generated by <strong>create-agentic-sql-app</strong>. Risk values shown below are
          returned directly from PostgreSQL contract data.
        </p>
        <div className="meta-grid">
          <div>
            <div className="meta-label">Service ID</div>
            <div className="meta-value">{dashboard.service.id}</div>
          </div>
          <div>
            <div className="meta-label">Demo actor role</div>
            <div className="meta-value">{dashboard.actorRole}</div>
          </div>
          <div>
            <div className="meta-label">Transition capability</div>
            <div className="meta-value">
              {dashboard.canTransitionReleases ? "Transitions enabled" : "Read only"}
            </div>
          </div>
        </div>
      </article>

      <DemoControls serviceId={serviceId} demoUserId={demoUserId} />

      <article className="card table-card">
        <div className="table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th scope="col">Release</th>
                <th scope="col">Status</th>
                <th scope="col">Risk</th>
                <th scope="col">Risk factors</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.releases.map((release) => (
                <tr key={release.id}>
                  <td>
                    {release.name} ({release.version})
                  </td>
                  <td>
                    <span
                      aria-label={`Status: ${release.status}`}
                      className={getStatusBadgeClass(release.status)}
                    >
                      {release.status}
                    </span>
                  </td>
                  <td>
                    <span
                      aria-label={`Risk level: ${release.riskLevel}`}
                      className={getRiskBadgeClass(release.riskLevel)}
                    >
                      {release.riskLevel} ({release.riskScore})
                    </span>
                  </td>
                  <td>
                    CI {release.riskFactors.openCriticalIncidents}, HI{" "}
                    {release.riskFactors.openHighIncidents}, MI{" "}
                    {release.riskFactors.openMediumIncidents}, ST{" "}
                    {release.riskFactors.openSupportTickets}, PR{" "}
                    {release.riskFactors.openPullRequests}
                  </td>
                  <td>
                    <div className="demo-actions">
                      {dashboard.canTransitionReleases ? (
                        <>
                          <Form className="inline-form" method="post">
                            <input type="hidden" name="releaseId" value={release.id} />
                            <input type="hidden" name="targetStatus" value="approved" />
                            {demoUserId ? (
                              <input type="hidden" name="demoUserId" value={demoUserId} />
                            ) : null}
                            <button className="button" type="submit" disabled={isSubmitting}>
                              Approve
                            </button>
                          </Form>
                          {release.status === "draft" ? (
                            <Form className="inline-form" method="post">
                              <input type="hidden" name="releaseId" value={release.id} />
                              <input type="hidden" name="targetStatus" value="released" />
                              {demoUserId ? (
                                <input type="hidden" name="demoUserId" value={demoUserId} />
                              ) : null}
                              <button
                                className="button button--ghost"
                                type="submit"
                                disabled={isSubmitting}
                              >
                                Try invalid transition (demo)
                              </button>
                            </Form>
                          ) : null}
                        </>
                      ) : (
                        <span className="badge badge--muted">No action</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="feedback-row">
        {isSubmitting ? <LoadingState message="Submitting transition..." /> : null}
        {actionNotice ? <div className="state">{actionNotice}</div> : null}
      </div>

      {actionData?.error ? <ErrorState message={actionData.error} /> : null}
    </section>
  );
}
