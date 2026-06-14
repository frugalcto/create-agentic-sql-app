import { Form, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";

import {
  ApiClientError,
  getReleaseRiskDashboard,
  transitionRelease,
  type ReleaseRiskDashboardData,
} from "../api/client.js";
import { DEMO_SERVICE_ID } from "../constants.js";
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

export async function releaseRiskDashboardLoader({
  request,
}: LoaderFunctionArgs): Promise<ReleaseRiskDashboardLoaderData> {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId") ?? DEMO_SERVICE_ID;

  try {
    const dashboard = await getReleaseRiskDashboard(serviceId);
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

  if (typeof releaseId !== "string" || typeof targetStatus !== "string") {
    return { error: "The request failed validation." };
  }

  try {
    await transitionRelease(releaseId, targetStatus);
    return null;
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { error: error.details.displayMessage };
    }

    return { error: "Something went wrong." };
  }
}

export function ReleaseRiskDashboardRoute() {
  const loaderData = useLoaderData<ReleaseRiskDashboardLoaderData>();
  const actionData = useActionData<ReleaseRiskDashboardActionData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const isSubmitting = navigation.state === "submitting";

  if (isLoading) {
    return <LoadingState message="Loading release risk dashboard..." />;
  }

  if (loaderData.error) {
    return <ErrorState message={loaderData.error} />;
  }

  const dashboard = loaderData.dashboard;

  if (!dashboard) {
    return <ErrorState message="Something went wrong." />;
  }

  if (dashboard.releases.length === 0) {
    return (
      <section>
        <h1>{dashboard.service.name}</h1>
        <EmptyState />
      </section>
    );
  }

  return (
    <section>
      <h1>{dashboard.service.name}</h1>
      <p>Actor role: {dashboard.actorRole}</p>

      <ul>
        {dashboard.releases.map((release) => (
          <li key={release.id}>
            <span>
              {release.name} ({release.version})
            </span>
            <span> — {release.status}</span>
            <span>
              {" "}
              — risk {release.riskLevel} ({release.riskScore})
            </span>
            {dashboard.canTransitionReleases ? (
              <Form method="post" style={{ display: "inline" }}>
                <input type="hidden" name="releaseId" value={release.id} />
                <input type="hidden" name="targetStatus" value="approved" />
                <button type="submit" disabled={isSubmitting}>
                  Approve
                </button>
              </Form>
            ) : null}
          </li>
        ))}
      </ul>

      {isSubmitting ? <LoadingState message="Submitting transition..." /> : null}
      {actionData?.error ? <ErrorState message={actionData.error} /> : null}
    </section>
  );
}
