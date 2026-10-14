import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRisksViewModel } from "../riskViewModel";
import { createBootstrap } from "./riskViewTestFixtures";

jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: jest.fn((callback) => callback), useEffect: jest.fn(), useMemo: jest.fn((factory) => factory()), useRef: jest.fn(), useState: jest.fn() }));

function setup() {
  const slots: unknown[] = [];
  let cursor = 0;
  const cleanups: (() => void)[] = [];
  jest.mocked(useCallback).mockImplementation((callback) => callback);
  jest.mocked(useMemo).mockImplementation((factory) => factory());
  jest.mocked(useRef).mockImplementation((initial) => (slots[cursor++] ??= { current: initial }) as ReturnType<typeof useRef>);
  jest.mocked(useState).mockImplementation((initial?: unknown) => {
    const index = cursor++;
    const slot = (slots[index] ??= { value: initial, set: (next: unknown) => { slot.value = typeof next === "function" ? next(slot.value) : next; } }) as { value: unknown; set: (next: unknown) => void };
    return [slot.value, slot.set];
  });
  jest.mocked(useEffect).mockImplementation((effect) => {
    const index = cursor++;
    if (slots[index]) return;
    slots[index] = true;
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  });
  const args = { activePersonFilter: [], bootstrap: createBootstrap(), onCreateRisk: jest.fn(async () => {}), onDeleteRisk: jest.fn(async () => {}), onUpdateRisk: jest.fn(async () => {}) };
  const Render = () => { cursor = 0; return useRisksViewModel(args); };
  return { args, render: Render, unmount: () => cleanups.forEach((cleanup) => cleanup()) };
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

it("guards repeated quick writes and same-risk editor opening while allowing independent risk work", async () => {
  const { args, render } = setup();
  const request = deferred();
  args.onUpdateRisk.mockReturnValueOnce(request.promise);
  const pending = render().handleQuickUpdateRisk("risk-1", { ownerMemberId: " member-1 " });
  expect(render().pendingRiskIds.has("risk-1")).toBe(true);
  render().openEditEditor(args.bootstrap.risks[0]);
  expect(render().editorMode).toBeNull();
  await render().handleQuickUpdateRisk("risk-1", { severity: "critical" });
  expect(args.onUpdateRisk).toHaveBeenCalledTimes(1);
  expect(args.onUpdateRisk).toHaveBeenCalledWith("risk-1", { ownerMemberId: "member-1" });
  render().openEditEditor(args.bootstrap.risks[1]);
  request.resolve();
  await pending;
  expect(render().pendingRiskIds.size).toBe(0);
  expect(render().activeRisk?.id).toBe("risk-2");
  expect(render().editorMode).toBe("edit");
  await render().handleQuickUpdateRisk("risk-2", { status: "resolved" });
  expect(args.onUpdateRisk).toHaveBeenCalledTimes(1);
});

it("keeps failed quick writes visible on their record, clears errors on retry and retires on unmount", async () => {
  const { args, render, unmount } = setup();
  args.onUpdateRisk.mockRejectedValueOnce(new Error("Cannot assign"));
  await render().handleQuickUpdateRisk("risk-1", { ownerMemberId: null });
  expect(render().riskErrors["risk-1"]).toBe("Cannot assign");
  const request = deferred();
  args.onUpdateRisk.mockReturnValueOnce(request.promise);
  const pending = render().handleQuickUpdateRisk("risk-1", { ownerMemberId: null });
  expect(render().riskErrors["risk-1"]).toBeUndefined();
  unmount();
  request.reject(new Error("Retired request"));
  await pending;
  expect(render().riskErrors["risk-1"]).toBeUndefined();
});

it.each(["save", "delete"] as const)("retains the risk write lock after closing an editor during %s", async (operation) => {
  const { args, render } = setup();
  const request = deferred();
  if (operation === "save") args.onUpdateRisk.mockReturnValueOnce(request.promise);
  else args.onDeleteRisk.mockReturnValueOnce(request.promise);
  render().openEditEditor(args.bootstrap.risks[0]);
  const pending = operation === "save" ? render().handleSaveRisk() : render().handleDeleteRisk();
  render().closeEditor();
  expect(render().pendingRiskIds.has("risk-1")).toBe(true);
  await render().handleQuickUpdateRisk("risk-1", { severity: "critical" });
  render().openEditEditor(args.bootstrap.risks[0]);
  expect(render().editorMode).toBeNull();
  render().openRiskDetails(args.bootstrap.risks[0]);
  expect(render().editorMode).toBeNull();
  expect(args.onUpdateRisk).toHaveBeenCalledTimes(operation === "save" ? 1 : 0);
  render().openEditEditor(args.bootstrap.risks[1]);
  request.resolve();
  await pending;
  expect(render().activeRisk?.id).toBe("risk-2");
  expect(render().pendingRiskIds.has("risk-1")).toBe(false);
  render().closeEditor();
  await render().handleQuickUpdateRisk("risk-1", { severity: "critical" });
  expect(args.onUpdateRisk).toHaveBeenLastCalledWith("risk-1", { severity: "critical" });
});

it.each(["resolve", "reject"] as const)("retains a newer risk editor when a previous save ends with %s", async (outcome) => {
  const { args, render } = setup();
  const request = deferred();
  args.onUpdateRisk.mockReturnValueOnce(request.promise);
  render().openEditEditor(args.bootstrap.risks[0]);
  const pending = render().handleSaveRisk();
  render().closeEditor();
  render().openEditEditor(args.bootstrap.risks[1]);
  const newerRequest = deferred();
  args.onUpdateRisk.mockReturnValueOnce(newerRequest.promise);
  const newerPending = render().handleSaveRisk();
  if (outcome === "resolve") request.resolve();
  else request.reject(new Error("Previous failure"));
  await pending;
  expect(render().activeRisk?.id).toBe("risk-2");
  expect(render().editorMode).toBe("edit");
  expect(render().editorError).toBeNull();
  expect(render().isSaving).toBe(true);
  newerRequest.resolve();
  await newerPending;
  expect(render().editorMode).toBeNull();
});
