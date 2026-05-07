import { AuthBackdrop, AuthIntroPanel, AuthStatusCard, DevBypassButton, GoogleAuthChip, MobileReleasePanel } from "./AuthScreenSections";
import { detectMobileDevice } from "./authDevice";
import { getSignInScreenCopy } from "./authCopy";
import { EmailAuthPanel } from "./EmailAuthPanel";
import type { AuthStatusScreenProps, SignInScreenProps } from "./authTypes";

export function AuthStatusScreen(props: AuthStatusScreenProps) {
  return <AuthStatusCard {...props} />;
}

export function SignInScreen({
  authMessage,
  clearAuthMessage,
  googleButtonRef,
  hasEmailSignIn,
  hasGoogleSignIn,
  isDarkMode = false,
  isSigningIn,
  onDevBypassSignIn,
  onToggleDarkMode,
  onRequestEmailCode,
  onVerifyEmailCode,
  shellStyle,
  signInConfig,
}: SignInScreenProps) {
  const isMobileDevice = detectMobileDevice();
  const { body: authCardBody, title: authCardTitle } = getSignInScreenCopy({
    hasEmailSignIn,
    hasGoogleSignIn,
    isMobileDevice,
  });

  return (
    <main
      className={`page-shell auth-shell ${isDarkMode ? "dark-mode" : ""}`}
      style={shellStyle}
    >
      <div className="auth-layout">
        <AuthBackdrop className="auth-layout-backdrop" />

        <AuthIntroPanel
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />

        <section className="auth-card auth-card-wide">
          <div className="auth-card-header">
            <p className="eyebrow">Secure access</p>
            <h1>{authCardTitle}</h1>
            <p className="auth-body">{authCardBody}</p>
          </div>

          {authMessage ? (
            <p className="auth-error" role="alert">
              {authMessage}
            </p>
          ) : null}

          <div className="auth-signin-simple">
            {isMobileDevice ? (
              <MobileReleasePanel />
            ) : (
              <>
                {hasEmailSignIn ? (
                  <EmailAuthPanel
                    clearAuthMessage={clearAuthMessage}
                    hostedDomain={signInConfig.hostedDomain}
                    isSigningIn={isSigningIn}
                    onRequestEmailCode={onRequestEmailCode}
                    onVerifyEmailCode={onVerifyEmailCode}
                  />
                ) : null}

                {hasEmailSignIn && hasGoogleSignIn ? (
                  <p className="auth-method-divider" aria-hidden="true">
                    <span>OR</span>
                  </p>
                ) : null}

                {hasGoogleSignIn ? (
                  <GoogleAuthChip googleButtonRef={googleButtonRef} />
                ) : null}
              </>
            )}
          </div>
        </section>

        {signInConfig.devBypassAvailable && !isMobileDevice ? (
          <div className="auth-layout-dev-bypass-row">
            <DevBypassButton
              isSigningIn={isSigningIn}
              onDevBypassSignIn={onDevBypassSignIn}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
