import { useLayoutEffect, useRef, useState } from "react";
import { useCompactSearchPopover } from "../useCompactSearchPopover";

jest.mock("react", () => ({ ...jest.requireActual("react"), useLayoutEffect: jest.fn(), useRef: jest.fn(), useState: jest.fn() }));
const originalDocument = globalThis.document;
const originalWindow = globalThis.window;
const originalNode = globalThis.Node;

afterEach(() => {
  Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
  Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  Object.defineProperty(globalThis, "Node", { configurable: true, value: originalNode });
});

it("clamps the open popup on resize and scroll, closes outside or on Escape, and cleans up listeners", () => {
  const listeners = new Map<string, EventListener>();
  const documentListeners = new Map<string, EventListener>();
  const removeWindow = jest.fn();
  const removeDocument = jest.fn();
  const setOpen = jest.fn();
  const focus = jest.fn();
  const popover = { style: { left: "", right: "" }, getBoundingClientRect: () => ({ width: 250 }) };
  let left = 20;
  const anchor = {
    querySelector: (selector: string) => selector.includes("popover") ? popover : { focus },
    getBoundingClientRect: () => ({ left, right: left + 30 }),
    contains: (node: unknown) => node === anchor,
  };
  Object.defineProperty(globalThis, "Node", { configurable: true, value: Object });
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    innerWidth: 390, addEventListener: (type: string, handler: EventListener) => listeners.set(type, handler), removeEventListener: removeWindow,
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    addEventListener: (type: string, handler: EventListener) => documentListeners.set(type, handler), removeEventListener: removeDocument,
  } });
  jest.mocked(useState).mockReturnValue([true, setOpen]);
  jest.mocked(useRef).mockReturnValue({ current: anchor });
  useCompactSearchPopover();
  const cleanup = jest.mocked(useLayoutEffect).mock.calls[0][0]()!;
  expect(popover.style).toEqual({ left: "-12px", right: "auto" });
  left = 400;
  listeners.get("resize")!({} as Event);
  expect(popover.style.left).toBe("-268px");
  left = 10;
  listeners.get("scroll")!({} as Event);
  expect(popover.style.left).toBe("-2px");
  documentListeners.get("mousedown")!({ target: anchor } as unknown as Event);
  expect(setOpen).not.toHaveBeenCalled();
  documentListeners.get("mousedown")!({ target: {} } as unknown as Event);
  expect(setOpen).toHaveBeenCalledWith(false);
  documentListeners.get("keydown")!({ key: "Escape" } as unknown as Event);
  expect(focus).toHaveBeenCalledTimes(1);
  cleanup();
  expect(removeWindow).toHaveBeenCalledWith("resize", listeners.get("resize"));
  expect(removeWindow).toHaveBeenCalledWith("scroll", listeners.get("scroll"), true);
  expect(removeDocument).toHaveBeenCalledWith("mousedown", documentListeners.get("mousedown"));
  expect(removeDocument).toHaveBeenCalledWith("keydown", documentListeners.get("keydown"));
});

it("does not attach listeners while closed", () => {
  jest.mocked(useState).mockReturnValue([false, jest.fn()]);
  useCompactSearchPopover();
  expect(jest.mocked(useLayoutEffect).mock.calls[0][0]()).toBeUndefined();
});

it("closes an open icon popup on desktop and clamps a fresh popup after returning to phone", () => {
  let open = false;
  let width = 390;
  const setOpen = jest.fn((value: unknown) => {
    open = Boolean(typeof value === "function" ? value(open) : value);
  });
  const popover = { style: { left: "", right: "" }, getBoundingClientRect: () => ({ width: 250 }) };
  const anchor = {
    querySelector: () => popover,
    getBoundingClientRect: () => ({ left: 20, right: 50 }),
  };
  const compactRef: { current: typeof anchor | null } = { current: anchor };
  const addListener = jest.fn();
  const removeListener = jest.fn();
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    get innerWidth() { return width; }, addEventListener: addListener, removeEventListener: removeListener,
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { addEventListener: jest.fn(), removeEventListener: jest.fn() } });
  jest.mocked(useState).mockImplementation(() => [open, setOpen]);
  jest.mocked(useRef).mockReturnValue(compactRef);
  const lifecycle: { cleanup?: () => void } = {};
  const Harness = (available: boolean) => {
    lifecycle.cleanup?.();
    const result = useCompactSearchPopover(available);
    lifecycle.cleanup = jest.mocked(useLayoutEffect).mock.lastCall![0]() || undefined;
    return result;
  };
  const phone = Harness(true);
  expect(phone.isCompactOpen).toBe(false);
  phone.setIsCompactOpen(true);
  expect(Harness(true).isCompactOpen).toBe(true);
  expect(popover.style.left).toBe("-12px");
  width = 1440;
  compactRef.current = null;
  expect(Harness(false).isCompactOpen).toBe(false);
  expect(open).toBe(false);
  expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
  width = 320;
  compactRef.current = anchor;
  const restoredPhone = Harness(true);
  expect(restoredPhone.isCompactOpen).toBe(false);
  popover.style.left = "";
  restoredPhone.setIsCompactOpen(true);
  expect(Harness(true).isCompactOpen).toBe(true);
  expect(popover.style.left).toBe("-12px");
  lifecycle.cleanup?.();
});
