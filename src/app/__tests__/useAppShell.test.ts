/// <reference types="jest" />

import {
  readStoredThemePreference,
  writeStoredThemePreference,
} from "@/app/useAppShell";

describe("useAppShell storage helpers", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("falls back to light mode when window storage is unavailable", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });

    expect(readStoredThemePreference()).toBe(false);
    expect(() => writeStoredThemePreference(true)).not.toThrow();
  });

  it("does not throw when localStorage access is blocked", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => {
            throw new Error("blocked");
          },
          setItem: () => {
            throw new Error("blocked");
          },
        },
      },
    });

    expect(readStoredThemePreference()).toBe(false);
    expect(() => writeStoredThemePreference(true)).not.toThrow();
  });
});
