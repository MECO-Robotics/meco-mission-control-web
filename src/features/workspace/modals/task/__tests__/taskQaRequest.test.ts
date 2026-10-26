import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { TaskRecord } from "@/types/recordsExecution";
import { getTaskQaRequestBlockReason } from "../taskQaRequest";

it("allows an assigned student to request QA for started work with an assigned mentor", () => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], status: "in-progress" as const, assigneeIds: ["student-1"], mentorId: "mentor-1" };
  expect(getTaskQaRequestBlockReason(task, "student-1", bootstrap)).toBeNull();
});

it("allows an assigned lead through the QA request eligibility check", () => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], status: "in-progress" as const, ownerId: "lead-1", mentorId: "mentor-1" };
  expect(getTaskQaRequestBlockReason(task, "lead-1", bootstrap)).toBeNull();
});

const blockedCases: Array<[string, Partial<TaskRecord>, string]> = [
  ["missing mentor", { mentorId: null }, "Assign an eligible mentor before requesting QA."],
  ["ineligible mentor", { mentorId: "lead-1" }, "Assign an eligible mentor before requesting QA."],
  ["not started", { status: "not-started" }, "Start this task before requesting QA."],
  ["unrecorded", { status: "unrecorded" }, "Record task progress before requesting QA."],
  ["complete", { status: "complete" }, "Completed tasks cannot request QA."],
  ["blocked", { isBlocked: true }, "Resolve this task’s blocker before requesting QA."],
  ["waiting on dependency", { isWaitingOnDependency: true }, "Resolve this task’s blocker before requesting QA."],
  ["unassigned", { assigneeIds: [] }, "You must be assigned to this task to request QA."],
];

it.each(blockedCases)("blocks %s", (_name, patch, expected) => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], status: "in-progress" as const, assigneeIds: ["student-1"], mentorId: "mentor-1", ...patch };
  expect(getTaskQaRequestBlockReason(task, "student-1", bootstrap)).toBe(expected);
});

it("keeps one pending request per task and blocks an already waiting task", () => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], status: "in-progress" as const, assigneeIds: ["student-1"], mentorId: "mentor-1" };
  bootstrap.qaRequests = [{ id: "qa-1", projectId: task.projectId, targetRefs: [{ kind: "task", id: task.id }], subject: "QA", mentorId: "mentor-1", requestedById: "student-1", createdAt: "2026-10-15T12:00:00Z", status: "requested" }];
  expect(getTaskQaRequestBlockReason(task, "student-1", bootstrap)).toBe("QA has already been requested for this task.");
  expect(getTaskQaRequestBlockReason({ ...task, status: "waiting-for-qa" }, "student-1", { ...bootstrap, qaRequests: [] })).toBe("QA has already been requested for this task.");
});
