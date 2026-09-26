import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useAppWorkspaceLoaderWorkspace } from "../useAppWorkspaceLoaderWorkspace";
import { fetchBootstrap } from "@/lib/auth/bootstrap";
import { reconcileWorkspaceState } from "../useAppWorkspaceLoaderWorkspaceReconciliation";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";

jest.mock("@/lib/auth/bootstrap", () => ({ fetchBootstrap: jest.fn() }));
jest.mock("../useAppWorkspaceLoaderWorkspaceReconciliation", () => ({ reconcileWorkspaceState: jest.fn() }));

function setup() {
  const state = {
    activePersonFilter: [], selectedSeasonId: null, selectedProjectId: null,
    setIsLoadingData: jest.fn(), setDataMessage: jest.fn(), setBootstrap: jest.fn(),
  };
  let load!: ReturnType<typeof useAppWorkspaceLoaderWorkspace>;
  function Probe() {
    load = useAppWorkspaceLoaderWorkspace(state as unknown as AppWorkspaceState, jest.fn(), jest.fn());
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return { state, load };
}

it.each(["success", "failure"])("does not publish obsolete refresh %s or clear a newer request's busy state", async (outcome) => {
  const { state, load } = setup();
  let resolve!: (value: ReturnType<typeof createBootstrap>) => void;
  let reject!: (error: Error) => void;
  let finishLatest!: (value: ReturnType<typeof createBootstrap>) => void;
  jest.mocked(fetchBootstrap)
    .mockImplementationOnce(() => new Promise((yes, no) => { resolve = yes; reject = no; }))
    .mockImplementationOnce(() => new Promise((yes) => { finishLatest = yes; }));
  const first = load();
  const latest = load();
  if (outcome === "success") resolve(createBootstrap()); else reject(new Error("old error"));
  await first;
  expect(state.setBootstrap).not.toHaveBeenCalled();
  expect(reconcileWorkspaceState).not.toHaveBeenCalled();
  expect(state.setDataMessage.mock.calls).toEqual([[null], [null]]);
  expect(state.setIsLoadingData.mock.calls).toEqual([[true], [true]]);
  const payload = createBootstrap();
  finishLatest(payload);
  await latest;
  expect(state.setBootstrap).toHaveBeenCalledWith(payload);
  expect(reconcileWorkspaceState).toHaveBeenCalledTimes(1);
  expect(state.setIsLoadingData).toHaveBeenLastCalledWith(false);
});

it("rejects an editor refresh after its workspace becomes inapplicable", async () => {
  const { state, load } = setup();
  let finish!: (value: ReturnType<typeof createBootstrap>) => void;
  jest.mocked(fetchBootstrap).mockImplementationOnce(() => new Promise((yes) => { finish = yes; }));
  let applicable = true;
  const request = load(undefined, () => applicable);
  applicable = false;
  finish(createBootstrap());
  await request;
  expect(state.setBootstrap).not.toHaveBeenCalled();
  expect(reconcileWorkspaceState).not.toHaveBeenCalled();
  expect(state.setDataMessage.mock.calls).toEqual([[null]]);
  expect(state.setIsLoadingData.mock.calls).toEqual([[true]]);
});
