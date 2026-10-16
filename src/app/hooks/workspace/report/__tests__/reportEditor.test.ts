import { useCallback, useEffect, useRef, useState } from "react";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { createWorkLogRecord, createQaReportRecord, createQaRequestRecord, createTestResultRecord } from "@/lib/auth/records/reporting";
import { reconcileWorkspaceState } from "../../loader/useAppWorkspaceLoaderWorkspaceReconciliation";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { beginSessionChange } from "@/lib/auth/core/sessionStorage";
import { useAppWorkspaceReportEditor } from "../useAppWorkspaceReportEditor";

jest.mock("react", () => ({ ...jest.requireActual("react"), useCallback: jest.fn((callback) => callback), useEffect: jest.fn(), useRef: jest.fn(), useState: jest.fn() }));

jest.mock("@/lib/auth/records/reporting", () => ({ createWorkLogRecord: jest.fn(), createQaReportRecord: jest.fn(), createQaRequestRecord: jest.fn(), createTestResultRecord: jest.fn() }));

function setup() {
  const slots: unknown[] = [];
  let cursor = 0;
  const effects: (() => void)[] = [];
  jest.mocked(useRef).mockImplementation((initial) => (slots[cursor++] ??= { current: initial }) as ReturnType<typeof useRef>);
  jest.mocked(useState).mockImplementation((initial?: unknown) => {
    const index = cursor++;
    const slot = (slots[index] ??= { value: initial, set: (next: unknown) => { slot.value = typeof next === "function" ? next(slot.value) : next; } }) as { value: unknown; set: (next: unknown) => void };
    return [slot.value, slot.set];
  });
  jest.mocked(useCallback).mockImplementation((callback, dependencies) => {
    const index = cursor++;
    const previous = slots[index] as { callback: typeof callback; dependencies: typeof dependencies } | undefined;
    if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) slots[index] = { callback, dependencies };
    return (slots[index] as { callback: typeof callback }).callback;
  });
  jest.mocked(useEffect).mockImplementation((effect, dependencies) => {
    const index = cursor++;
    const previous = slots[index] as { dependencies: typeof dependencies; cleanup?: () => void } | undefined;
    if (!previous || dependencies?.some((value, i) => !Object.is(value, previous.dependencies?.[i]))) {
      effects.push(() => {
        previous?.cleanup?.();
        slots[index] = { dependencies, cleanup: effect() };
      });
    }
  });
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], id: "selected-task", projectId: "selected-project", workstreamIds: ["selected-workflow"], targetRiskId: "selected-risk" };
  const milestone = { ...bootstrap.milestones[0], id: "selected-milestone", projectIds: ["selected-project"] };
  bootstrap.tasks.push(task);
  bootstrap.milestones.push(milestone);
  const state = {
    bootstrap, scopedBootstrap: bootstrap, activePersonFilter: [], selectedProjectId: null as string | null, selectedSeasonId: null as string | null,
    sessionUser: { accountId: "account-lead", email: bootstrap.members[0].email, name: bootstrap.members[0].name } as AppWorkspaceModel["sessionUser"], signedInMember: bootstrap.members[0] as AppWorkspaceModel["signedInMember"], isPublicDemoSession: false,
    loadWorkspace: jest.fn(async () => true), handleUnauthorized: jest.fn(), setDataMessage: jest.fn(),
    workLogDraft: {} as AppWorkspaceModel["workLogDraft"], qaReportDraft: {} as AppWorkspaceModel["qaReportDraft"], milestoneReportDraft: {} as AppWorkspaceModel["milestoneReportDraft"], milestoneReportFindings: "", activeTimelineTaskDetailId: task.id,
    taskModalMode: "edit" as string | null,
    workLogModalMode: null as string | null, qaReportModalMode: null as string | null, milestoneReportModalMode: null as string | null,
    taskEditor: { leaveTaskDetails: jest.fn((taskId?: string) => {
      state.activeTimelineTaskDetailId = "";
      state.taskModalMode = null;
      return () => { state.activeTimelineTaskDetailId = taskId ?? ""; };
    }) },
    setWorkLogModalMode: jest.fn((mode: string | null) => { state.workLogModalMode = mode; }),
    setQaReportModalMode: jest.fn((mode: string | null) => { state.qaReportModalMode = mode; }),
    setMilestoneReportModalMode: jest.fn((mode: string | null) => { state.milestoneReportModalMode = mode; }),
    setWorkLogDraft: jest.fn((draft: AppWorkspaceModel["workLogDraft"]) => { state.workLogDraft = draft; }),
    setQaReportDraft: jest.fn((draft: AppWorkspaceModel["qaReportDraft"]) => { state.qaReportDraft = draft; }),
    setMilestoneReportDraft: jest.fn((draft: AppWorkspaceModel["milestoneReportDraft"]) => { state.milestoneReportDraft = draft; }),
    setMilestoneReportFindings: jest.fn((findings: string) => { state.milestoneReportFindings = findings; }),
  };
  const Render = () => {
    cursor = 0;
    const result = useAppWorkspaceReportEditor(state as unknown as AppWorkspaceModel);
    effects.splice(0).forEach((effect) => effect());
    return result;
  };
  const unmount = () => slots.forEach((slot) => (slot as { cleanup?: () => void } | undefined)?.cleanup?.());
  return { state, render: Render, task, milestone, unmount };
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

