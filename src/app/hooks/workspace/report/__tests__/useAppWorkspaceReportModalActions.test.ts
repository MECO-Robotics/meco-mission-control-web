import { useCallback, useEffect, useRef } from "react";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceReportModalActions } from "../useAppWorkspaceReportModalActions";

jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: jest.fn((callback) => callback), useEffect: jest.fn(), useRef: jest.fn() }));

function setup() {
  jest.mocked(useRef).mockReturnValue({ current: null });
  jest.mocked(useCallback).mockImplementation((callback) => callback);
  jest.mocked(useEffect).mockImplementation((effect) => { effect(); });
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], id: "selected-task", projectId: "selected-project", workstreamId: "selected-workflow", targetRiskId: "selected-risk" };
  const milestone = { ...bootstrap.milestones[0], id: "selected-milestone", projectIds: ["selected-project"] };
  bootstrap.tasks.push(task);
  bootstrap.milestones.push(milestone);
  const state = {
    scopedBootstrap: bootstrap, activePersonFilter: [], activeTimelineTaskDetailId: task.id,
    taskModalMode: "edit" as string | null,
    workLogModalMode: null as string | null, qaReportModalMode: null as string | null, milestoneReportModalMode: null as string | null,
    setActiveTimelineTaskDetailId: jest.fn((id: string | null) => { state.activeTimelineTaskDetailId = id ?? ""; }),
    setTaskModalMode: jest.fn((mode: string | null) => { state.taskModalMode = mode; }),
    setWorkLogModalMode: jest.fn((mode: string | null) => { state.workLogModalMode = mode; }),
    setQaReportModalMode: jest.fn((mode: string | null) => { state.qaReportModalMode = mode; }),
    setMilestoneReportModalMode: jest.fn((mode: string | null) => { state.milestoneReportModalMode = mode; }),
    setWorkLogDraft: jest.fn(), setQaReportDraft: jest.fn(), setMilestoneReportDraft: jest.fn(), setMilestoneReportFindings: jest.fn(),
  };
  const Render = () => useAppWorkspaceReportModalActions(state as unknown as AppWorkspaceModel);
  return { state, render: Render, task, milestone };
}

it("opens work logging for the chosen task, removes its overlay, and restores details on dismissal", () => {
  const { state, render, task } = setup();
  render().openCreateWorkLogModal(task.id);
  expect(state.setWorkLogDraft).toHaveBeenCalledWith(expect.objectContaining({ taskId: task.id }));
  expect(state.taskModalMode).toBeNull();
  expect(state.activeTimelineTaskDetailId).toBe("");
  const actions = render();
  expect(state.activeTimelineTaskDetailId).toBe("");
  actions.closeWorkLogModal();
  render();
  expect(state.activeTimelineTaskDetailId).toBe(task.id);
});

it("seeds QA with the chosen task's project, workflow and risk and returns after successful submission", () => {
  const { state, render, task } = setup();
  render().openCreateQaReportModal(task.id);
  expect(state.setQaReportDraft).toHaveBeenCalledWith(expect.objectContaining({ taskId: task.id, projectId: task.projectId, workstreamId: task.workstreamId, targetRiskId: task.targetRiskId, milestoneId: null }));
  render();
  state.setQaReportModalMode(null);
  render();
  expect(state.activeTimelineTaskDetailId).toBe(task.id);
});

it("seeds milestone reporting independently of task selection and restores its owning schedule", () => {
  const { state, render, milestone } = setup();
  const restore = jest.fn();
  render().openCreateMilestoneReportModal(milestone.id, restore);
  expect(state.setMilestoneReportDraft).toHaveBeenCalledWith(expect.objectContaining({ milestoneId: milestone.id, projectId: "selected-project", taskId: null, workstreamId: null }));
  render();
  expect(restore).not.toHaveBeenCalled();
  state.setMilestoneReportModalMode(null);
  render();
  render();
  expect(restore).toHaveBeenCalledTimes(1);
});
