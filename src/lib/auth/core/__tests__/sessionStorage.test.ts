/// <reference types="jest" />

import {
  clearWebSessionState,
  hasPendingSignOut,
  setPendingSignOut,
  getSessionCsrfToken,
  purgeLegacySessionTokens,
  setSessionCsrfToken,
} from "../sessionStorage";

function createMemoryStorage(throwOnAccess = false): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      if (throwOnAccess) throw new Error("blocked");
      values.clear();
    },
    getItem(key: string) {
      if (throwOnAccess) throw new Error("blocked");
      return values.get(key) ?? null;
    },
    key(index: number) {
      if (throwOnAccess) throw new Error("blocked");
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      if (throwOnAccess) throw new Error("blocked");
      values.delete(key);
    },
    setItem(key: string, value: string) {
      if (throwOnAccess) throw new Error("blocked");
      values.set(key, value);
    },
  };
}

function installWindowStorage({
  localStorage = createMemoryStorage(),
  sessionStorage = createMemoryStorage(),
}: {
  localStorage?: Storage;
  sessionStorage?: Storage;
} = {}) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage, sessionStorage },
  });

  return { localStorage, sessionStorage };
}

describe("web session state", () => {
  it("retains only logout intent across a fresh module load until explicitly cleared", () => {
    installWindowStorage();
    setPendingSignOut(true);
    clearWebSessionState();
    jest.isolateModules(() => {
      const reloaded = jest.requireActual<typeof import("../sessionStorage")>("../sessionStorage");
      expect(reloaded.hasPendingSignOut()).toBe(true);
      expect(reloaded.getSessionCsrfToken()).toBeNull();
      reloaded.setPendingSignOut(false);
      expect(reloaded.hasPendingSignOut()).toBe(false);
    });
    setPendingSignOut(false);
    expect(hasPendingSignOut()).toBe(false);
  });
  afterEach(() => {
    clearWebSessionState();
    setPendingSignOut(false);
    Reflect.deleteProperty(globalThis, "window");
  });

  it("purges bearer credentials from both browser storage mechanisms", () => {
    const { localStorage, sessionStorage } = installWindowStorage();
    localStorage.setItem("meco.session.token", "legacy-token");
    sessionStorage.setItem("meco.session.token", "session-token");

    purgeLegacySessionTokens();

    expect(localStorage.getItem("meco.session.token")).toBeNull();
    expect(sessionStorage.getItem("meco.session.token")).toBeNull();
  });

  it("keeps only the CSRF token in module memory", () => {
    const { localStorage, sessionStorage } = installWindowStorage();

    setSessionCsrfToken("csrf-token");

    expect(getSessionCsrfToken()).toBe("csrf-token");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("clears memory even when browser storage access is blocked", () => {
    installWindowStorage({
      localStorage: createMemoryStorage(true),
      sessionStorage: createMemoryStorage(true),
    });
    setSessionCsrfToken("csrf-token");

    clearWebSessionState();

    expect(getSessionCsrfToken()).toBeNull();
  });

  it("does not throw when browser storage property access is blocked", () => {
    const blockedWindow = {} as Window;
    Object.defineProperties(blockedWindow, {
      localStorage: { get: () => { throw new DOMException("blocked", "SecurityError"); } },
      sessionStorage: { get: () => { throw new DOMException("blocked", "SecurityError"); } },
    });
    Object.defineProperty(globalThis, "window", { configurable: true, value: blockedWindow });

    expect(() => purgeLegacySessionTokens()).not.toThrow();
    expect(() => setSessionCsrfToken("csrf-token")).not.toThrow();
    expect(getSessionCsrfToken()).toBe("csrf-token");
  });
});
