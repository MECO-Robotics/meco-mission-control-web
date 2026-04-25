import { type FormEvent, type RefObject, useRef, useState } from "react";

import {
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_WIDTH,
} from "@/lib/branding";
import type { AuthConfig, EmailCodeDeliveryResponse } from "@/lib/auth";

const MOBILE_RELEASES_URL =
  "https://github.com/MECO-Robotics/PM-mobile-app/releases";
const MOBILE_USER_AGENT_PATTERN =
  /android|iphone|ipod|mobile|windows phone|blackberry|opera mini/i;

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

function detectMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const nav = navigator as NavigatorWithUserAgentData;
  const userAgent = nav.userAgent?.toLowerCase() ?? "";

  if (nav.userAgentData?.mobile) {
    return true;
  }

  if (MOBILE_USER_AGENT_PATTERN.test(userAgent)) {
    return true;
  }

  return /ipad/i.test(userAgent) || (userAgent.includes("macintosh") && nav.maxTouchPoints > 1);
}

interface AuthStatusScreenProps {
  body: string;
  eyebrow?: string;
  message?: string | null;
  title: string;
}

export function AuthStatusScreen({
  body,
  eyebrow = "MECO workspace",
  message,
  title,
}: AuthStatusScreenProps) {
  return (
    <main className="page-shell auth-shell">
      <section className="auth-card auth-card-status">
        <img
          alt="MECO main logo"
          className="auth-status-mark"
          height={MECO_MAIN_LOGO_HEIGHT}
          loading="eager"
          width={MECO_MAIN_LOGO_WIDTH}
          src={MECO_MAIN_LOGO_LIGHT_SRC}
        />
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-body">{body}</p>
        {message ? <p className="auth-error">{message}</p> : null}
      </section>
    </main>
  );
}

interface SignInScreenProps {
  authMessage: string | null;
  clearAuthMessage: () => void;
  googleButtonRef: RefObject<HTMLDivElement | null>;
  hasEmailSignIn: boolean;
  hasGoogleSignIn: boolean;
  isLocalGoogleDevHost: boolean;
  isLocalGoogleOverrideActive: boolean;
  isSigningIn: boolean;
  onDevBypassSignIn: () => Promise<void>;
  onRequestEmailCode: (email: string) => Promise<EmailCodeDeliveryResponse>;
  onVerifyEmailCode: (email: string, code: string) => Promise<void>;
  signInConfig: AuthConfig;
}

function AuthIntroPanel({
  hasEmailSignIn,
  hasGoogleSignIn,
}: {
  hasEmailSignIn: boolean;
  hasGoogleSignIn: boolean;
}) {
  const authIntroLine =
    hasEmailSignIn && hasGoogleSignIn
      ? "Sign in with Google SSO or MECO email."
      : hasGoogleSignIn
        ? "Sign in with Google SSO."
        : hasEmailSignIn
          ? "Sign in with your MECO email."
          : "No sign-in methods are currently configured.";

  return (
    <aside className="auth-intro" aria-label="MECO sign-in overview">
      <div className="auth-intro-mark-wrap">
        <img
          alt="MECO main logo"
          className="auth-intro-mark"
          height={MECO_MAIN_LOGO_HEIGHT}
          loading="eager"
          width={MECO_MAIN_LOGO_WIDTH}
          src={MECO_MAIN_LOGO_WHITE_SRC}
        />
      </div>

      <div className="auth-intro-copy">
        <p className="eyebrow">MECO Robotics</p>
        <h1>Sign in to the project workspace.</h1>
        <p className="auth-body auth-intro-description">
          <span>Plan. Build. Verify.</span>
          <span>One system for tasks, parts, and QA.</span>
        </p>
        <p className="auth-body">{authIntroLine}</p>
      </div>
    </aside>
  );
}

