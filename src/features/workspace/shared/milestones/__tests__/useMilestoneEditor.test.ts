import { useState } from "react";
import type { MilestoneRecord } from "@/types/recordsExecution";
import { useMilestoneEditor } from "../useMilestoneEditor";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(), useCallback: (callback: unknown) => callback }));

function setup() {
  const state: unknown[] = [];
  let cursor = 0;
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
  return { args, useEditor: () => { cursor = 0; return useMilestoneEditor(args); } };
}

const record = {
  id: "event", title: "Competition", type: "competition", isExternal: true,
  description: "Travel", projectIds: ["project"],
  startDateTime: "2026-10-01T09:00:00", endDateTime: "2026-10-02T17:00:00",
} as MilestoneRecord;
const submit = { preventDefault: jest.fn() } as never;

test("editing keeps record dates and projects; cancel and create reset drafts with the view's defaults", () => {
  const { args, useEditor } = setup();
  useEditor().openEditMilestoneModal(record);
  expect(useEditor()).toMatchObject({
    milestoneModalMode: "edit", activeMilestoneId: "event", milestoneStartDate: "2026-10-01",
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
  expect(args.onSaveTimelineMilestone).toHaveBeenLastCalledWith("edit", "event", expect.objectContaining({ title: "Revised", description: "Notes", projectIds: ["project"] }));
  expect(args.onTaskEditSaved).toHaveBeenCalledTimes(1);
  expect(useEditor().milestoneModalMode).toBeNull();
});

test("untimed events use noon and optional end dates; detail mode cannot submit or delete", async () => {
  const { args, useEditor } = setup();
  useEditor().openCreateMilestoneModalForDay("2026-11-03");
  useEditor().setMilestoneStartTime("");
  useEditor().setMilestoneDraft({ ...useEditor().milestoneDraft, title: "Untimed" });
  await useEditor().handleMilestoneSubmit(submit);
  expect(args.onSaveTimelineMilestone).toHaveBeenLastCalledWith("create", null, expect.objectContaining({ startDateTime: "2026-11-03T12:00:00", endDateTime: null }));
  useEditor().openMilestoneDetailsModal(record);
  await useEditor().handleMilestoneSubmit(submit);
  await useEditor().handleMilestoneDelete();
  expect(args.onSaveTimelineMilestone).toHaveBeenCalledTimes(1);
  expect(args.onDeleteTimelineMilestone).not.toHaveBeenCalled();
  expect(args.onTaskEditSaved).not.toHaveBeenCalled();
});
