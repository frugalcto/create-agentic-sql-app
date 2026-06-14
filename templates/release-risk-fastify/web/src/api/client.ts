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

export interface ReleaseRiskFactors {
  openCriticalIncidents: number;
  openHighIncidents: number;
  openMediumIncidents: number;
  openSupportTickets: number;
  openPullRequests: number;
}

export interface ReleaseRiskItem {
  id: string;
  name: string;
  version: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  riskFactors: ReleaseRiskFactors;
}

export interface ReleaseRiskDashboardData {
  service: {
    id: string;
    name: string;
  };
  actorRole: string;
  canTransitionReleases: boolean;
  releases: ReleaseRiskItem[];
}

export interface TransitionReleaseResponse {
  release: {
    id: string;
    serviceId: string;
    name: string;
    version: string;
    status: string;
    risk: {
      riskScore: number;
      riskLevel: string;
      riskFactors: ReleaseRiskFactors;
    };
  };
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
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

export async function getReleaseRiskDashboard(
  serviceId: string,
): Promise<ReleaseRiskDashboardData> {
  const query = new URLSearchParams({ serviceId });
  return request<ReleaseRiskDashboardData>(
    `/api/release-risk-dashboard?${query.toString()}`,
  );
}

export async function transitionRelease(
  releaseId: string,
  targetStatus: string,
): Promise<TransitionReleaseResponse> {
  return request<TransitionReleaseResponse>(
    `/api/releases/${releaseId}/transition`,
    {
      method: "POST",
      body: JSON.stringify({ targetStatus }),
    },
  );
}
