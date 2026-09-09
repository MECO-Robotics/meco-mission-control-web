import { useEffect } from "react";
import { useAppWorkspaceGlobalEffects } from "../useAppWorkspaceGlobalEffects";

jest.mock("react", () => ({ ...jest.requireActual("react"), useEffect: jest.fn() }));

it("leaves browser magnification events uncancelled while workspace effects are mounted", () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const windowTarget = new EventTarget();
  const cleanups: Array<() => void> = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: windowTarget });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    documentElement: { style: { setProperty: jest.fn(), removeProperty: jest.fn() },
      classList: { toggle: jest.fn(), remove: jest.fn() } },
  } });
  (useEffect as jest.Mock).mockImplementation((effect: () => (() => void) | undefined) => {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  });
  try {
    useAppWorkspaceGlobalEffects({ isDarkMode: false, pageShellStyle: {},
      isSidebarOverlay: false, toggleSidebar: jest.fn(), setDataMessage: jest.fn() });
    for (const [type, key] of [["keydown", "+"], ["keydown", "-"], ["keydown", "0"],
      ["wheel", ""], ["gesturestart", ""], ["gesturechange", ""]]) {
      const event = new Event(type, { cancelable: true });
      Object.assign(event, { key, ctrlKey: true, metaKey: false });
      windowTarget.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
  } finally {
    cleanups.forEach((cleanup) => cleanup());
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
  }
});
