import type {
  EmailCodeDeliveryResponse,
  SessionResponse,
} from "./types";
import {
  fetchCurrentUser,
  isApiErrorLike,
  postJson,
} from "./core/request";
import { loadStoredSessionToken } from "./core/sessionStorage";

export function exchangeGoogleCredential(credential: string) {
  return postJson<SessionResponse>("/auth/google", { credential });
}

export function requestEmailSignInCode(email: string) {
  return postJson<EmailCodeDeliveryResponse>("/auth/email/start", {
    email,
  });
}

export function verifyEmailSignInCode(email: string, code: string) {
  return postJson<SessionResponse>("/auth/email/verify", {
    email,
    code,
  });
}

export function requestDevBypassSignIn() {
  return postJson<SessionResponse>("/auth/dev-bypass", {});
}

export async function validateSession(): Promise<boolean> {
  try {
    const token = loadStoredSessionToken();
    if (!token) {
      return false;
    }

    await fetchCurrentUser(token);
    return true;
  } catch (error) {
    if (isApiErrorLike(error) && error.statusCode === 401) {
      return false;
    }

    // Keep the current session during transient network/server failures. The
    // request layer still expires sessions immediately on explicit 401s.
    return true;
  }
}
