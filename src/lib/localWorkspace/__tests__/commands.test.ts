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

function command<T = { item: { id: string } }>(state: BootstrapPayload, path: string, body: object = {}, method = "POST", actorMemberId?: string | null): T {
  return applyLocalCommand(state, path, { method, body: JSON.stringify(body) }, actorMemberId) as T;
}

test("local CRUD writes canonical Task records and rejects removed ManufacturingItem routes", () => {
  const state = snapshot();
  const created = command(state, "/tasks", { title: "Local task" }).item;
  expect(state.tasks.find(({ id }) => id === created.id)).toMatchObject({ title: "Local task", manufacturingDetails: null });
  expect(state.tasks.find(({ id }) => id === created.id)).not.toHaveProperty("blockers");
  expect(() => command(state, "/tasks", { title: "Invalid", linkedManufacturingIds: ["old"] })).toThrow("removed Task fields");
  expect(() => command(state, "/manufacturing", { title: "Duplicate work" })).toThrow("nothing was synced");
});

test("local QA review attribution follows the current mentor or admin actor, not payload metadata or roster order", () => {
  const state = snapshot();
  state.members.push({ id: "participant", name: "Student", email: "student@example.com", role: "student", elevated: false, seasonId: "season" });
  state.members.push(
    { id: "mentor-a", name: "Mentor A", email: "a@example.com", role: "mentor", elevated: true, seasonId: "season" },
    { id: "mentor-b", name: "Mentor B", email: "b@example.com", role: "mentor", elevated: true, seasonId: "season" },
    { id: "admin", name: "Admin", email: "admin@example.com", role: "admin", elevated: true, seasonId: "season" },
  );
  state.tasks[0].status = "waiting-for-qa";
  const submitted = command(state, "/qa-reports/submit", {
    reportType: "qa", projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }],
    createdByMemberId: "participant", participantIds: ["participant"], mentorId: "mentor-a", requestedById: "participant",
    summary: "Local QA", notes: "Checked assembly", result: "minor-fix", status: "reviewed", actorMemberId: "mentor-a", reviewedById: "mentor-a", reviewedAt: "1999-01-01T00:00:00Z",
  }, "POST", "mentor-b").item;

  expect(state.reports).toContainEqual(expect.objectContaining({ id: submitted.id, reportType: "qa", status: "reviewed", reviewedById: "mentor-b", summary: "Local QA" }));
  expect(state.reports[0].reviewedAt).not.toBe("1999-01-01T00:00:00Z");
  state.tasks[0].status = "waiting-for-qa";
  const adminReview = command<{ item: BootstrapPayload["reports"][number] }>(state, "/qa-reports/submit", {
    reportType: "qa", projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }],
    participantIds: ["participant"], summary: "Admin QA", notes: "Admin checked", result: "pass", status: "reviewed",
    reviewedById: "mentor-a", reviewedAt: "1999-01-01T00:00:00Z",
  }, "POST", "admin").item;
  expect(adminReview).toMatchObject({ reviewedById: "admin", status: "reviewed" });
  expect(adminReview.reviewedAt).not.toBe("1999-01-01T00:00:00Z");
  expect(() => command(state, "/qa-reports/submit", { reportType: "qa", projectId: "missing" })).toThrow("incomplete or no longer valid");
  expect(() => command(state, "/qa-reports/submit", {
    reportType: "qa", projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }],
    participantIds: ["participant"], summary: "Unlinked", notes: "", result: "pass", status: "reviewed",
  }, "POST", "participant")).toThrow("local mentor or admin reviewer is required");
});

test("local QA review returns an unfinalizable pass to work and allows another request", () => {
  const state = snapshot();
  state.members.push(
    { id: "participant", name: "Student", email: "student@example.com", role: "student", elevated: false, seasonId: "season" },
    { id: "mentor", name: "Mentor", email: "mentor@example.com", role: "mentor", elevated: true, seasonId: "season" },
  );
  state.tasks[0] = { ...state.tasks[0], ownerId: "participant", assigneeIds: ["participant"], mentorId: "mentor", status: "in-progress", isBlocked: false, isWaitingOnDependency: false };
  const request = command<{ item: BootstrapPayload["qaRequests"][number] }>(state, "/qa-requests", {
    projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }], subject: "Ready for QA", mentorId: "mentor",
    requestedById: "mentor", createdAt: "1999-01-01", status: "cancelled",
  }, "POST", "participant").item;
  expect(request).toMatchObject({ requestedById: "participant", status: "requested" });

  command(state, "/qa-reports/submit", {
    reportType: "qa", projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }], participantIds: ["participant"],
    summary: "Pass without work log", notes: "Reviewed", result: "pass", status: "reviewed",
  }, "POST", "mentor");
  expect(state.qaRequests).toEqual([]);
  expect(state.tasks[0].status).toBe("in-progress");

  state.workLogs.push({ id: "work-log", taskId: "task", date: "2026-10-16", hours: 1, participantIds: ["participant"], notes: "Work completed" });
  expect(command(state, "/qa-requests", {
    projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }], subject: "Ready again", mentorId: "mentor",
  }, "POST", "participant").item).toMatchObject({ requestedById: "participant", status: "requested" });
});

