export interface ApiErrorDetails {
  code: string;
  category: string;
  displayMessage: string;
}

export interface ApiErrorPayload {
  error: ApiErrorDetails;
}

export class ApiClientError extends Error {
  readonly details: ApiErrorDetails;

  constructor(payload: ApiErrorPayload) {
    super(payload.error.displayMessage);
    this.details = payload.error;
  }
}

export interface DashboardRelease {
  id: string;
  name: string;
  status: string;
}

export interface DashboardData {
  project: {
    id: string;
    name: string;
  };
  actorRole: string;
  canTransitionReleases: boolean;
  releases: DashboardRelease[];
}

export interface TransitionReleaseResponse {
  release: {
    id: string;
    projectId: string;
    name: string;
    status: string;
  };
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "";
}

function getDemoActorHeaders(demoUserId?: string): Record<string, string> {
  if (!demoUserId) {
    return {};
  }

  return { "x-demo-user-id": demoUserId };
}

async function request<T>(
  path: string,
  init?: RequestInit,
  demoUserId?: string,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getDemoActorHeaders(demoUserId),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const body = (await response.json()) as T | ApiErrorPayload;

  if (!response.ok) {
    throw new ApiClientError(body as ApiErrorPayload);
  }

  return body as T;
}

export async function getHealth(): Promise<{ status: string }> {
  return request<{ status: string }>("/api/health");
}

export async function getSampleDashboard(
  projectId: string,
  demoUserId?: string,
): Promise<DashboardData> {
  const query = new URLSearchParams({ projectId });
  return request<DashboardData>(
    `/api/sample-dashboard?${query.toString()}`,
    undefined,
    demoUserId,
  );
}

export async function transitionRelease(
  releaseId: string,
  targetStatus: string,
  demoUserId?: string,
): Promise<TransitionReleaseResponse> {
  return request<TransitionReleaseResponse>(
    `/api/releases/${releaseId}/transition`,
    {
      method: "POST",
      body: JSON.stringify({ targetStatus }),
    },
    demoUserId,
  );
}