export function SignInScreen({
  authMessage,
  clearAuthMessage,
  googleButtonRef,
  hasEmailSignIn,
  hasGoogleSignIn,
  isLocalGoogleDevHost,
  isLocalGoogleOverrideActive,
  isSigningIn,
  onDevBypassSignIn,
  onRequestEmailCode,
  onVerifyEmailCode,
  signInConfig,
}: SignInScreenProps) {
  const isMobileDevice = detectMobileDevice();

  const authCardTitle = isMobileDevice
    ? "Use the PM mobile app."
    :
    hasEmailSignIn && hasGoogleSignIn
      ? "Sign in with Google or email."
      : hasGoogleSignIn
        ? "Sign in with Google."
        : hasEmailSignIn
          ? "Sign in with email."
          : "Sign-in is currently unavailable.";

  const authCardBody = isMobileDevice
    ? "Login is hidden on detected mobile devices. Install the latest iOS or Android build from PM mobile app releases."
    :
    hasEmailSignIn && hasGoogleSignIn
      ? "Both sign-in options are shown below. Use Google SSO or request a verified MECO email code."
      : hasGoogleSignIn
        ? "Google SSO is available below. Email code sign-in is not configured on this server."
        : hasEmailSignIn
          ? "Email code sign-in is available below. Google SSO is not configured on this server."
          : "No sign-in methods are currently configured on this server.";

  return (
    <main className="page-shell auth-shell">
      <div className="auth-layout">
        <AuthIntroPanel
          hasEmailSignIn={hasEmailSignIn}
          hasGoogleSignIn={hasGoogleSignIn}
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

          <div className="auth-panel-stack">
            {isMobileDevice ? (
              <MobileReleasePanel />
            ) : (
              <>
                {hasEmailSignIn ? (
                  <EmailAuthPanel
                    clearAuthMessage={clearAuthMessage}
                    hostedDomain={signInConfig.hostedDomain}
                    isEmailDeliveryConfigured={hasEmailSignIn}
                    isSigningIn={isSigningIn}
                    onRequestEmailCode={onRequestEmailCode}
                    onVerifyEmailCode={onVerifyEmailCode}
                  />
                ) : null}

                <GoogleAuthPanel
                  googleButtonRef={googleButtonRef}
                  hasGoogleSignIn={hasGoogleSignIn}
                  hostedDomain={signInConfig.hostedDomain}
                  isLocalGoogleDevHost={isLocalGoogleDevHost}
                  isLocalGoogleOverrideActive={isLocalGoogleOverrideActive}
                  isSigningIn={isSigningIn}
                />

                {signInConfig.devBypassAvailable ? (
                  <DevBypassPanel
                    isSigningIn={isSigningIn}
                    onDevBypassSignIn={onDevBypassSignIn}
                  />
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MobileReleasePanel() {
  return (
    <section className="auth-panel" aria-label="Mobile app releases">
      <div className="auth-panel-copy">
        <p className="auth-panel-eyebrow">Mobile app</p>
        <h2>Install from PM mobile app releases.</h2>
        <p className="auth-body">
          Open the GitHub releases page to get the latest mobile build for your
          device.
        </p>
      </div>

      <div className="auth-mobile-platforms" aria-label="Supported mobile platforms">
        <span className="auth-mobile-platform">
          <IosPlatformIcon />
          <span>iOS</span>
        </span>
        <span className="auth-mobile-platform">
          <AndroidPlatformIcon />
          <span>Android</span>
        </span>
      </div>

      <div className="auth-form-actions">
        <a
          className="secondary-action auth-release-link"
          href={MOBILE_RELEASES_URL}
          rel="noreferrer"
          target="_blank"
        >
          Open mobile releases
        </a>
      </div>
    </section>
  );
}

function IosPlatformIcon() {
  return (
    <svg
      aria-hidden="true"
      className="auth-mobile-platform-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect height="19" rx="2.35" stroke="currentColor" strokeWidth="1.7" width="10.5" x="6.75" y="2.5" />
      <path d="M10 5.4h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="12" cy="18.2" fill="currentColor" r="0.95" />
    </svg>
  );
}

function AndroidPlatformIcon() {
  return (
    <svg
      aria-hidden="true"
      className="auth-mobile-platform-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M8.2 7 7 5.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M15.8 7 17 5.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <rect height="9.8" rx="2.8" stroke="currentColor" strokeWidth="1.7" width="12" x="6" y="7.2" />
      <circle cx="9.8" cy="11.5" fill="currentColor" r="0.92" />
      <circle cx="14.2" cy="11.5" fill="currentColor" r="0.92" />
    </svg>
  );
}

interface GoogleAuthPanelProps {
  googleButtonRef: RefObject<HTMLDivElement | null>;
  hasGoogleSignIn: boolean;
  hostedDomain: string;
  isLocalGoogleDevHost: boolean;
  isLocalGoogleOverrideActive: boolean;
  isSigningIn: boolean;
}

function GoogleAuthPanel({
  googleButtonRef,
  hasGoogleSignIn,
  isLocalGoogleDevHost,
  isLocalGoogleOverrideActive,
}: GoogleAuthPanelProps) {
  return (
    <section className="auth-panel" aria-label="Google SSO">
      <div className="auth-panel-copy">
        <p className="auth-panel-eyebrow">Google SSO</p>
        <h2>Use a MECO Google Workspace account.</h2>
      </div>


      {hasGoogleSignIn ? (
        <div className="google-button-slot" ref={googleButtonRef} />
      ) : (
        <p className="auth-note">
          Google SSO is not yet configured on this server.
        </p>
      )}

      {hasGoogleSignIn && isLocalGoogleDevHost && !isLocalGoogleOverrideActive ? (
        <p className="auth-note">
          Localhost Google sign-in needs an OAuth client that allows
          http://localhost:5173, or a separate localhost-safe client set in
          VITE_LOCAL_GOOGLE_CLIENT_ID.
        </p>
      ) : null}
    </section>
  );
}

interface DevBypassPanelProps {
  isSigningIn: boolean;
  onDevBypassSignIn: () => Promise<void>;
}

function DevBypassPanel({
  isSigningIn,
  onDevBypassSignIn,
}: DevBypassPanelProps) {
  return (
    <section className="auth-panel" aria-label="Development sign-in bypass">
      <div className="auth-panel-copy">
        <p className="auth-panel-eyebrow">Development only</p>
        <h2>Skip sign-in with a local dev session.</h2>
        <p className="auth-body">
          Use this button to jump into the workspace while keeping the real login page
          available for testing.
        </p>
      </div>

      <div className="auth-form-actions">
        <button
          className="secondary-action"
          disabled={isSigningIn}
          onClick={() => {
            void onDevBypassSignIn();
          }}
          type="button"
        >
          {isSigningIn ? "Opening..." : "Continue as local dev"}
        </button>
      </div>
    </section>
  );
}

interface EmailAuthPanelProps {
  clearAuthMessage: () => void;
  isEmailDeliveryConfigured: boolean;
  hostedDomain: string;
  isSigningIn: boolean;
  onRequestEmailCode: (email: string) => Promise<EmailCodeDeliveryResponse>;
  onVerifyEmailCode: (email: string, code: string) => Promise<void>;
}

function EmailAuthPanel({
  clearAuthMessage,
  isEmailDeliveryConfigured,
  hostedDomain,
  isSigningIn,
  onRequestEmailCode,
  onVerifyEmailCode,
}: EmailAuthPanelProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [delivery, setDelivery] = useState<EmailCodeDeliveryResponse | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const feedbackMessage = isRequestingCode
    ? `Sending a code to ${email.trim() || "your inbox"}...`
    : delivery
      ? `Code sent to ${delivery.sentTo}. It expires in ${delivery.expiresInMinutes} minutes.`
      : isEmailDeliveryConfigured
        ? "We'll send a one-time code to your inbox."
        : "Email delivery is not configured on this server.";

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsRequestingCode(true);

    try {
      const response = await onRequestEmailCode(email);
      setDelivery(response);
      setCode("");
      window.setTimeout(() => {
        codeInputRef.current?.focus();
      }, 0);
    } catch {
      // The hook already surfaced the error message.
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await onVerifyEmailCode(email, code);
    } catch {
      // The hook already surfaced the error message.
    }
  };

  return (
    <section className="auth-panel" aria-label="Email code">
      <div className="auth-panel-copy">
        <p className="auth-panel-eyebrow">Email code</p>
        <h2>Use your MECO email to request a one-time code.</h2>
      </div>

      <form className="auth-form" onSubmit={handleRequestCode}>
        <label className="field">
          <input
            autoComplete="email"
            inputMode="email"
            onChange={(event) => {
              clearAuthMessage();
              setEmail(event.target.value);
              setCode("");
              setDelivery(null);
            }}
            placeholder={`you@${hostedDomain}`}
            type="email"
            value={email}
          />
        </label>

        <div className="auth-form-actions">
          <button
            className="primary-action"
            disabled={
              isSigningIn ||
              isRequestingCode ||
              email.trim().length === 0 ||
              !isEmailDeliveryConfigured
            }
            type="submit"
          >
            {isRequestingCode ? "Sending..." : delivery ? "Resend code" : "Send code"}
          </button>
        </div>

        <div
          aria-atomic="true"
          aria-live="polite"
          className={`auth-feedback ${
            isRequestingCode
              ? "auth-feedback-loading"
              : delivery
                ? "auth-feedback-success"
                : "auth-feedback-muted"
          }`}
          role="status"
        >
          {isRequestingCode ? <span aria-hidden="true" className="auth-feedback-spinner" /> : null}
          <span>{feedbackMessage}</span>
        </div>
      </form>

      {delivery ? (
        <form className="auth-form auth-email-verify" onSubmit={handleVerifyCode}>
          <p className="auth-success" role="status">
            Enter the code from the email we just sent.
          </p>

          <label className="field">
            <span>One-time code</span>
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              onChange={(event) => {
                clearAuthMessage();
                setCode(event.target.value);
              }}
              placeholder="123456"
              ref={codeInputRef}
              type="text"
              value={code}
            />
          </label>

          <div className="auth-form-actions">
            <button
              className="primary-action"
              disabled={isSigningIn || code.trim().length === 0}
              type="submit"
            >
              Verify code
            </button>
          </div>
        </form>
      ) : (
        null
      )}
    </section>
  );
}

