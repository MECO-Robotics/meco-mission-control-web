/// <reference types="jest" />

import {
  readStoredThemePreference,
  writeStoredThemePreference,
} from "@/app/hooks/useAppShell";

describe("useAppShell storage helpers", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  afterEach(() => {
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
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

  it("respects the dark mode already applied to the document root", () => {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement: { classList: { contains: (value: string) => value === "dark-mode" } } },
    });
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: () => null } } });

    expect(readStoredThemePreference()).toBe(true);
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
