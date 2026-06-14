import { Form, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router-dom";

import {
  ApiClientError,
  getSampleDashboard,
  transitionRelease,
  type DashboardData,
} from "../api/client.js";
import { DEMO_PROJECT_ID } from "../constants.js";
import { EmptyState } from "../components/EmptyState.js";
import { ErrorState } from "../components/ErrorState.js";
import { LoadingState } from "../components/LoadingState.js";

export interface SampleDashboardLoaderData {
  dashboard?: DashboardData;
  error?: string;
}

export interface SampleDashboardActionData {
  error?: string;
}

export async function sampleDashboardLoader({
  request,
}: LoaderFunctionArgs): Promise<SampleDashboardLoaderData> {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") ?? DEMO_PROJECT_ID;

  try {
    const dashboard = await getSampleDashboard(projectId);
    return { dashboard };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { error: error.details.displayMessage };
    }

    return { error: "Something went wrong." };
  }
}

export async function sampleDashboardAction({
  request,
}: ActionFunctionArgs): Promise<SampleDashboardActionData | null> {
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

export function SampleDashboardRoute() {
  const loaderData = useLoaderData<SampleDashboardLoaderData>();
  const actionData = useActionData<SampleDashboardActionData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const isSubmitting = navigation.state === "submitting";

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
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
        <h1>{dashboard.project.name}</h1>
        <EmptyState />
      </section>
    );
  }

  return (
    <section>
      <h1>{dashboard.project.name}</h1>
      <p>Actor role: {dashboard.actorRole}</p>

      <ul>
        {dashboard.releases.map((release) => (
          <li key={release.id}>
            <span>{release.name}</span>
            <span> — {release.status}</span>
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