it("hands an eligible assigned student to the assigned mentor through one QA request", async () => {
  const { state, render, task } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.id === "student-1")!;
  task.status = "in-progress";
  task.assigneeIds = ["student-1"];
  task.mentorId = "mentor-1";
  jest.mocked(createQaRequestRecord).mockResolvedValueOnce({} as never);
  const request = render().requestTaskQa;
  await Promise.all([request(task.id), request(task.id)]);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(1);
  expect(createQaRequestRecord).toHaveBeenCalledWith({ projectId: task.projectId, targetRefs: [{ kind: "task", id: task.id }], subject: `${task.title} — QA request`, mentorId: "mentor-1" }, state.handleUnauthorized);
  expect(state.loadWorkspace).toHaveBeenCalledTimes(1);
});

it("keeps the same account-task request locked while project and season context changes", async () => {
  const { state, render, task } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.id === "student-1")!;
  task.status = "in-progress";
  task.assigneeIds = ["student-1"];
  task.mentorId = "mentor-1";
  let resolve!: () => void;
  jest.mocked(createQaRequestRecord).mockImplementationOnce(() => new Promise((yes) => { resolve = () => yes({} as never); }));
  const pending = render().requestTaskQa(task.id);

  state.selectedProjectId = "another-project";
  state.selectedSeasonId = "another-season";
  render();
  state.selectedProjectId = null;
  state.selectedSeasonId = null;
  render();
  await render().requestTaskQa(task.id);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(1);

  resolve();
  await pending;
  expect(state.loadWorkspace).not.toHaveBeenCalled();
  await render().requestTaskQa(task.id);
  expect(render().requestedQaTaskIds).toContain(task.id);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(1);

  const canonicalRequest = {
    id: "qa-request-1", projectId: task.projectId, targetRefs: [{ kind: "task" as const, id: task.id }],
    subject: "QA request", mentorId: "mentor-1", requestedById: "student-1", createdAt: "2026-10-16T12:00:00Z", status: "requested" as const,
  };
  state.bootstrap.qaRequests = [canonicalRequest];
  render();
  expect(render().requestedQaTaskIds).not.toContain(task.id);
  await render().requestTaskQa(task.id);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(1);

  state.bootstrap.qaRequests = [{ ...canonicalRequest, status: "complete" }];
  render();
  await render().requestTaskQa(task.id);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(2);
});

it("does not acknowledge a late QA request success in a different account", async () => {
  const { state, render, task } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.id === "student-1")!;
  task.status = "in-progress";
  task.assigneeIds = ["student-1"];
  task.mentorId = "mentor-1";
  let resolveOld!: () => void;
  jest.mocked(createQaRequestRecord)
    .mockImplementationOnce(() => new Promise((yes) => { resolveOld = () => yes({} as never); }))
    .mockResolvedValueOnce({} as never);
  const oldRequest = render().requestTaskQa(task.id);
  state.sessionUser = { ...state.sessionUser!, accountId: "account-next" };
  render();
  resolveOld();
  await oldRequest;
  expect(render().requestedQaTaskIds).not.toContain(task.id);
  const currentRequest = render().requestTaskQa(task.id);
  await currentRequest;
  expect(createQaRequestRecord).toHaveBeenCalledTimes(2);
});

