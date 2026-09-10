import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AppTopbarSlotPortal } from "../AppTopbarSlotPortal";

jest.mock("react", () => ({ ...jest.requireActual("react"), useEffect: jest.fn(), useState: jest.fn() }));
jest.mock("react-dom", () => ({ createPortal: jest.fn(() => "portal") }));

it("resolves a late host, returns inline after removal, and disconnects on unmount", () => {
  const previousDocument = globalThis.document;
  const previousObserver = globalThis.MutationObserver;
  let host: HTMLElement | null = null;
  let state: HTMLElement | null = null;
  let changed!: () => void;
  let mount!: () => (() => void);
  const disconnect = jest.fn();
  Object.defineProperty(globalThis, "document", { configurable: true, value: { body: {}, getElementById: () => host } });
  Object.defineProperty(globalThis, "MutationObserver", { configurable: true, value: class {
    constructor(callback: () => void) { changed = callback; }
    observe() {}
    disconnect = disconnect;
  } });
  jest.mocked(useEffect).mockImplementation((effect) => { mount = effect as () => () => void; });
  jest.mocked(useState).mockImplementation(() => [state, (next: unknown) => {
    state = typeof next === "function" ? next(state) : next as HTMLElement | null;
  }]);
  try {
    expect(AppTopbarSlotPortal({ children: "content", slot: "controls" })).toBe("content");
    const unmount = mount();
    host = {} as HTMLElement;
    changed();
    expect(AppTopbarSlotPortal({ children: "content", slot: "controls" })).toBe("portal");
    expect(createPortal).toHaveBeenCalledWith("content", host);
    host = null;
    changed();
    expect(AppTopbarSlotPortal({ children: "content", slot: "controls" })).toBe("content");
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  } finally {
    Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
    Object.defineProperty(globalThis, "MutationObserver", { configurable: true, value: previousObserver });
  }
});
