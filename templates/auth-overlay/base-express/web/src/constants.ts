export const DEMO_PROJECT_ID = "00000000-0000-0000-0000-000000000010";
export const DEMO_EMPTY_PROJECT_ID = "00000000-0000-0000-0000-000000000011";

export function buildSampleDashboardPath(
  projectId: string = DEMO_PROJECT_ID,
): string {
  const params = new URLSearchParams({ projectId });
  return `/sample-dashboard?${params.toString()}`;
}

export function buildLoginPath(returnTo?: string): string {
  if (!returnTo) {
    return "/login";
  }

  const params = new URLSearchParams({ returnTo });
  return `/login?${params.toString()}`;
}
