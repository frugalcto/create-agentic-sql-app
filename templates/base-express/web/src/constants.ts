export const DEMO_PROJECT_ID = "00000000-0000-0000-0000-000000000010";
export const DEMO_EMPTY_PROJECT_ID = "00000000-0000-0000-0000-000000000011";
export const DEMO_ADMIN_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_VIEWER_USER_ID = "00000000-0000-0000-0000-000000000002";

export function buildSampleDashboardPath(
  projectId: string = DEMO_PROJECT_ID,
  demoUserId?: string,
): string {
  const params = new URLSearchParams({ projectId });
  if (demoUserId) {
    params.set("demoUserId", demoUserId);
  }
  return `/sample-dashboard?${params.toString()}`;
}
