const SESSION_STORAGE_KEY = "meco.session.token";
const LEGACY_LOCAL_STORAGE_KEY = SESSION_STORAGE_KEY;

let memorySessionToken: string | null = null;

function readStorage(storage: Storage | undefined, key: string) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorage(storage: Storage | undefined, key: string) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage access can be blocked by privacy settings; in-memory state still clears.
  }
}

function getBrowserWindow() {
  return typeof window === "undefined" ? null : window;
}

export function loadStoredSessionToken() {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return memorySessionToken;
  }

  const sessionToken = readStorage(browserWindow.sessionStorage, SESSION_STORAGE_KEY);
  if (sessionToken) {
    memorySessionToken = sessionToken;
    removeStorage(browserWindow.localStorage, LEGACY_LOCAL_STORAGE_KEY);
    return sessionToken;
  }

  const legacyToken = readStorage(browserWindow.localStorage, LEGACY_LOCAL_STORAGE_KEY);
  if (!legacyToken) {
    return memorySessionToken;
  }

  const storedInSession = writeStorage(
    browserWindow.sessionStorage,
    SESSION_STORAGE_KEY,
    legacyToken,
  );
  removeStorage(browserWindow.localStorage, LEGACY_LOCAL_STORAGE_KEY);
  memorySessionToken = storedInSession ? legacyToken : null;
  return memorySessionToken;
}

export function storeSessionToken(token: string) {
  memorySessionToken = token;
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return;
  }

  writeStorage(browserWindow.sessionStorage, SESSION_STORAGE_KEY, token);
  removeStorage(browserWindow.localStorage, LEGACY_LOCAL_STORAGE_KEY);
}

export function clearStoredSessionToken() {
  memorySessionToken = null;
  const browserWindow = getBrowserWindow();
  if (!browserWindow) {
    return;
  }

  removeStorage(browserWindow.sessionStorage, SESSION_STORAGE_KEY);
  removeStorage(browserWindow.localStorage, LEGACY_LOCAL_STORAGE_KEY);
}
