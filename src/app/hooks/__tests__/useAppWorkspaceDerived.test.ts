import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { reconcileWorkspaceState } from "../workspace/loader/useAppWorkspaceLoaderWorkspaceReconciliation";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { useAppWorkspaceDerived } from "../useAppWorkspaceDerived";
import type { AppWorkspaceState } from "../useAppWorkspaceState";

function renderDerived(state: AppWorkspaceState) {
  let result: ReturnType<typeof useAppWorkspaceDerived>;
  function Probe() {
    result = useAppWorkspaceDerived(state);
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return result!;
}

function createState() {
  const state = {
    bootstrap: {
      ...EMPTY_BOOTSTRAP,
      members: [{ id: "ada", name: "Ada", email: "ada@example.test", role: "student", elevated: false, seasonId: "season-1" }],
    },
    selectedSeasonId: null,
    selectedProjectId: null,
    activeTab: "home",
    activePersonFilter: ["another-member"],
    isUnmatchedMyViewActive: false,
    dataMessage: "Previous error",
    sessionUser: { accountId: "account-1", email: "ADA@example.test", name: "Ada" },
    enqueueTaskEditNotice: jest.fn(),
  } as unknown as AppWorkspaceState;
  state.setActivePersonFilter = (next) => {
    state.activePersonFilter = typeof next === "function" ? next(state.activePersonFilter) : next;
  };
  state.setIsUnmatchedMyViewActive = (next) => {
    state.isUnmatchedMyViewActive = typeof next === "function" ? next(state.isUnmatchedMyViewActive) : next;
  };
  state.setDataMessage = (next) => {
    state.dataMessage = typeof next === "function" ? next(state.dataMessage) : next;
  };
  return state;
}

it("toggles the roster-linked session member and clears stale messages", () => {
  const state = createState();
  const view = renderDerived(state);
  expect(view.isMyViewActive).toBe(false);
  view.toggleMyView();
  expect(state.activePersonFilter).toEqual(["ada"]);
  expect(state.dataMessage).toBeNull();
  expect(renderDerived(state).isMyViewActive).toBe(true);
  renderDerived(state).toggleMyView();
  expect(state.activePersonFilter).toEqual([]);
  expect(renderDerived(state).isMyViewActive).toBe(false);
  expect(state.enqueueTaskEditNotice).not.toHaveBeenCalled();
});

it("treats synthetic local sessions as unlinked and only notifies when enabling My View", () => {
  const state = createState();
  state.sessionUser = { ...state.sessionUser!, accountId: "local-dev-mentor", email: "mentor@example.test", role: "mentor" };
  renderDerived(state).toggleMyView();
  expect(state.activePersonFilter).toEqual([]);
  expect(state.dataMessage).toBe("Previous error");
  expect(renderDerived(state).isMyViewActive).toBe(true);
  expect(state.enqueueTaskEditNotice).toHaveBeenCalledWith(expect.objectContaining({ title: "My View Notice" }));
  renderDerived(state).toggleMyView();
  expect(renderDerived(state).isMyViewActive).toBe(false);
  expect(state.enqueueTaskEditNotice).toHaveBeenCalledTimes(1);
  state.sessionUser = { ...state.sessionUser, email: "ada@example.test" };
  renderDerived(state).toggleMyView();
  expect(state.activePersonFilter).toEqual(["ada"]);
  expect(state.isUnmatchedMyViewActive).toBe(false);
  expect(state.dataMessage).toBeNull();
});

it("reconciles refreshed roster selections", () => {
  const state = createState();
  state.bootstrap.members.unshift({ ...state.bootstrap.members[0], id: "another", email: "another@example.test" });
  state.activePersonFilter = ["removed", "ada"];
  state.selectedMemberId = "removed";
  const selectMember = jest.fn();
  reconcileWorkspaceState(state, state.bootstrap, selectMember);
  expect(state.activePersonFilter).toEqual(["ada"]);
  expect(selectMember).toHaveBeenCalledWith("another", state.bootstrap);
});