test("local QA requests require a task and actual requester and cancellation preserves other workflow state", () => {
  const state = snapshot();
  state.members.push(
    { id: "participant", name: "Student", email: "student@example.com", role: "student", elevated: false, seasonId: "season" },
    { id: "mentor", name: "Mentor", email: "mentor@example.com", role: "mentor", elevated: true, seasonId: "season" },
  );
  state.tasks[0] = { ...state.tasks[0], ownerId: "participant", assigneeIds: ["participant"], mentorId: "mentor", status: "in-progress", isBlocked: false, isWaitingOnDependency: false };
  const base = { projectId: "robot-project", subject: "QA request", mentorId: "mentor" };
  expect(() => command(state, "/qa-requests", { ...base, targetRefs: [], requestedById: "participant" }, "POST", "participant")).toThrow("exactly one task");
  expect(() => command(state, "/qa-requests", { ...base, targetRefs: [{ kind: "task", id: "task" }], requestedById: "participant" })).toThrow("roster member is required");
  const request = command<{ item: BootstrapPayload["qaRequests"][number] }>(state, "/qa-requests", {
    ...base, targetRefs: [{ kind: "task", id: "task" }], requestedById: "mentor",
  }, "POST", "participant").item;
  const second = { ...request, id: "second-active-request", status: "in-review" as const };
  const unrelated = { ...request, id: "unrelated-request", targetRefs: [{ kind: "task" as const, id: "completed-task" }] };
  state.qaRequests.push(second, unrelated);
  state.tasks.push({ ...state.tasks[0], id: "completed-task", status: "complete" });

  const queuedBeforeDelete = structuredClone(state.qaRequests);
  expect(() => command(state, `/qa-requests/${request.id}`, {}, "DELETE")).toThrow("retained as workflow history");
  expect(state.qaRequests).toEqual(queuedBeforeDelete);
  expect(state.tasks[0].status).toBe("waiting-for-qa");

  expect(() => command(state, `/qa-requests/${request.id}`, { requestedById: "mentor" }, "PATCH")).toThrow("request details are read-only");
  expect(state.qaRequests.find((item) => item.id === request.id)?.requestedById).toBe("participant");
  command(state, `/qa-requests/${request.id}`, { status: "cancelled" }, "PATCH");
  expect(state.tasks[0].status).toBe("waiting-for-qa");
  command(state, `/qa-requests/${second.id}`, { status: "cancelled" }, "PATCH");
  expect(state.tasks[0].status).toBe("in-progress");
  expect(state.qaRequests.map((item) => item.id)).toEqual([request.id, second.id, unrelated.id]);
  expect(state.qaRequests.slice(0, 2).map((item) => item.status)).toEqual(["cancelled", "cancelled"]);
  command(state, `/qa-requests/${unrelated.id}`, { status: "cancelled" }, "PATCH");
  expect(state.tasks.find((task) => task.id === "completed-task")?.status).toBe("complete");
  expect(state.qaRequests.map((item) => item.id)).toEqual([request.id, second.id, unrelated.id]);
});

test("task QA requests require an assigned student or lead active in the task season", () => {
  const makeState = () => {
    const state = snapshot();
    state.members.push(
      { id: "student", name: "Student", email: "student@example.com", role: "student", elevated: false, seasonId: "season" },
      { id: "lead", name: "Lead", email: "lead@example.com", role: "lead", elevated: true, seasonId: "season" },
      { id: "mentor", name: "Mentor", email: "mentor@example.com", role: "mentor", elevated: true, seasonId: "season" },
      { id: "admin", name: "Admin", email: "admin@example.com", role: "admin", elevated: true, seasonId: "season" },
      { id: "other-season-lead", name: "Other Season Lead", email: "other@example.com", role: "lead", elevated: true, seasonId: "other-season", activeSeasonIds: ["other-season"] },
    );
    state.tasks[0] = { ...state.tasks[0], assigneeIds: ["student"], mentorId: "mentor", status: "in-progress", isBlocked: false, isWaitingOnDependency: false };
    return state;
  };
  const payload = { projectId: "robot-project", targetRefs: [{ kind: "task" as const, id: "task" }], subject: "QA", mentorId: "mentor", requestedById: "student" };

  for (const actorId of ["lead", "mentor", "admin"]) {
    const state = makeState();
    const before = structuredClone(state);
    expect(() => command(state, "/qa-requests", payload, "POST", actorId)).toThrow("Only assigned students and leads");
    expect(state).toEqual(before);
  }

  const outOfSeason = makeState();
  outOfSeason.tasks[0].assigneeIds = ["other-season-lead"];
  const beforeOutOfSeason = structuredClone(outOfSeason);
  expect(() => command(outOfSeason, "/qa-requests", payload, "POST", "other-season-lead")).toThrow("Only assigned students and leads");
  expect(outOfSeason).toEqual(beforeOutOfSeason);

  const assignedLead = makeState();
  assignedLead.tasks[0].assigneeIds = ["lead"];
  const created = command<{ item: BootstrapPayload["qaRequests"][number] }>(assignedLead, "/qa-requests", payload, "POST", "lead").item;
  expect(created).toMatchObject({ requestedById: "lead", status: "requested" });
  expect(assignedLead.tasks[0].status).toBe("waiting-for-qa");
});

