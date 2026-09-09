import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { applyLocalCommand } from "../commands";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

function command(snapshot: BootstrapPayload, path: string, body: object = {}, method = "POST") {
  return applyLocalCommand(snapshot, path, { method, body: JSON.stringify(body) }) as { item: TaskRecord };
}
function task(snapshot: BootstrapPayload, title: string) {
  return command(snapshot, "/tasks", { title }).item;
}

test("local creates, edits and deletes operate on actual records and reject missing records/routes", () => {
  const snapshot = createBootstrap();
  const created = task(snapshot, "Local task");
  command(snapshot, `/tasks/${created.id}`, { title: "Edited" }, "PATCH");
  expect(snapshot.tasks.find((row) => row.id === created.id)?.title).toBe("Edited");
  command(snapshot, `/tasks/${created.id}`, {}, "DELETE");
  expect(snapshot.tasks.some((row) => row.id === created.id)).toBe(false);
  expect(() => command(snapshot, `/tasks/${created.id}`, {}, "PATCH")).toThrow("no longer exists");
  expect(() => command(snapshot, "/cad/imports")).toThrow("nothing was synced");
});

test("hard dependencies honor requested state, missing targets block, and soft dependencies do not", () => {
  const snapshot = createBootstrap();
  const target = task(snapshot, "Target");
  const dependent = task(snapshot, "Dependent");
  const dependency = command(snapshot, "/task-dependencies", { taskId: dependent.id, kind: "task", refId: target.id, requiredState: "in-progress", dependencyType: "hard" }).item;
  expect(dependent.isWaitingOnDependency).toBe(true);
  expect(() => command(snapshot, `/tasks/${dependent.id}`, { status: "complete" }, "PATCH")).toThrow("Resolve blockers");
  command(snapshot, `/tasks/${target.id}`, { status: "in-progress" }, "PATCH");
  expect(dependent.isWaitingOnDependency).toBe(false);
  command(snapshot, `/tasks/${target.id}`, {}, "DELETE");
  expect(dependent.isWaitingOnDependency).toBe(true);
  command(snapshot, `/task-dependencies/${dependency.id}`, { dependencyType: "soft" }, "PATCH");
  expect(dependent.isWaitingOnDependency).toBe(false);
});

test("milestone dependency threshold and duplicate blockers match readiness semantics", () => {
  const snapshot = createBootstrap();
  const dependent = task(snapshot, "Dependent");
  const milestone = command(snapshot, "/milestones", { title: "Ready", status: "ready" }).item;
  command(snapshot, "/task-dependencies", { taskId: dependent.id, kind: "milestone", refId: milestone.id, requiredState: "qa", dependencyType: "hard" });
  expect(dependent.isWaitingOnDependency).toBe(false);
  const blocker = { blockedTaskId: dependent.id, blockerType: "external", issueType: "lost-tool", description: "Missing tool", severity: "medium", status: "open" };
  const first = command(snapshot, "/task-blockers", blocker).item;
  const second = command(snapshot, "/task-blockers", blocker).item;
  expect(dependent.blockers).toEqual(["Missing tool"]);
  command(snapshot, `/task-blockers/${first.id}`, { status: "resolved" }, "PATCH");
  expect(dependent.isBlocked).toBe(true);
  command(snapshot, `/task-blockers/${second.id}`, {}, "DELETE");
  expect(dependent.isBlocked).toBe(false);
});

test("QA projections retain proposals and only approved reassessment updates linked risk", () => {
  const snapshot = createBootstrap();
  const subject = task(snapshot, "Review me");
  const risk = command(snapshot, "/risks", { title: "Risk", severity: "high", mitigationTaskId: null }).item;
  const proposal = { reportType: "QA", taskId: subject.id, notes: "Evidence", targetRiskId: risk.id, proposedRiskStatus: "full-mitigation", mentorApproved: false };
  const report = command(snapshot, "/reports", proposal).item;
  expect(snapshot.qaReports.find((row) => row.id === report.id)).toMatchObject({ summary: "Evidence", proposedRiskStatus: "full-mitigation" });
  expect(snapshot.risks.find((row) => row.id === risk.id)?.severity).toBe("high");
  command(snapshot, "/reports", { ...proposal, mentorApproved: true });
  expect(snapshot.risks.find((row) => row.id === risk.id)).toMatchObject({ severity: "low", mitigationTaskId: subject.id });
  const before = snapshot.reports.length;
  expect(() => command(snapshot, "/reports", { ...proposal, targetRiskId: "missing" })).toThrow("target risk");
  expect(snapshot.reports).toHaveLength(before);
});

test("robot layouts and meeting projections round-trip; favorites are idempotent", () => {
  const snapshot = createBootstrap();
  const subsystem = snapshot.subsystems[0];
  const layout = { layoutX: 0.2, layoutY: 0.7, layoutZone: "front", layoutView: "top", sortOrder: 3 };
  command(snapshot, `/subsystems/${subsystem.id}`, layout, "PATCH");
  expect(snapshot.subsystems[0]).toMatchObject(layout);
  const meeting = command(snapshot, "/meetings", { title: "Review", startDateTime: "2026-09-09T17:30:00Z" }).item;
  expect(meeting).toMatchObject({ date: "2026-09-09", time: "17:30", rsvpsYes: 0 });
  command(snapshot, "/navigation/favorites/tasks", { isFavorite: true }, "PATCH");
  command(snapshot, "/navigation/favorites/tasks", { isFavorite: true }, "PATCH");
  expect(snapshot.favoriteViews?.filter((row) => row.viewId === "tasks")).toHaveLength(1);
});

