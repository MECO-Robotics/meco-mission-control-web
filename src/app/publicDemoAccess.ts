export const PUBLIC_DEMO_SEASON_ID = "default-season";

export function isPublicDemoSeasonAccess(args: {
  enforcedAuthConfig: unknown;
  selectedSeasonId: string | null;
  sessionUser: unknown;
}) {
  return Boolean(
    args.enforcedAuthConfig &&
      !args.sessionUser &&
      (args.selectedSeasonId === null || args.selectedSeasonId === PUBLIC_DEMO_SEASON_ID),
  );
}

export function shouldResetAuthenticatedPublicDemoSeasonScope(args: {
  selectedSeasonId: string | null;
  sessionUser: unknown;
}) {
  return Boolean(args.sessionUser && args.selectedSeasonId === PUBLIC_DEMO_SEASON_ID);
}
