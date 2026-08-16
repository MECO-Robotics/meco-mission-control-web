import type {
  DevBypassRole,
  EmailCodeDeliveryResponse,
  SessionResponse,
} from "./types";
import {
  fetchWebSession,
  isApiErrorLike,
  postJson,
  requestApi,
} from "./core/request";
import {
  clearWebSessionState,
  purgeLegacySessionTokens,
  setSessionCsrfToken,
} from "./core/sessionStorage";

function rememberWebSession(session: SessionResponse) {
  setSessionCsrfToken(session.csrfToken);
  return session;
}

export function exchangeGoogleCredential(credential: string) {
  return postJson<SessionResponse>("/auth/web/google", { credential }).then(
    rememberWebSession,
  );
}

export function requestEmailSignInCode(email: string) {
  return postJson<EmailCodeDeliveryResponse>("/auth/email/start", {
    email,
  });
}

export function verifyEmailSignInCode(email: string, code: string) {
  return postJson<SessionResponse>("/auth/web/email/verify", {
    email,
    code,
  }).then(rememberWebSession);
}

export function requestDevBypassSignIn(role: DevBypassRole = "student") {
  return postJson<SessionResponse>("/auth/web/dev-bypass", { role }).then(
    rememberWebSession,
  );
}

export async function restoreWebSession() {
  purgeLegacySessionTokens();
  const session = await fetchWebSession();
  setSessionCsrfToken(session.csrfToken);
  return session;
}

export function revokeWebSession() {
  return requestApi<{ ok: boolean }>("/auth/web/logout", {
    keepalive: true,
    method: "POST",
  }).catch((error) => {
    if (isApiErrorLike(error) && error.statusCode === 401) {
      return { ok: true };
    }

    throw error;
  });
}

export async function validateSession(): Promise<boolean> {
  try {
    await restoreWebSession();
    return true;
  } catch (error) {
    if (isApiErrorLike(error) && error.statusCode === 401) {
      clearWebSessionState();
      return false;
    }

    // Keep the current session during transient network/server failures. The
    // request layer still expires sessions immediately on explicit 401s.
    return true;
  }
}
