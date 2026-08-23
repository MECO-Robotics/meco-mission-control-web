const LEGACY_SESSION_STORAGE_KEY = "meco.session.token";

let memoryCsrfToken: string | null = null;

function removeStorage(storageName: "localStorage" | "sessionStorage", key: string) {
  try {
    getBrowserWindow()?.[storageName]?.removeItem(key);
  } catch {
    // Storage access can be blocked by privacy settings. The cookie session is
    // unaffected, and no credential is kept in browser-readable storage.
  }
}

function getBrowserWindow() {
  return typeof window === "undefined" ? null : window;
}

export function purgeLegacySessionTokens() {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return;
  }

  removeStorage("sessionStorage", LEGACY_SESSION_STORAGE_KEY);
  removeStorage("localStorage", LEGACY_SESSION_STORAGE_KEY);
}

export function getSessionCsrfToken() {
  return memoryCsrfToken;
}

export function setSessionCsrfToken(csrfToken: string) {
  purgeLegacySessionTokens();
  memoryCsrfToken = csrfToken;
}

export function clearWebSessionState() {
  memoryCsrfToken = null;
  purgeLegacySessionTokens();
}

// Compatibility exports for the public auth barrel. They intentionally never
// load or persist bearer credentials and can be removed with the next API cleanup.
export function loadStoredSessionToken() {
  purgeLegacySessionTokens();
  return null;
}

export function storeSessionToken(unusedToken: string) {
  void unusedToken;
  purgeLegacySessionTokens();
}

export const clearStoredSessionToken = clearWebSessionState;