it("allows retry after a failed QA request", async () => {
  const { state, render, task } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.id === "student-1")!;
  task.status = "in-progress";
  task.assigneeIds = ["student-1"];
  task.mentorId = "mentor-1";
  jest.mocked(createQaRequestRecord).mockRejectedValueOnce(new Error("Temporary failure")).mockResolvedValueOnce({} as never);
  await render().requestTaskQa(task.id);
  await render().requestTaskQa(task.id);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(2);
  expect(state.loadWorkspace).toHaveBeenCalledTimes(1);
});

it.each([
  ["project", (state: ReturnType<typeof setup>["state"]) => { state.selectedProjectId = "another-project"; }],
  ["season", (state: ReturnType<typeof setup>["state"]) => { state.selectedSeasonId = "another-season"; }],
  ["account", (state: ReturnType<typeof setup>["state"]) => { state.sessionUser = { ...state.sessionUser!, accountId: "another-account" }; }],
  ["session", () => { beginSessionChange(); }],
])("ignores a delayed QA request failure after switching %s", async (_scope, switchContext) => {
  const { state, render, task } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.id === "student-1")!;
  task.status = "in-progress";
  task.assigneeIds = ["student-1"];
  task.mentorId = "mentor-1";
  let reject!: (error: Error) => void;
  jest.mocked(createQaRequestRecord).mockImplementationOnce(() => new Promise((_resolve, no) => { reject = no; }));
  const pending = render().requestTaskQa(task.id);
  switchContext(state);
  render();
  reject(new Error("retired request failed"));
  await pending;
  expect(state.setDataMessage).not.toHaveBeenCalledWith("retired request failed");
  expect(state.loadWorkspace).not.toHaveBeenCalled();
});

it("ignores a delayed QA request success after unmount without acknowledging or refreshing", async () => {
  const { state, render, task, unmount } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.id === "student-1")!;
  task.status = "in-progress";
  task.assigneeIds = ["student-1"];
  task.mentorId = "mentor-1";
  let resolve!: () => void;
  jest.mocked(createQaRequestRecord).mockImplementationOnce(() => new Promise((yes) => { resolve = () => yes({} as never); }));
  const pending = render().requestTaskQa(task.id);
  unmount();
  resolve();
  await pending;
  expect(render().requestedQaTaskIds).not.toContain(task.id);
  expect(state.loadWorkspace).not.toHaveBeenCalled();
});

it("keeps an acknowledged QA request in a waiting state when workspace refresh fails", async () => {
  const { state, render, task } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.id === "student-1")!;
  task.status = "in-progress";
  task.assigneeIds = ["student-1"];
  task.mentorId = "mentor-1";
  state.loadWorkspace.mockResolvedValueOnce(false);
  jest.mocked(createQaRequestRecord).mockResolvedValueOnce({} as never);
  await render().requestTaskQa(task.id);
  expect(render().requestedQaTaskIds).toContain(task.id);
  expect(state.setDataMessage).toHaveBeenCalledWith("QA was requested, but the task status could not be refreshed. Reload to see the latest status.");
  await render().requestTaskQa(task.id);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(1);
});

it.each(["complete", "cancelled"] as const)("releases the temporary QA acknowledgment after a canonical %s request", async (terminalStatus) => {
  const { state, render, task } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.id === "student-1")!;
  task.status = "in-progress";
  task.assigneeIds = ["student-1"];
  task.mentorId = "mentor-1";
  state.loadWorkspace.mockResolvedValueOnce(false);
  jest.mocked(createQaRequestRecord).mockResolvedValue({} as never);

  await render().requestTaskQa(task.id);
  expect(render().requestedQaTaskIds).toContain(task.id);

  const canonicalRequest = {
    id: "qa-request-1", projectId: task.projectId, targetRefs: [{ kind: "task" as const, id: task.id }],
    subject: "QA request", mentorId: "mentor-1", requestedById: "student-1", createdAt: "2026-10-16T12:00:00Z", status: "requested" as const,
  };
  state.bootstrap.qaRequests = [canonicalRequest];
  render();
  expect(render().requestedQaTaskIds).not.toContain(task.id);
  await render().requestTaskQa(task.id);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(1);

  state.bootstrap.qaRequests = [{ ...canonicalRequest, status: terminalStatus }];
  render();
  expect(render().requestedQaTaskIds).not.toContain(task.id);
  await render().requestTaskQa(task.id);
  expect(createQaRequestRecord).toHaveBeenCalledTimes(2);
});

