import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";
import { applyLocalCommand } from "../commands";

function snapshot(): BootstrapPayload {
  const state = structuredClone(EMPTY_BOOTSTRAP);
  state.projects.push({ id: "robot-project", seasonId: "season", name: "Robot", projectType: "robot", description: "", status: "active" });
  state.workTypes.push({ id: "robot:planning", projectType: "robot", code: "planning", name: "Planning", isActive: true });
  state.tasks.push({
    id: "task", projectId: "robot-project", workTypeId: "robot:planning", responsibleGroupId: null,
    workstreamIds: [], title: "Work", summary: "", subsystemIds: [], mechanismIds: [], partInstanceIds: [], scheduleRefs: [],
    requestedById: null, ownerId: null, assigneeIds: [], mentorId: null, startDate: "2026-09-01", dueDate: "2026-09-30",
    priority: "medium", status: "not-started", checklistItems: [], manufacturingDetails: null,
    estimatedHours: 1, actualHours: 0, requiresDocumentation: false,
  });
  return state;
}

function command(state: BootstrapPayload, path: string, body: object = {}, method = "POST") {
  return applyLocalCommand(state, path, { method, body: JSON.stringify(body) }) as { item: { id: string } };
}

test("local CRUD writes canonical Task records and rejects removed ManufacturingItem routes", () => {
  const state = snapshot();
  const created = command(state, "/tasks", { title: "Local task" }).item;
  expect(state.tasks.find(({ id }) => id === created.id)).toMatchObject({ title: "Local task", manufacturingDetails: null });
  expect(state.tasks.find(({ id }) => id === created.id)).not.toHaveProperty("blockers");
  expect(() => command(state, "/tasks", { title: "Invalid", linkedManufacturingIds: ["old"] })).toThrow("removed Task fields");
  expect(() => command(state, "/manufacturing", { title: "Duplicate work" })).toThrow("nothing was synced");
});

test("local Tasks derive blocked state from canonical Risks and dependencies", () => {
  const state = snapshot();
  const task = state.tasks[0];
  state.risks.push({
    id: "risk", projectId: task.projectId, title: "Blocked", detail: "", category: "supply", severity: "high",
    status: "open", blocksWork: true, source: { kind: "manual" }, relatedTargets: [{ kind: "task", id: task.id }],
    mitigationTaskId: null, ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null, createdAt: "2026-09-01", updatedAt: "2026-09-01", resolvedAt: null,
  });
  applyLocalCommand(state, "/risks/risk", { method: "PATCH", body: JSON.stringify({ status: "resolved" }) });
  expect(task.isBlocked).toBe(false);
});

test("purchase records require a human execution Task and are removed with that Task", () => {
  const state = snapshot();
  expect(() => command(state, "/purchases", { title: "No Task" })).toThrow("link to a procurement or manufacturing Task");
  const purchase = command(state, "/purchases", { taskId: "task", kind: "cots-goods", title: "Sensor", quantity: 1 }).item;
  command(state, "/tasks/task", {}, "DELETE");
  expect(state.purchaseItems.some(({ id }) => id === purchase.id)).toBe(false);
});

test("deleting a local team clears Task and risk ownership references", () => {
  const state = snapshot();
  const team = { id: "team", seasonId: "season", name: "Team", projectIds: [], workTypeIds: [], memberIds: [], primaryMemberIds: [], isArchived: false };
  state.responsibleGroups.push(team);
  state.tasks[0].responsibleGroupId = team.id;
  state.risks.push({
    id: "risk", projectId: state.tasks[0].projectId, title: "Risk", detail: "", category: "other", severity: "low",
    status: "open", blocksWork: false, source: { kind: "manual" }, relatedTargets: [], mitigationTaskId: null,
    ownerGroupId: team.id, ownerMemberId: null, mitigationDueDate: null, createdAt: "2026-09-01", updatedAt: "2026-09-01", resolvedAt: null,
  });

  command(state, `/responsible-groups/${team.id}`, {}, "DELETE");

  expect(state.tasks[0].responsibleGroupId).toBeNull();
  expect(state.risks[0].ownerGroupId).toBeNull();
});

test("making a local team primary transfers students from their previous primary team", () => {
  const state = snapshot();
  const studentId = "student";
  state.seasons.push({ id: "season", teamId: "team-1", name: "Season", type: "season", startDate: "2026-01-01", endDate: "2026-12-31" });
  state.members.push({ id: studentId, name: "Student", email: "student@example.com", role: "student", elevated: false, seasonId: "season" });
  state.responsibleGroups.push(
    { id: "old-team", seasonId: "season", name: "Old Team", projectIds: [], workTypeIds: [], memberIds: [studentId], primaryMemberIds: [studentId], isArchived: false },
    { id: "new-team", seasonId: "season", name: "New Team", projectIds: [], workTypeIds: [], memberIds: [studentId], primaryMemberIds: [], isArchived: false },
  );

  command(state, "/responsible-groups/new-team", { primaryMemberIds: [studentId] }, "PATCH");

  expect(state.responsibleGroups.find(group => group.id === "old-team")?.primaryMemberIds).toEqual([]);
  expect(state.responsibleGroups.find(group => group.id === "new-team")?.primaryMemberIds).toEqual([studentId]);
  expect(state.responsibleGroups.filter(group => group.primaryMemberIds.includes(studentId))).toHaveLength(1);
});

