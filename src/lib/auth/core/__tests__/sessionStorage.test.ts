/// <reference types="jest" />

import {
  clearStoredSessionToken,
  loadStoredSessionToken,
  storeSessionToken,
} from "../sessionStorage";

function createMemoryStorage(throwOnAccess = false): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      if (throwOnAccess) {
        throw new Error("blocked");
      }
      values.clear();
    },
    getItem(key: string) {
      if (throwOnAccess) {
        throw new Error("blocked");
      }
      return values.get(key) ?? null;
    },
    key(index: number) {
      if (throwOnAccess) {
        throw new Error("blocked");
      }
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      if (throwOnAccess) {
        throw new Error("blocked");
      }
      values.delete(key);
    },
    setItem(key: string, value: string) {
      if (throwOnAccess) {
        throw new Error("blocked");
      }
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
    value: {
      localStorage,
      sessionStorage,
    },
  });

  return { localStorage, sessionStorage };
}

describe("auth session storage", () => {
  afterEach(() => {
    clearStoredSessionToken();
    Reflect.deleteProperty(globalThis, "window");
  });

  it("stores bearer tokens in sessionStorage, not localStorage", () => {
    const { localStorage, sessionStorage } = installWindowStorage();

    storeSessionToken("session-token");

    expect(sessionStorage.getItem("meco.session.token")).toBe("session-token");
    expect(localStorage.getItem("meco.session.token")).toBeNull();
    expect(loadStoredSessionToken()).toBe("session-token");
  });

  it("migrates and removes the legacy localStorage token", () => {
    const { localStorage, sessionStorage } = installWindowStorage();
    localStorage.setItem("meco.session.token", "legacy-token");

    expect(loadStoredSessionToken()).toBe("legacy-token");
    expect(sessionStorage.getItem("meco.session.token")).toBe("legacy-token");
    expect(localStorage.getItem("meco.session.token")).toBeNull();
  });

  it("falls back to memory when sessionStorage is blocked", () => {
    const { localStorage } = installWindowStorage({
      sessionStorage: createMemoryStorage(true),
    });

    storeSessionToken("memory-token");

    expect(loadStoredSessionToken()).toBe("memory-token");
    expect(localStorage.getItem("meco.session.token")).toBeNull();
  });

  it("clears session, legacy, and memory tokens", () => {
    const { localStorage, sessionStorage } = installWindowStorage();

    storeSessionToken("session-token");
    localStorage.setItem("meco.session.token", "legacy-token");
    clearStoredSessionToken();

    expect(loadStoredSessionToken()).toBeNull();
    expect(sessionStorage.getItem("meco.session.token")).toBeNull();
    expect(localStorage.getItem("meco.session.token")).toBeNull();
  });
});