it("seeds QA with the chosen task as a typed evidence target and returns after submission", () => {
  const { state, render, task } = setup();
  render().openCreateQaReportModal(task.id);
  expect(state.setQaReportDraft).toHaveBeenCalledWith(expect.objectContaining({ projectId: task.projectId, targetRefs: [{ kind: "task", id: task.id }] }));
  render();
  state.setQaReportModalMode(null);
  render();
  expect(state.activeTimelineTaskDetailId).toBe(task.id);
});

it("seeds milestone reporting independently of task selection and restores its owning schedule", () => {
  const { state, render, milestone } = setup();
  const restore = jest.fn();
  render().openCreateMilestoneReportModal(milestone.id, restore);
  expect(state.setMilestoneReportDraft).toHaveBeenCalledWith(expect.objectContaining({ projectId: "selected-project", targetRefs: [{ kind: "milestone", id: milestone.id }] }));
  render();
  expect(restore).not.toHaveBeenCalled();
  state.setMilestoneReportModalMode(null);
  render();
  render();
  expect(restore).toHaveBeenCalledTimes(1);
});

const reportCases = [
  { name: "work log", open: "openCreateWorkLogModal", close: "closeWorkLogModal", submit: "handleWorkLogSubmit", draft: "workLogDraft", busy: "isSavingWorkLog", write: createWorkLogRecord },
  { name: "QA report", open: "openCreateQaReportModal", close: "closeQaReportModal", submit: "handleQaReportSubmit", draft: "qaReportDraft", busy: "isSavingQaReport", write: createQaReportRecord },
  { name: "milestone report", open: "openCreateMilestoneReportModal", close: "closeMilestoneReportModal", submit: "handleMilestoneReportSubmit", draft: "milestoneReportDraft", busy: "isSavingMilestoneReport", write: createTestResultRecord },
] as const;

beforeEach(() => jest.clearAllMocks());

it.each(reportCases)("keeps a newer $name draft open after an older save succeeds or fails", async (item) => {
  for (const fail of [false, true]) {
    const { state, render, task, milestone } = setup();
    render()[item.open](item.name === "milestone report" ? milestone.id : task.id);
    state.workLogDraft.participantIds = [state.bootstrap.members[0].id];
    state.qaReportDraft.participantIds = [state.bootstrap.members[0].id];
    state.milestoneReportDraft.summary = "Test summary";
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    jest.mocked(item.write).mockImplementationOnce(() => new Promise<never>((yes, no) => { resolve = () => yes({} as never); reject = no; }));
    const actions = render();
    const event = { preventDefault: jest.fn() } as never;
    const pending = actions[item.submit](event);
    await actions[item.submit](event);
    expect(item.write).toHaveBeenCalledTimes(fail ? 2 : 1);
    expect(render()[item.busy]).toBe(true);
    render()[item.close]();
    render()[item.open](item.name === "milestone report" ? milestone.id : task.id);
    const draft = state[item.draft];
    if (fail) reject(new Error("old write failed")); else resolve();
    await pending;
    expect(state[item.draft]).toBe(draft);
    expect(render()[item.busy]).toBe(false);
    expect(state.setDataMessage).not.toHaveBeenCalledWith("old write failed");
    expect(state[item.name === "work log" ? "workLogModalMode" : item.name === "QA report" ? "qaReportModalMode" : "milestoneReportModalMode"]).toBe("create");
    expect(state.loadWorkspace).toHaveBeenCalledTimes(fail ? 0 : 1);
    if (!fail) {
      const [, canApply, canNotify] = (state.loadWorkspace.mock.calls as unknown as [unknown, () => boolean, () => boolean][])[0];
      expect(canApply()).toBe(true);
      expect(canNotify()).toBe(false);
    }
  }
});

it("preserves report notes and findings when bootstrap reconciliation runs", () => {
  const { state, render, milestone } = setup();
  render().openCreateMilestoneReportModal(milestone.id);
  state.milestoneReportDraft.summary = "Unsaved findings";
  state.milestoneReportFindings = "Keep this evidence";
  const draft = state.milestoneReportDraft;
  reconcileWorkspaceState({ ...state, setActivePersonFilter: jest.fn(), setIsUnmatchedMyViewActive: jest.fn() } as unknown as AppWorkspaceState, state.bootstrap, jest.fn());
  expect(state.milestoneReportDraft).toBe(draft);
  expect(state.milestoneReportFindings).toBe("Keep this evidence");
});

