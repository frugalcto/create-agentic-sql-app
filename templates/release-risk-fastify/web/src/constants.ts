export const DEMO_SERVICE_ID = "00000000-0000-0000-0000-000000000010";
export const DEMO_EMPTY_SERVICE_ID = "00000000-0000-0000-0000-000000000011";
export const DEMO_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_VIEWER_USER_ID = "00000000-0000-0000-0000-000000000002";

export function buildReleaseRiskDashboardPath(
  serviceId: string = DEMO_SERVICE_ID,
  demoUserId?: string,
): string {
  const params = new URLSearchParams({ serviceId });
  if (demoUserId) {
    params.set("demoUserId", demoUserId);
  }
  return `/release-risk-dashboard?${params.toString()}`;
}