test("local task QA eligibility checks blocking risk records even when the task flag is stale", () => {
  const state = snapshot();
  state.members.push(
    { id: "participant", name: "Student", email: "student@example.com", role: "student", elevated: false, seasonId: "season" },
    { id: "mentor", name: "Mentor", email: "mentor@example.com", role: "mentor", elevated: true, seasonId: "season" },
  );
  state.tasks[0] = { ...state.tasks[0], ownerId: "participant", assigneeIds: ["participant"], mentorId: "mentor", status: "in-progress", isBlocked: false, isWaitingOnDependency: false };
  state.risks.push({
    id: "blocking-risk", projectId: "robot-project", title: "Block", detail: "", category: "other", severity: "high",
    status: "open", blocksWork: true, source: { kind: "manual" }, relatedTargets: [{ kind: "task", id: "task" }],
    mitigationTaskId: null, ownerGroupId: null, ownerMemberId: null, mitigationDueDate: null,
    createdAt: "2026-10-16", updatedAt: "2026-10-16", resolvedAt: null,
  });
  expect(() => command(state, "/qa-requests", {
    projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }], subject: "Blocked", mentorId: "mentor",
  }, "POST", "participant")).toThrow("no blocking risks");
  expect(state.qaRequests).toEqual([]);
  expect(state.tasks[0].status).toBe("in-progress");
  expect(state.tasks[0].isBlocked).toBe(false);

  state.tasks[0].status = "waiting-for-qa";
  state.qaRequests.push({
    id: "pending", projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }], subject: "Pending",
    mentorId: "mentor", requestedById: "participant", createdAt: "2026-10-16", status: "requested",
  });
  const reportCount = state.reports.length;
  expect(() => command(state, "/qa-reports/submit", {
    reportType: "qa", projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }], participantIds: ["participant"],
    summary: "Blocked review", notes: "Must stay pending", result: "pass", status: "reviewed",
  }, "POST", "mentor")).toThrow("no blocking risks");
  expect(state.reports).toHaveLength(reportCount);
  expect(state.qaRequests.map((request) => request.id)).toEqual(["pending"]);
  expect(state.tasks[0].status).toBe("waiting-for-qa");
});

test("local finding retests use canonical finding history and replay operation IDs idempotently", () => {
  const state = snapshot();
  state.members.push(
    { id: "mentor-a", name: "Mentor A", email: "a@example.com", role: "mentor", elevated: true, seasonId: "season" },
    { id: "mentor-b", name: "Mentor B", email: "b@example.com", role: "mentor", elevated: true, seasonId: "season" },
    { id: "admin", name: "Admin", email: "admin@example.com", role: "admin", elevated: true, seasonId: "season" },
    { id: "student", name: "Student", email: "student@example.com", role: "student", elevated: false, seasonId: "season" },
  );
  state.testResults.push({ id: "test-result", projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }], title: "Drive test", status: "fail" });
  state.testFindings.push({
    id: "finding", reportId: null, testResultId: "test-result", projectId: "robot-project", targetRefs: [{ kind: "task", id: "task" }],
    title: "Loose fastener", detail: "Retorque", severity: "medium", status: "open", createdAt: "2026-10-16", updatedAt: "2026-10-16",
  });
  const payload = { operationId: "retest-1", sourceType: "test", result: "pass", notes: "Torque verified" };
  const first = command(state, "/report-findings/finding/retest", { ...payload, actorMemberId: "mentor-a", reviewedById: "mentor-a", reviewedAt: "1999-01-01T00:00:00Z" }, "POST", "mentor-b").item;
  const replay = command(state, "/report-findings/finding/retest", payload, "POST", "mentor-b").item;

  expect(first).toEqual(replay);
  expect(state.testFindings[0].status).toBe("resolved");
  expect(state.testFindings[0].retests).toHaveLength(1);
  expect(state.testFindings[0].retests![0]).toMatchObject({ operationId: "retest-1", sourceType: "test", reviewedById: "mentor-b", supersedesId: "test-result" });
  expect(state.testFindings[0].retests![0].reviewedAt).not.toBe("1999-01-01T00:00:00Z");
  const adminRetest = command<{ item: BootstrapPayload["testFindings"][number] }>(state, "/report-findings/finding/retest", { ...payload, operationId: "retest-admin", actorMemberId: "mentor-a", reviewedById: "mentor-a", reviewedAt: "1999-01-01T00:00:00Z" }, "POST", "admin").item;
  expect(adminRetest.retests?.at(-1)).toMatchObject({ operationId: "retest-admin", reviewedById: "admin" });
  expect(adminRetest.retests?.at(-1)?.reviewedAt).not.toBe("1999-01-01T00:00:00Z");
  expect(() => command(state, "/report-findings/finding/retest", { ...payload, notes: "Different payload" })).toThrow("different retest payload");
  expect(() => command(state, "/report-findings/finding/retest", { ...payload, operationId: "retest-student" }, "POST", "student")).toThrow("local mentor or admin reviewer is required");
  expect(() => command(state, "/report-findings/finding/retest", { ...payload, operationId: "retest-unlinked" })).toThrow("local mentor or admin reviewer is required");
});