it("retires report editors and pending errors when project scope changes", async () => {
  const { state, render, task } = setup();
  render().openCreateWorkLogModal(task.id);
  state.workLogDraft.participantIds = [state.bootstrap.members[0].id];
  let reject!: (error: Error) => void;
  jest.mocked(createWorkLogRecord).mockImplementationOnce(() => new Promise((_yes, no) => { reject = no; }));
  const pending = render().handleWorkLogSubmit({ preventDefault: jest.fn() } as never);
  state.selectedProjectId = "another-project";
  render();
  reject(new Error("old scope failed"));
  await pending;
  expect(state.workLogModalMode).toBeNull();
  expect(state.setDataMessage).not.toHaveBeenCalledWith("old scope failed");
  expect(render().isSavingWorkLog).toBe(false);
});

it("closes an acknowledged report save even if refresh fails, preventing duplicate create retries", async () => {
  const { state, render, task } = setup();
  render().openCreateWorkLogModal(task.id);
  state.workLogDraft.participantIds = [state.bootstrap.members[0].id];
  jest.mocked(createWorkLogRecord).mockResolvedValueOnce({} as never);
  state.loadWorkspace.mockResolvedValueOnce(false);
  await render().handleWorkLogSubmit({ preventDefault: jest.fn() } as never);
  expect(createWorkLogRecord).toHaveBeenCalledTimes(1);
  expect(state.workLogModalMode).toBeNull();
  expect(render().isSavingWorkLog).toBe(false);
});

it("keeps the newer report save busy when an older save finishes", async () => {
  const { state, render, task } = setup();
  render().openCreateWorkLogModal(task.id);
  state.workLogDraft.participantIds = [state.bootstrap.members[0].id];
  let finishOld!: () => void;
  let finishNew!: () => void;
  jest.mocked(createWorkLogRecord)
    .mockImplementationOnce(() => new Promise((yes) => { finishOld = () => yes({} as never); }))
    .mockImplementationOnce(() => new Promise((yes) => { finishNew = () => yes({} as never); }));
  const event = { preventDefault: jest.fn() } as never;
  const old = render().handleWorkLogSubmit(event);
  render().closeWorkLogModal();
  render().openCreateWorkLogModal(task.id);
  state.workLogDraft.participantIds = [state.bootstrap.members[0].id];
  const latest = render().handleWorkLogSubmit(event);
  finishOld();
  await old;
  expect(render().isSavingWorkLog).toBe(true);
  expect(state.workLogModalMode).toBe("create");
  finishNew();
  await latest;
  expect(render().isSavingWorkLog).toBe(false);
  expect(state.workLogModalMode).toBeNull();
});

it("submits QA evidence with null review metadata for the strict contract", async () => {
  const { state, render, task } = setup();
  render().openCreateQaReportModal(task.id);
  jest.mocked(createQaReportRecord).mockResolvedValueOnce({} as never);
  await render().handleQaReportSubmit({ preventDefault: jest.fn() } as never);
  expect(createQaReportRecord).toHaveBeenCalledWith({
    reportType: "qa", projectId: task.projectId, targetRefs: [{ kind: "task", id: task.id }],
    createdByMemberId: state.bootstrap.members[0].id, requestedById: null, mentorId: null,
    result: "pass", summary: "", notes: "", participantIds: [state.bootstrap.members[0].id],
    createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    evidenceNotes: "", photoUrl: "", status: "submitted", reviewedById: null, reviewedAt: null,
  }, state.handleUnauthorized, state.bootstrap.members[0].id);
  expect(state.qaReportModalMode).toBeNull();
});

it("sends an explicit reviewed transition only for the linked signed-in mentor", async () => {
  const { state, render, task } = setup();
  const mentor = state.bootstrap.members.find((member) => member.role === "mentor")!;
  state.sessionUser = { ...state.sessionUser!, accountId: "mentor-account", email: mentor.email, name: mentor.name };
  state.signedInMember = mentor;
  render().openCreateQaReportModal(task.id);
  jest.mocked(createQaReportRecord).mockResolvedValueOnce({} as never);
  await render().handleQaReportSubmit({ preventDefault: jest.fn() } as never, "reviewed");
  const payload = jest.mocked(createQaReportRecord).mock.calls.at(-1)?.[0];
  expect(payload).toEqual(expect.objectContaining({ status: "reviewed" }));
  expect(payload).toEqual(expect.objectContaining({ reviewedById: null, reviewedAt: null }));
  expect(jest.mocked(createQaReportRecord).mock.calls.at(-1)?.[2]).toBe(mentor.id);
});

