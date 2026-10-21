import { useEffect, useRef, useState } from "react";
import type { MilestoneRecord } from "@/types/recordsExecution";
import { useMilestoneEditor } from "../useMilestoneEditor";

jest.mock("react", () => ({ ...jest.requireActual("react"), useRef: jest.fn(), useState: jest.fn(), useEffect: jest.fn(), useCallback: (callback: unknown) => callback }));

function setup() {
  const state: unknown[] = [];
  let cursor = 0;
  let unmount: (() => void) | undefined;
  jest.mocked(useRef).mockImplementation((initial) => (state[cursor++] ??= { current: initial }) as ReturnType<typeof useRef>);
  jest.mocked(useEffect).mockImplementation((effect) => { if (!unmount) unmount = effect() || undefined; });
  jest.mocked(useState).mockImplementation((initial?: unknown) => {
    const index = cursor++;
    if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
    return [state[index], (next: unknown) => {
      state[index] = typeof next === "function" ? next(state[index]) : next;
    }];
  });
  const args = {
    scopedProjectIds: ["scope"], createProjectIds: ["filter"],
    onTaskEditCanceled: jest.fn(), onTaskEditSaved: jest.fn(),
    onSaveTimelineMilestone: jest.fn(async () => {}),
    onDeleteTimelineMilestone: jest.fn(async () => {}),
  };
  return {
    args,
    unmount: () => unmount?.(),
    useEditor: () => { cursor = 0; return useMilestoneEditor(args); },
  };
}

const record = {
  id: "milestone-1",
  seasonId: "season-1",
  title: "Competition",
  type: "competition",
  status: "planned",
  description: "Travel", projectIds: ["project"],
  startAt: "2026-10-01T09:00:00", endAt: "2026-10-02T17:00:00",
} as MilestoneRecord;
const submit = { preventDefault: jest.fn() } as never;

test("editing keeps record dates and projects; cancel and create reset drafts with the view's defaults", () => {
  const { args, useEditor } = setup();
  useEditor().openEditMilestoneModal(record);
  expect(useEditor()).toMatchObject({
    milestoneModalMode: "edit", activeMilestoneId: "milestone-1", milestoneStartDate: "2026-10-01",
    milestoneStartTime: "09:00", milestoneEndDate: "2026-10-02", milestoneEndTime: "17:00",
    milestoneDraft: { title: "Competition", projectIds: ["project"] },
  });
  useEditor().cancelMilestoneEdit();
  expect(args.onTaskEditCanceled).toHaveBeenCalledTimes(1);
  useEditor().openCreateMilestoneModalForDay("2026-11-03");
  expect(useEditor()).toMatchObject({
    milestoneModalMode: "create", activeMilestoneId: null, milestoneStartDate: "2026-11-03",
    milestoneStartTime: "18:00", milestoneEndDate: "", milestoneEndTime: "",
    milestoneDraft: { title: "", projectIds: ["filter"] },
  });
  useEditor().openEditMilestoneModal({ ...record, projectIds: [] });
  expect(useEditor().milestoneDraft.projectIds).toEqual(["scope"]);
});

test("time pairs and date order block saves; failed edits remain open and a retry saves normalized fields", async () => {
  const { args, useEditor } = setup();
  useEditor().openEditMilestoneModal(record);
  useEditor().setMilestoneEndTime("");
  await useEditor().handleMilestoneSubmit(submit);
  expect(useEditor().milestoneError).toMatch(/must both be set/);
  useEditor().setMilestoneEndTime("08:00");
  useEditor().setMilestoneEndDate("2026-10-01");
  await useEditor().handleMilestoneSubmit(submit);
  expect(useEditor().milestoneError).toMatch(/must be after/);
  expect(args.onSaveTimelineMilestone).not.toHaveBeenCalled();
  useEditor().setMilestoneEndTime("10:00");
  useEditor().setMilestoneDraft({ ...useEditor().milestoneDraft, title: " Revised ", description: " Notes ", projectIds: ["project", "project"] });
  args.onSaveTimelineMilestone.mockRejectedValueOnce(new Error("offline"));
  await useEditor().handleMilestoneSubmit(submit);
  expect(useEditor()).toMatchObject({ milestoneModalMode: "edit", milestoneError: "offline", isSavingMilestone: false });
  await useEditor().handleMilestoneSubmit(submit);
  expect(args.onSaveTimelineMilestone).toHaveBeenLastCalledWith("edit", "milestone-1", expect.objectContaining({ title: "Revised", description: "Notes", projectIds: ["project"] }));
  expect(args.onTaskEditSaved).toHaveBeenCalledTimes(1);
  expect(useEditor().milestoneModalMode).toBeNull();
});

