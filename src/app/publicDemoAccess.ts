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

export function isPublicDemoWorkspaceSession(args: {
  enforcedAuthConfig: unknown;
  isSignInScreenRequested: boolean;
  selectedSeasonId: string | null;
  sessionUser: unknown;
}) {
  return (
    !args.isSignInScreenRequested &&
    isPublicDemoSeasonAccess({
      enforcedAuthConfig: args.enforcedAuthConfig,
      selectedSeasonId: args.selectedSeasonId,
      sessionUser: args.sessionUser,
    })
  );
}

export function shouldResetAuthenticatedPublicDemoSeasonScope(args: {
  selectedSeasonId: string | null;
  sessionUser: unknown;
}) {
  return Boolean(args.sessionUser && args.selectedSeasonId === PUBLIC_DEMO_SEASON_ID);
}
