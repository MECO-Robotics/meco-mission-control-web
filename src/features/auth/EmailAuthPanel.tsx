import type { EmailCodeDeliveryResponse } from "@/lib/auth/types";

import { useEmailAuthPanel } from "./useEmailAuthPanel";

interface EmailAuthPanelProps {
  clearAuthMessage: () => void;
  hostedDomain: string;
  isSigningIn: boolean;
  onRequestEmailCode: (email: string) => Promise<EmailCodeDeliveryResponse>;
  onVerifyEmailCode: (email: string, code: string) => Promise<void>;
}

export function EmailAuthPanel({
  clearAuthMessage,
  hostedDomain,
  isSigningIn,
  onRequestEmailCode,
  onVerifyEmailCode,
}: EmailAuthPanelProps) {
  const {
    code,
    codeInputRef,
    delivery,
    email,
    handleCodeChange,
    handleEmailChange,
    handleRequestCode,
    handleVerifyCode,
    isRequestingCode,
  } = useEmailAuthPanel({
    clearAuthMessage,
    onRequestEmailCode,
    onVerifyEmailCode,
  });

  return (
    <section className="auth-email-method" aria-label="Email code">
      <form className="auth-form auth-email-inline" onSubmit={handleRequestCode}>
        <label className="field auth-email-send-field">
          <input
            autoComplete="email"
            className="auth-email-input"
            inputMode="email"
            onChange={handleEmailChange}
            placeholder={`you@${hostedDomain}`}
            type="email"
            value={email}
          />
          <button
            className="auth-email-send-button"
            disabled={isSigningIn || isRequestingCode || email.trim().length === 0}
            type="submit"
          >
            Send
          </button>
        </label>
      </form>

      {delivery ? (
        <form className="auth-form auth-email-inline auth-email-verify-inline" onSubmit={handleVerifyCode}>
          <label className="field">
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              onChange={handleCodeChange}
              placeholder="One-time code"
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
      ) : null}
    </section>
  );
}