test("local robot hierarchy supports creation and rejects cyclic parents", () => {
  const state = snapshot();
  const parent = command(state, "/subsystems", { projectId: "robot-project", name: "Drive", description: "" }).item;
  const child = command(state, "/subsystems", { projectId: "robot-project", parentSubsystemId: parent.id, name: "Module", description: "" }).item;
  command(state, "/mechanisms", { subsystemId: child.id, name: "Wheel" });
  expect(state.mechanisms[0].subsystemId).toBe(child.id);
  expect(() => command(state, `/subsystems/${parent.id}`, { parentSubsystemId: child.id }, "PATCH")).toThrow("hierarchy cycle");
  command(state, `/subsystems/${parent.id}`, {}, "DELETE");
  expect(state.subsystems).toEqual([]);
  expect(state.mechanisms).toEqual([]);
});

test("definition deletion cleans indirect part targets but retains missing hard prerequisites", () => {
  const state = snapshot();
  const definition = command(state, "/part-definitions", { name: "Plate" }).item;
  const part = command(state, "/part-instances", { partDefinitionId: definition.id, intendedSubsystemId: null, intendedMechanismId: null, location: { kind: "stock", location: "Bin" } }).item;
  state.tasks[0].partInstanceIds = [part.id];
  command(state, "/task-dependencies", { taskId: "task", kind: "part-instance", refId: part.id, dependencyType: "hard", requiredCondition: { kind: "physical-location", value: "stock" } });
  expect(state.tasks[0].isWaitingOnDependency).toBe(false);
  command(state, `/part-definitions/${definition.id}`, {}, "DELETE");
  expect(state.partInstances).toEqual([]);
  expect(state.tasks[0].partInstanceIds).toEqual([]);
  expect(state.taskDependencies).toHaveLength(1);
  expect(state.tasks[0].isWaitingOnDependency).toBe(true);
});

test("local mechanism moves preserve another target's original subsystem and reject cross-project moves", () => {
  const state = snapshot();
  const old = command(state, "/subsystems", { projectId: "robot-project", name: "Old" }).item;
  const next = command(state, "/subsystems", { projectId: "robot-project", name: "New" }).item;
  const moved = command(state, "/mechanisms", { subsystemId: old.id, name: "Moved" }).item;
  const retained = command(state, "/mechanisms", { subsystemId: old.id, name: "Retained" }).item;
  state.tasks[0].subsystemIds = [old.id];
  state.tasks[0].mechanismIds = [moved.id, retained.id];
  command(state, `/mechanisms/${moved.id}`, { subsystemId: next.id }, "PATCH");
  expect(state.tasks[0].subsystemIds).toEqual([old.id, next.id]);
  state.projects.push({ ...state.projects[0], id: "other-project" });
  const outside = command(state, "/subsystems", { projectId: "other-project", name: "Outside" }).item;
  expect(() => command(state, `/mechanisms/${moved.id}`, { subsystemId: outside.id }, "PATCH")).toThrow("between projects");
  expect(() => command(state, `/subsystems/${old.id}`, { projectId: "other-project" }, "PATCH")).toThrow("between projects");
});

test("local purchase workflow metadata persists without creating another commercial record", () => {
  const state = snapshot();
  const purchase = command(state, "/purchases", { taskId: "task", title: "Sensor", kind: "cots-goods", finalCost: null }).item;
  command(state, `/purchases/${purchase.id}/approval`, { approvalStatus: "approved" }, "PUT");
  command(state, `/purchases/${purchase.id}/transition`, { orderStatus: "not-ordered", finalCost: { amount: 25, currency: "USD" }, purchaseOrderNumber: "PO-1" });
  expect(state.purchaseItems).toHaveLength(1);
  expect(state.purchaseItems[0]).toMatchObject({ approvalStatus: "approved", orderStatus: "not-ordered", finalCost: { amount: 25, currency: "USD" }, purchaseOrderNumber: "PO-1" });
});

test("new local Tasks use the user's calendar date at local midnight", () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 10, 0, 30));
  try {
    const state = snapshot();
    command(state, "/tasks", { title: "Early planning" });
    expect(state.tasks.at(-1)).toMatchObject({ startDate: "2026-10-10", dueDate: "2026-10-10" });
  } finally {
    jest.useRealTimers();
  }
});