test("local purchase receipts preserve operation identity, stock updates and linked service decimals", () => {
  const state = snapshot();
  state.partDefinitions.push({ id: "bearing", seasonId: "season", name: "Bearing", partNumber: "B-1", revision: "A", iteration: 1, isArchived: false, type: "bearing", defaultAcquisitionMethod: "purchase-cots", materialId: "steel", description: "" });
  state.materials.push({ id: "steel", name: "Steel", category: "metal", unit: "kg", onHandQuantity: 0, reorderPoint: 0, location: "", preferredVendorId: null, notes: "" });
  state.purchaseItems.push({
    id: "part-purchase", taskId: "task", kind: "cots-goods", partDefinitionId: "bearing", materialId: "steel", title: "Bearing", quantity: 3,
    quotes: [], selectedQuoteId: null, approvalStatus: "approved", approvedById: null, approvedAt: null, purchaseOrderNumber: null,
    orderStatus: "ordered", finalCost: null, expectedDeliveryDate: null, trackingNumber: null, trackingUrl: null, orderedAt: null, deliveredAt: null,
  });
  const payload = { operationId: "receipt-1", quantity: 2, location: "Shelf A" };
  const first = command<{ receipt: { quantity: number; partInstanceIds: string[] } }>(state, "/purchases/part-purchase/receipts", payload).receipt;
  const replay = command<{ receipt: { quantity: number; partInstanceIds: string[] } }>(state, "/purchases/part-purchase/receipts", payload).receipt;
  expect(replay).toEqual(first);
  expect(state.purchaseItems[0].receipts).toHaveLength(1);
  expect(state.partInstances).toHaveLength(2);
  expect(state.materials[0].onHandQuantity).toBe(0);
  expect(() => command(state, "/purchases/part-purchase/receipts", { ...payload, quantity: 1 })).toThrow("different receipt payload");
  expect(() => command(state, "/purchases/part-purchase/receipts", { ...payload, operationId: "fractional-part", quantity: 1.5 })).toThrow("whole number");

  state.purchaseItems.push({ ...state.purchaseItems[0], id: "material-purchase", partDefinitionId: null, quantity: 3, receipts: [] });
  command(state, "/purchases/material-purchase/receipts", { operationId: "material-receipt", quantity: 0.5, location: "Material shelf" });
  expect(state.materials[0]).toMatchObject({ onHandQuantity: 0.5, location: "Material shelf" });

  state.purchaseItems.push({ ...state.purchaseItems[0], id: "service-purchase", kind: "manufacturing-service", quantity: 3, receipts: [] });
  const serviceReceipt = command<{ receipt: { quantity: number; partInstanceIds: string[] } }>(state, "/purchases/service-purchase/receipts", { operationId: "service-receipt", quantity: 1.5, location: "Shop" }).receipt;
  expect(serviceReceipt.quantity).toBe(1.5);
  expect(serviceReceipt.partInstanceIds).toEqual([]);
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
  const team = { id: "team", seasonId: "season", name: "Team", icon: "users" as const, color: "#4F86C6", projectIds: [], workTypeIds: [], memberIds: [], primaryMemberIds: [], isArchived: false };
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
    { id: "old-team", seasonId: "season", name: "Old Team", icon: "users", color: "#4F86C6", projectIds: [], workTypeIds: [], memberIds: [studentId], primaryMemberIds: [studentId], isArchived: false },
    { id: "new-team", seasonId: "season", name: "New Team", icon: "users", color: "#4F86C6", projectIds: [], workTypeIds: [], memberIds: [studentId], primaryMemberIds: [], isArchived: false },
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
