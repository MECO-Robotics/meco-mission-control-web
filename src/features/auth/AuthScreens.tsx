import { type FormEvent, type RefObject, useRef, useState } from "react";

import {
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_WIDTH,
} from "../../lib/branding";
import type { AuthConfig, EmailCodeDeliveryResponse } from "../../lib/auth";

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

function AuthIntroPanel() {
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
        <p className="auth-body">
          Sign in with Google SSO or MECO email.
        </p>
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
  return (
    <main className="page-shell auth-shell">
      <div className="auth-layout">
        <AuthIntroPanel />

        <section className="auth-card auth-card-wide">
          <div className="auth-card-header">
            <p className="eyebrow">Secure access</p>
            <h1>Sign in with Google or email.</h1>
            <p className="auth-body">
              Both sign-in options are shown below. Use Google SSO or request a
              verified MECO email code.
            </p>
          </div>

          {authMessage ? (
            <p className="auth-error" role="alert">
              {authMessage}
            </p>
          ) : null}

          <div className="auth-panel-stack">
            <EmailAuthPanel
              clearAuthMessage={clearAuthMessage}
              hostedDomain={signInConfig.hostedDomain}
              isEmailDeliveryConfigured={hasEmailSignIn}
              isSigningIn={isSigningIn}
              onRequestEmailCode={onRequestEmailCode}
              onVerifyEmailCode={onVerifyEmailCode}
            />

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
          </div>
        </section>
      </div>
    </main>
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