it("uses the current account's roster actor for review and drops it after sign-out", async () => {
  const { state, render, task } = setup();
  const mentorB = { ...state.bootstrap.members.find((member) => member.role === "mentor")!, id: "mentor-b", email: "mentor-b@example.com" };
  const admin = { ...mentorB, id: "admin-1", email: "admin@example.com", role: "admin" as const };
  state.bootstrap.members.push(mentorB, admin);
  task.status = "in-progress";
  state.sessionUser = { ...state.sessionUser!, accountId: "account-b", email: mentorB.email, name: mentorB.name };
  state.signedInMember = mentorB;
  state.selectedSeasonId = "another-season";
  state.selectedProjectId = "another-project";
  render().openCreateQaReportModal(task.id);
  jest.mocked(createQaReportRecord).mockResolvedValue({} as never);
  await render().handleQaReportSubmit({ preventDefault: jest.fn() } as never, "reviewed");
  expect(jest.mocked(createQaReportRecord).mock.calls.at(-1)?.[2]).toBe(mentorB.id);

  state.sessionUser = { ...state.sessionUser!, accountId: "account-admin", email: admin.email, name: admin.name };
  state.signedInMember = admin;
  render().openCreateQaReportModal(task.id);
  await render().handleQaReportSubmit({ preventDefault: jest.fn() } as never, "reviewed");
  expect(jest.mocked(createQaReportRecord).mock.calls.at(-1)?.[2]).toBe(admin.id);

  state.sessionUser = null;
  state.signedInMember = null;
  state.qaReportModalMode = "create";
  await render().handleQaReportSubmit({ preventDefault: jest.fn() } as never, "reviewed");
  expect(createQaReportRecord).toHaveBeenCalledTimes(2);
  expect(state.setDataMessage).toHaveBeenCalledWith("Only the signed-in mentor or admin can approve a QA report.");
});

it("keeps a QA draft as draft when that submit mode is selected", async () => {
  const { render, task } = setup();
  render().openCreateQaReportModal(task.id);
  jest.mocked(createQaReportRecord).mockResolvedValueOnce({} as never);
  await render().handleQaReportSubmit({ preventDefault: jest.fn() } as never, "draft");
  expect(jest.mocked(createQaReportRecord).mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({ status: "draft" }));
});

it("does not send reviewed status for an unlinked or unauthorized session", async () => {
  const { state, render, task } = setup();
  state.signedInMember = state.bootstrap.members.find((member) => member.role === "student")!;
  render().openCreateQaReportModal(task.id);
  expect(state.qaReportModalMode).toBeNull();
  state.qaReportModalMode = "create";
  await render().handleQaReportSubmit({ preventDefault: jest.fn() } as never, "reviewed");
  expect(createQaReportRecord).not.toHaveBeenCalled();
  expect(state.setDataMessage).toHaveBeenCalledWith("Only the signed-in mentor or admin can approve a QA report.");
});

it("submits an empty-summary milestone report without QA-only review fields", async () => {
  const { state, render, milestone } = setup();
  render().openCreateMilestoneReportModal(milestone.id);
  state.milestoneReportFindings = "Evidence only";
  jest.mocked(createTestResultRecord).mockResolvedValueOnce({} as never);
  await render().handleMilestoneReportSubmit({ preventDefault: jest.fn() } as never);
  expect(createTestResultRecord).toHaveBeenCalledWith({
    reportType: "practice", projectId: milestone.projectIds[0], targetRefs: [{ kind: "milestone", id: milestone.id }],
    createdByMemberId: state.bootstrap.members[0].id, requestedById: null, mentorId: null,
    result: null, summary: "", notes: "Evidence only", participantIds: [],
    createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    status: "draft", evidenceNotes: "", photoUrl: "",
  }, state.handleUnauthorized);
  expect(state.milestoneReportModalMode).toBeNull();
});
