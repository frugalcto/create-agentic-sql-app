export const DEMO_SERVICE_ID = "00000000-0000-0000-0000-000000000010";
export const DEMO_EMPTY_SERVICE_ID = "00000000-0000-0000-0000-000000000011";

export function buildReleaseRiskDashboardPath(
  serviceId: string = DEMO_SERVICE_ID,
): string {
  const params = new URLSearchParams({ serviceId });
  return `/release-risk-dashboard?${params.toString()}`;
}

export function buildLoginPath(returnTo?: string): string {
  if (!returnTo) {
    return "/login";
  }

  const params = new URLSearchParams({ returnTo });
  return `/login?${params.toString()}`;
}
