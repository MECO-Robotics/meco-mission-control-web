import { useEffect } from "react";
import { useWorkspaceSearchHighlight } from "../useWorkspaceSearchHighlight";

jest.mock("react", () => ({ ...jest.requireActual("react"), useEffect: jest.fn() }));
const originals = new Map(["CSS", "Highlight", "window"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
afterEach(() => {
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

it("cancels pending paints and removes only the registry instance owned by this search", () => {
  const registry = new Map<string, Set<Range>>();
  const cancel = jest.fn();
  const schedule = jest.fn().mockReturnValue(7);
  Object.defineProperty(globalThis, "CSS", { configurable: true, value: { highlights: registry } });
  Object.defineProperty(globalThis, "Highlight", { configurable: true, value: Set });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { requestAnimationFrame: schedule, cancelAnimationFrame: cancel } });
  const ref = { current: null };
  useWorkspaceSearchHighlight("robot", ref);
  const firstCleanup = jest.mocked(useEffect).mock.lastCall![0]();
  expect(registry.has("workspace-search")).toBe(true);
  expect(schedule).toHaveBeenCalledTimes(1);
  const newerHighlight = new Set<Range>();
  registry.set("workspace-search", newerHighlight);
  if (typeof firstCleanup === "function") firstCleanup();
  expect(registry.get("workspace-search")).toBe(newerHighlight);
  expect(cancel).toHaveBeenCalledWith(7);

  useWorkspaceSearchHighlight("parts", ref);
  const secondCleanup = jest.mocked(useEffect).mock.lastCall![0]();
  expect(registry.get("workspace-search")).not.toBe(newerHighlight);
  if (typeof secondCleanup === "function") secondCleanup();
  expect(registry.has("workspace-search")).toBe(false);
});

it("does nothing for a blank query or when native highlighting is unavailable", () => {
  Object.defineProperty(globalThis, "CSS", { configurable: true, value: undefined });
  useWorkspaceSearchHighlight("robot", { current: null });
  expect(jest.mocked(useEffect).mock.lastCall![0]()).toBeUndefined();
  Object.defineProperty(globalThis, "CSS", { configurable: true, value: { highlights: new Map() } });
  Object.defineProperty(globalThis, "Highlight", { configurable: true, value: Set });
  useWorkspaceSearchHighlight("  ", { current: null });
  expect(jest.mocked(useEffect).mock.lastCall![0]()).toBeUndefined();
});
