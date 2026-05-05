export interface SignInScreenCopyInput {
  hasEmailSignIn: boolean;
  hasGoogleSignIn: boolean;
  isMobileDevice: boolean;
}

export function getSignInScreenCopy({
  hasEmailSignIn,
  hasGoogleSignIn,
  isMobileDevice,
}: SignInScreenCopyInput) {
  const title = isMobileDevice
    ? "Use the Mission Control mobile app."
    : hasEmailSignIn && hasGoogleSignIn
      ? "Sign in with Google or email."
      : hasGoogleSignIn
        ? "Sign in with Google."
        : hasEmailSignIn
          ? "Sign in with email."
          : "Sign-in is currently unavailable.";

  const body = isMobileDevice
    ? "Login is hidden on detected mobile devices. Install the latest iOS or Android build from Mission Control mobile releases."
    : hasEmailSignIn && hasGoogleSignIn
      ? "Use Google SSO or request a verified email code."
      : hasGoogleSignIn
        ? "Google SSO is available below. Email code sign-in is not configured on this server."
        : hasEmailSignIn
          ? "Email code sign-in is available below. Google SSO is not configured on this server."
          : "No sign-in methods are currently configured on this server.";

  return { body, title };
}
