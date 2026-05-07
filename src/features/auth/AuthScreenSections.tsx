import { type RefObject } from "react";

import {
  MECO_LOGIN_BACKDROP_SRC,
  MECO_MAIN_LOGO_LIGHT_SRC,
  MECO_MAIN_LOGO_WHITE_SRC,
  MECO_MAIN_LOGO_HEIGHT,
  MECO_MAIN_LOGO_WIDTH,
} from "@/lib/branding";
import { MOBILE_RELEASES_URL } from "./authDevice";
import type { AuthStatusScreenProps } from "./authTypes";

interface AuthIntroPanelProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function AuthIntroPanel({
  isDarkMode,
  onToggleDarkMode,
}: AuthIntroPanelProps) {
  const themeToggleTitle = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  return (
    <aside className="auth-intro" aria-label="MECO sign-in overview">
      <div className="auth-intro-brand-row">
        <button
          aria-label="Toggle dark mode"
          aria-pressed={isDarkMode}
          className={`auth-theme-toggle ${isDarkMode ? "is-dark" : "is-light"}`}
          onClick={onToggleDarkMode}
          title={themeToggleTitle}
          type="button"
        >
          <span aria-hidden="true" className="auth-theme-toggle-track">
            <span className="auth-theme-toggle-thumb">
              <span className="auth-theme-toggle-icon">
                {isDarkMode ? "\u263E" : "\u2600"}
              </span>
            </span>
          </span>
        </button>

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
      </div>

      <div className="auth-intro-copy">
        <h1>Mission Control</h1>
        <p className="auth-body auth-intro-description">
          <span>Plan. Build. Verify.</span>
          <span>One system for tasks, parts, and QA.</span>
        </p>
      </div>
    </aside>
  );
}

interface AuthBackdropProps {
  className: string;
}

export function AuthBackdrop({ className }: AuthBackdropProps) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      loading="eager"
      src={MECO_LOGIN_BACKDROP_SRC}
    />
  );
}

export function MobileReleasePanel() {
  return (
    <section className="auth-panel" aria-label="Mobile app releases">
      <div className="auth-panel-copy">
        <p className="auth-panel-eyebrow">Mobile app</p>
        <h2>Install from Mission Control mobile releases.</h2>
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

interface GoogleAuthChipProps {
  googleButtonRef: RefObject<HTMLDivElement | null>;
}

export function GoogleAuthChip({
  googleButtonRef,
}: GoogleAuthChipProps) {
  return (
    <div className="auth-google-chip" aria-label="Google SSO">
      <div className="auth-chip-row">
        <div className="google-button-slot" ref={googleButtonRef} />
      </div>
    </div>
  );
}

interface DevBypassButtonProps {
  isSigningIn: boolean;
  onDevBypassSignIn: () => Promise<void>;
}

export function DevBypassButton({
  isSigningIn,
  onDevBypassSignIn,
}: DevBypassButtonProps) {
  return (
    <div className="auth-dev-bypass" aria-label="Development sign-in bypass">
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
  );
}

export function AuthStatusCard({
  body,
  eyebrow = "MECO Mission Control",
  isDarkMode = false,
  message,
  shellStyle,
  title,
}: AuthStatusScreenProps) {
  return (
    <main
      className={`page-shell auth-shell ${isDarkMode ? "dark-mode" : ""}`}
      style={shellStyle}
    >
      <section className="auth-card auth-card-status">
        <img
          alt="MECO main logo"
          className="auth-status-mark"
          height={MECO_MAIN_LOGO_HEIGHT}
          loading="eager"
          width={MECO_MAIN_LOGO_WIDTH}
          src={isDarkMode ? MECO_MAIN_LOGO_WHITE_SRC : MECO_MAIN_LOGO_LIGHT_SRC}
        />
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-body">{body}</p>
        {message ? <p className="auth-error">{message}</p> : null}
      </section>
    </main>
  );
}
