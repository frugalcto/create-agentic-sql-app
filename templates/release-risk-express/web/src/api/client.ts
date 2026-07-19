import type { z } from "zod";

import { endpoints } from "@__PROJECT_NAME_PKG__/contract";

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

export type ReleaseRiskDashboardData = z.infer<
  typeof endpoints.getReleaseRiskDashboard.response
>;

export type TransitionReleaseResponse = z.infer<
  typeof endpoints.transitionRelease.response
>;

export type HealthResponse = z.infer<typeof endpoints.health.response>;

export type ReleaseStatus = ReleaseRiskDashboardData["releases"][number]["status"];

export function isReleaseStatus(value: string): value is ReleaseStatus {
  return value === "draft" || value === "approved" || value === "released";
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

export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export async function getReleaseRiskDashboard(
  serviceId: string,
  demoUserId?: string,
): Promise<ReleaseRiskDashboardData> {
  const query = new URLSearchParams({ serviceId });
  return request<ReleaseRiskDashboardData>(
    `/api/release-risk-dashboard?${query.toString()}`,
    undefined,
    demoUserId,
  );
}

export async function transitionRelease(
  releaseId: string,
  targetStatus: ReleaseStatus,
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