test("untimed events use noon and optional end dates; detail mode cannot submit or delete", async () => {
  const { args, useEditor } = setup();
  useEditor().openCreateMilestoneModalForDay("2026-11-03");
  useEditor().setMilestoneStartTime("");
  useEditor().setMilestoneDraft({ ...useEditor().milestoneDraft, title: "Untimed" });
  await useEditor().handleMilestoneSubmit(submit);
  expect(args.onSaveTimelineMilestone).toHaveBeenLastCalledWith("create", null, expect.objectContaining({ startAt: "2026-11-03T12:00:00", endAt: null }));
  useEditor().openMilestoneDetailsModal(record);
  await useEditor().handleMilestoneSubmit(submit);
  await useEditor().handleMilestoneDelete();
  expect(args.onSaveTimelineMilestone).toHaveBeenCalledTimes(1);
  expect(args.onDeleteTimelineMilestone).not.toHaveBeenCalled();
  expect(args.onTaskEditSaved).not.toHaveBeenCalled();
});

test.each(["resolve", "reject"] as const)("a retired save cannot affect a reopened milestone after %s", async (outcome) => {
  const { args, useEditor } = setup();
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  args.onSaveTimelineMilestone.mockImplementationOnce(() => new Promise<void>((accept, fail) => { resolve = accept; reject = fail; }));
  useEditor().openEditMilestoneModal(record);
  const pending = useEditor().handleMilestoneSubmit(submit);
  await useEditor().handleMilestoneSubmit(submit);
  await useEditor().handleMilestoneDelete();
  expect(args.onSaveTimelineMilestone).toHaveBeenCalledTimes(1);
  expect(args.onDeleteTimelineMilestone).not.toHaveBeenCalled();
  useEditor().closeMilestoneModal();
  useEditor().openEditMilestoneModal({ ...record, id: "new-milestone" });
  useEditor().setMilestoneStartDate("");
  await useEditor().handleMilestoneSubmit(submit);
  if (outcome === "resolve") resolve(); else reject(new Error("old failure"));
  await pending;
  expect(useEditor()).toMatchObject({ activeMilestoneId: "new-milestone", milestoneModalMode: "edit", milestoneError: "Start date is required.", isSavingMilestone: false });
  expect(args.onTaskEditSaved).not.toHaveBeenCalled();
});

test("retired deletes and unmounted saves cannot close or notify a newer editor", async () => {
  const { args, useEditor, unmount } = setup();
  const windowBefore = globalThis.window;
  Object.defineProperty(globalThis, "window", { configurable: true, value: { confirm: () => true } });
  try {
    let finish!: () => void;
    args.onDeleteTimelineMilestone.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    useEditor().openEditMilestoneModal(record);
    const pendingDelete = useEditor().handleMilestoneDelete();
    await useEditor().handleMilestoneSubmit(submit);
    expect(args.onSaveTimelineMilestone).not.toHaveBeenCalled();
    useEditor().openCreateMilestoneModalForDay("2026-12-01");
    finish();
    await pendingDelete;
    expect(useEditor()).toMatchObject({ milestoneModalMode: "create", isDeletingMilestone: false, milestoneError: null });
    args.onSaveTimelineMilestone.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    useEditor().openEditMilestoneModal(record);
    const pendingSave = useEditor().handleMilestoneSubmit(submit);
    unmount();
    finish();
    await pendingSave;
    expect(args.onTaskEditSaved).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(globalThis, "window", { configurable: true, value: windowBefore });
  }
});

test("return from a milestone report restores details only while that editor session is current", () => {
  const { useEditor } = setup();
  useEditor().openMilestoneDetailsModal(record);
  const restore = useEditor().leaveMilestoneDetails(record);
  expect(useEditor().milestoneModalMode).toBeNull();
  restore();
  expect(useEditor()).toMatchObject({ milestoneModalMode: "detail", activeMilestoneId: record.id });
  const staleRestore = useEditor().leaveMilestoneDetails(record);
  useEditor().openCreateMilestoneModalForDay("2026-11-01");
  staleRestore();
  expect(useEditor()).toMatchObject({ milestoneModalMode: "create", activeMilestoneId: null });
});