test("part-definition deletion removes instances and detaches task and production links", () => {
  const snapshot = createBootstrap();
  const definition = snapshot.partDefinitions[0];
  const part = command(snapshot, "/part-instances", { partDefinitionId: definition.id, name: "Local instance" }).item;
  const assigned = command(snapshot, "/tasks", { title: "Build", partInstanceId: part.id, partInstanceIds: [part.id] }).item;
  const purchase = command(snapshot, "/purchases", { title: "Buy", partDefinitionId: definition.id }).item;
  command(snapshot, `/part-definitions/${definition.id}`, {}, "DELETE");
  expect(snapshot.partInstances.some((item) => item.id === part.id)).toBe(false);
  expect(assigned).toMatchObject({ partInstanceId: null, partInstanceIds: [] });
  expect(purchase).toMatchObject({ partDefinitionId: null });
});

test("deleting a roster member clears work, report, subsystem and procurement references together", () => {
  const snapshot = createBootstrap();
  const member = snapshot.members[0];
  const subject = task(snapshot, "Roster cleanup");
  command(snapshot, `/tasks/${subject.id}`, { ownerId: member.id, assigneeIds: [member.id], mentorId: member.id }, "PATCH");
  command(snapshot, `/subsystems/${snapshot.subsystems[0].id}`, { responsibleEngineerId: member.id, mentorIds: [member.id] }, "PATCH");
  command(snapshot, "/work-logs", { taskId: subject.id, participantIds: [member.id], hours: 1, date: "2026-09-09", notes: "Example" });
  command(snapshot, "/reports", { reportType: "QA", taskId: subject.id, createdByMemberId: member.id, participantIds: [member.id], notes: "Example" });
  command(snapshot, "/manufacturing", { requestedById: member.id, title: "Example" });
  snapshot.qaReviews = [{ id: "review", subjectId: subject.id, subjectType: "task", subjectTitle: subject.title, participantIds: [member.id], result: "pass", mentorApproved: true, notes: "Example", reviewedAt: "2026-09-09" }];
  snapshot.qaRequests = [{ id: "request", taskId: subject.id, subject: subject.title, mentorId: member.id, requestedById: null, createdAt: "2026-09-09", status: "requested" }];
  snapshot.attendanceRecords = [{ id: "attendance", memberId: member.id, date: "2026-09-09", totalHours: 1 }];
  command(snapshot, `/members/${member.id}`, {}, "DELETE");
  expect(snapshot.tasks.find((row) => row.id === subject.id)).toMatchObject({ ownerId: null, mentorId: null, assigneeIds: [] });
  expect(snapshot.subsystems[0]).toMatchObject({ responsibleEngineerId: null, mentorIds: [] });
  expect(snapshot.workLogs.at(-1)?.participantIds).toEqual([]);
  expect(snapshot.reports.at(-1)).toMatchObject({ createdByMemberId: null, participantIds: [] });
  expect(snapshot.qaReports.at(-1)?.participantIds).toEqual([]);
  expect(snapshot.qaReviews[0].participantIds).toEqual([]);
  expect(snapshot.manufacturingItems.at(-1)?.requestedById).toBeNull();
  expect(snapshot.qaRequests).toEqual([]);
  expect(snapshot.attendanceRecords).toEqual([]);
});

test("stale person selections cannot recreate dangling assignments after roster deletion", () => {
  const snapshot = createBootstrap();
  const member = snapshot.members[0];
  const subject = task(snapshot, "Assignment");
  command(snapshot, `/members/${member.id}`, {}, "DELETE");
  expect(() => command(snapshot, `/tasks/${subject.id}`, { assigneeIds: [member.id] }, "PATCH")).toThrow("local roster");
  expect(() => command(snapshot, "/reports", { reportType: "QA", taskId: subject.id, createdByMemberId: member.id })).toThrow("local roster");
  expect(subject.assigneeIds).toEqual([]);
});

test("logged hours follow work-log creation, edits, moves and deletion rather than task writes", () => {
  const snapshot = createBootstrap();
  const first = task(snapshot, "First");
  const second = task(snapshot, "Second");
  const log = command(snapshot, "/work-logs", { taskId: first.id, hours: 1.25, participantIds: [], date: "2026-09-09", notes: "Example" }).item;
  expect(first.actualHours).toBe(1.25);
  command(snapshot, `/work-logs/${log.id}`, { hours: 2.5 }, "PATCH");
  expect(first.actualHours).toBe(2.5);
  command(snapshot, `/work-logs/${log.id}`, { taskId: second.id }, "PATCH");
  expect(first.actualHours).toBe(0);
  expect(second.actualHours).toBe(2.5);
  command(snapshot, `/tasks/${second.id}`, { actualHours: 999 }, "PATCH");
  expect(snapshot.tasks.find((row) => row.id === second.id)?.actualHours).toBe(2.5);
  command(snapshot, `/work-logs/${log.id}`, {}, "DELETE");
  expect(snapshot.tasks.find((row) => row.id === second.id)?.actualHours).toBe(0);
});
