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
  getSessionGeneration,
  hasPendingSignOut,
  setPendingSignOut,
  purgeLegacySessionTokens,
  setSessionCsrfToken,
} from "./core/sessionStorage";

function staleSessionResponse() {
  return Object.assign(new Error("Session changed while the request was pending."), { name: "AbortError" });
}

async function signIn(path: string, body: unknown) {
  clearWebSessionState();
  const generation = getSessionGeneration();
  try {
    const session = await postJson<SessionResponse>(path, body);
    if (generation !== getSessionGeneration()) throw staleSessionResponse();
    setPendingSignOut(false);
    setSessionCsrfToken(session.csrfToken);
    return session;
  } catch (error) {
    if (generation !== getSessionGeneration()) throw staleSessionResponse();
    throw error;
  }
}

export function exchangeGoogleCredential(credential: string) {
  return signIn("/auth/web/google", { credential });
}

export function requestEmailSignInCode(email: string) {
  return postJson<EmailCodeDeliveryResponse>("/auth/email/start", {
    email,
  });
}

export function verifyEmailSignInCode(email: string, code: string) {
  return signIn("/auth/web/email/verify", { email, code });
}

export function requestDevBypassSignIn(role: DevBypassRole = "student") {
  return signIn("/auth/web/dev-bypass", { role });
}

export async function restoreWebSession() {
  const generation = getSessionGeneration();
  purgeLegacySessionTokens();
  const assertRestorable = () => {
    if (hasPendingSignOut()) {
      throw Object.assign(new Error("Explicit sign-in is required after an unconfirmed sign-out."), { statusCode: 401 });
    }
  };
  assertRestorable();
  const session = await fetchWebSession();
  if (generation !== getSessionGeneration()) throw staleSessionResponse();
  assertRestorable();
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
    await fetchWebSession();
    return true;
  } catch (error) {
    if (isApiErrorLike(error) && error.statusCode === 401) {
      return false;
    }

    // Keep the current session during transient network/server failures. The
    // current session owner handles explicit 401s.
    return true;
  }
}
