import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { requestApi } from "@/lib/auth/core/request";
import { createQaRequestRecord } from "@/lib/auth/records/reporting";
import { scopeBootstrapBySelection } from "@/app/state/workspaceBootstrapScope";
import { enterLocalDemo, getLocalWorkspaceMode, leaveLocalWorkspace, resetLocalDemo } from "../session";
import type { BootstrapPayload } from "@/types/bootstrap";

const originalFetch = globalThis.fetch;
const data = new Map<string, string>();
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: jest.fn((key: string, value: string) => { data.set(key, value); }),
  removeItem: (key: string) => { data.delete(key); },
};
const seed: BootstrapPayload = { ...structuredClone(EMPTY_BOOTSTRAP), materials: [{ id: "material", name: "Original", category: "other", onHandQuantity: 2, reorderPoint: 0, location: "", preferredVendorId: null, unit: "each", notes: "" }] };
const write = (name: string) => requestApi("/materials/material", { method: "PATCH", body: JSON.stringify({ name }) });
const read = () => requestApi<BootstrapPayload>("/bootstrap");
beforeEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage: storage } });
  data.clear(); storage.setItem.mockReset().mockImplementation((key, value) => { data.set(key, value); });
  leaveLocalWorkspace(); resetLocalDemo();
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(seed)));
});
afterEach(() => { leaveLocalWorkspace(); globalThis.fetch = originalFetch; });

it("saves demo edits locally across reopening and never sends mutation or refresh requests", async () => {
  await read();
  const calls = jest.mocked(fetch).mock.calls.length;
  await write("Local edit");
  expect((await read()).materials[0].name).toBe("Local edit");
  leaveLocalWorkspace(); enterLocalDemo();
  expect((await read()).materials[0].name).toBe("Local edit");
  expect(fetch).toHaveBeenCalledTimes(calls);
  expect(jest.mocked(fetch).mock.calls.every(([, options]) => !options?.method || options.method === "GET")).toBe(true);
});

it("restores a current-schema saved demo without the optional actions collection before workspace scoping", async () => {
  const withoutActions = (payload: BootstrapPayload) => {
    const saved = structuredClone(payload) as Partial<BootstrapPayload>;
    delete saved.actions;
    return saved;
  };
  const baseline = withoutActions(seed);
  const savedSnapshot = withoutActions({
    ...seed,
    materials: seed.materials.map((material) => ({ ...material, name: "Kept from older saved demo" })),
  });
  data.set("meco.local-demo.v1", JSON.stringify({ schemaVersion: 3, baseline, snapshot: savedSnapshot }));

  const restored = await read();
  const scoped = scopeBootstrapBySelection(restored, null, null);

  expect(scoped.actions).toEqual([]);
  expect(scoped.materials[0].name).toBe("Kept from older saved demo");
  expect(fetch).not.toHaveBeenCalled();
});

it("isolates tutorial changes, resets its baseline, and restores demo edits on exit", async () => {
  await read(); await write("Demo edit");
  await requestApi("/tutorial/session/start", { method: "POST" });
  expect(getLocalWorkspaceMode()).toBe("tutorial");
  expect((await read()).materials[0].name).toBe("Original");
  await write("Tutorial edit");
  await requestApi("/tutorial/session/reset", { method: "POST", body: JSON.stringify({ mode: "baseline" }) });
  expect((await read()).materials[0].name).toBe("Original");
  await requestApi("/tutorial/session/reset", { method: "POST", body: JSON.stringify({ mode: "session" }) });
  expect((await read()).materials[0].name).toBe("Demo edit");
});

it("uses only the current request actor in local tutorial reviews and drops it after logout", async () => {
  const tutorialSeed = createBootstrap();
  tutorialSeed.members.push(
    { id: "mentor-b", name: "Mentor B", email: "mentor-b@example.com", role: "mentor", elevated: true, seasonId: "season-2026" },
    { id: "admin-1", name: "Admin", email: "admin@example.com", role: "admin", elevated: true, seasonId: "season-2026" },
  );
  tutorialSeed.tasks[0] = { ...tutorialSeed.tasks[0], status: "waiting-for-qa", isBlocked: false, isWaitingOnDependency: false };
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(tutorialSeed)));
  await requestApi("/tutorial/session/start", { method: "POST" });
  const payload = {
    reportType: "qa", projectId: "project-a", targetRefs: [{ kind: "task", id: "task-1" }],
    participantIds: ["lead-1"], summary: "Local review", notes: "Checked", result: "minor-fix", status: "reviewed",
    reviewedById: "mentor-1", reviewedAt: "1999-01-01T00:00:00Z",
  };
  const review = (localActorMemberId?: string | null) => requestApi<{ item: BootstrapPayload["reports"][number] }>(
    "/qa-reports/submit", { method: "POST", body: JSON.stringify(payload) }, undefined, localActorMemberId,
  );

  const mentorReview = await review("mentor-b");
  expect(mentorReview.item).toMatchObject({ reviewedById: "mentor-b" });
  expect(mentorReview.item.reviewedAt).not.toBe("1999-01-01T00:00:00Z");
  const adminReview = await review("admin-1");
  expect(adminReview.item).toMatchObject({ reviewedById: "admin-1" });
  await expect(review()).rejects.toMatchObject({ statusCode: 403 });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("records task QA requests with canonical actor and task state through the local request adapter", async () => {
  const tutorialSeed = createBootstrap();
  tutorialSeed.tasks[0] = {
    ...tutorialSeed.tasks[0],
    assigneeIds: ["student-1"],
    mentorId: "mentor-1",
    status: "in-progress",
    isBlocked: false,
    isWaitingOnDependency: false,
  };
  const unrelatedTask = { ...tutorialSeed.tasks[1], status: "in-progress" as const };
  tutorialSeed.tasks[1] = unrelatedTask;
  tutorialSeed.workLogs.push({ id: "qa-cycle-worklog", taskId: "task-1", date: "2026-10-16", hours: 1, participantIds: ["student-1"], notes: "Completed task work" });
  const unrelatedRequest: BootstrapPayload["qaRequests"][number] = {
    id: "unrelated-qa-request", projectId: unrelatedTask.projectId,
    targetRefs: [{ kind: "task", id: unrelatedTask.id }], subject: "Other task QA", mentorId: "mentor-1",
    requestedById: "student-1", createdAt: "2026-10-16T00:00:00.000Z", status: "requested",
  };
  tutorialSeed.qaRequests.push(unrelatedRequest);
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(tutorialSeed)));
  await requestApi("/tutorial/session/start", { method: "POST" });
  const payload = {
    projectId: "project-a",
    targetRefs: [{ kind: "task" as const, id: "task-1" }],
    subject: "QA request",
    mentorId: "mentor-1",
    requestedById: "lead-1",
    createdAt: "1999-01-01T00:00:00.000Z",
    status: "cancelled",
  };

  const studentRequest = await createQaRequestRecord(payload, undefined, "student-1");
  expect(studentRequest).toMatchObject({
    projectId: "project-a",
    requestedById: "student-1",
    mentorId: "mentor-1",
    status: "requested",
  });
  expect(studentRequest.createdAt).not.toBe("1999-01-01T00:00:00.000Z");
  expect((await requestApi<BootstrapPayload>("/bootstrap")).tasks[0].status).toBe("waiting-for-qa");

  const duplicate = await createQaRequestRecord(payload, undefined, "student-1");
  expect(duplicate.id).toBe(studentRequest.id);
  expect((await requestApi<BootstrapPayload>("/bootstrap")).qaRequests).toHaveLength(2);

  const reportPayload = {
    reportType: "qa", projectId: "project-a", targetRefs: payload.targetRefs,
    participantIds: ["lead-1"], summary: "Check completed work", notes: "One work log reviewed", result: "pass",
    mentorId: null, requestedById: null,
  };
  const draft = await requestApi<{ item: BootstrapPayload["reports"][number] }>("/qa-reports/submit", {
    method: "POST", body: JSON.stringify({ ...reportPayload, status: "draft" }),
  }, undefined, "mentor-1");
  expect(draft.item).toMatchObject({ requestedById: "student-1", mentorId: "mentor-1" });
  expect((await read()).qaRequests[0].id).toBe(studentRequest.id);
  expect((await read()).tasks[0].status).toBe("waiting-for-qa");
  const reviewed = await requestApi<{ item: BootstrapPayload["reports"][number] }>("/qa-reports/submit", {
    method: "POST", body: JSON.stringify({ ...reportPayload, mentorId: "lead-1", requestedById: "lead-1", status: "reviewed" }),
  }, undefined, "mentor-1");
  expect(reviewed.item).toMatchObject({ requestedById: "student-1", mentorId: "mentor-1", reviewedById: "mentor-1" });
  expect((await read()).qaRequests.map((request) => request.id)).toEqual([unrelatedRequest.id]);
  expect((await read()).tasks[0].status).toBe("complete");

  await requestApi("/tasks/task-1", { method: "PATCH", body: JSON.stringify({ status: "in-progress" }) });
  await requestApi("/tasks/task-1", { method: "PATCH", body: JSON.stringify({ assigneeIds: ["student-1", "lead-1"] }) });
  const leadRequest = await createQaRequestRecord(payload, undefined, "lead-1");
  expect(leadRequest.id).not.toBe(studentRequest.id);
  expect(leadRequest.requestedById).toBe("lead-1");
  expect((await requestApi<BootstrapPayload>("/bootstrap")).qaRequests).toHaveLength(2);

  await requestApi("/qa-reports/submit", { method: "POST", body: JSON.stringify({ ...reportPayload, result: "minor-fix", status: "reviewed" }) }, undefined, "mentor-1");
  expect((await read()).qaRequests.map((request) => request.id)).toEqual([unrelatedRequest.id]);
  expect((await read()).tasks[0].status).toBe("in-progress");
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("does not publish a partial task transition when a local QA review is invalid", async () => {
  const tutorialSeed = createBootstrap();
  tutorialSeed.tasks[0] = { ...tutorialSeed.tasks[0], assigneeIds: ["student-1"], mentorId: "mentor-1", status: "in-progress", isBlocked: false, isWaitingOnDependency: false };
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(tutorialSeed)));
  await requestApi("/tutorial/session/start", { method: "POST" });
  const payload = { projectId: "project-a", targetRefs: [{ kind: "task" as const, id: "task-1" }], subject: "QA request", mentorId: "mentor-1" };
  const request = await createQaRequestRecord(payload, undefined, "student-1");

  await expect(requestApi("/qa-reports/submit", { method: "POST", body: JSON.stringify({
    reportType: "qa", projectId: "project-a", targetRefs: payload.targetRefs, participantIds: ["missing-member"],
    summary: "Invalid review", notes: "Must not publish", result: "pass", status: "reviewed",
  }) }, undefined, "mentor-1")).rejects.toThrow("An assigned person is no longer in the local roster.");

  const after = await read();
  expect(after.qaRequests.map((item) => item.id)).toEqual([request.id]);
  expect(after.tasks[0].status).toBe("waiting-for-qa");
  expect(after.reports).toHaveLength(tutorialSeed.reports.length);
});

it("rejects a task QA request without an authorized actual actor", async () => {
  const tutorialSeed = createBootstrap();
  tutorialSeed.tasks[0] = { ...tutorialSeed.tasks[0], assigneeIds: ["student-1"], mentorId: "mentor-1", status: "in-progress" };
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(tutorialSeed)));
  await requestApi("/tutorial/session/start", { method: "POST" });
  const payload = { projectId: "project-a", targetRefs: [{ kind: "task" as const, id: "task-1" }], subject: "QA request", mentorId: "mentor-1", requestedById: "lead-1" };

  await expect(createQaRequestRecord(payload)).rejects.toMatchObject({ statusCode: 403 });
  await expect(createQaRequestRecord({ ...payload, targetRefs: [{ kind: "task", id: "missing-task" }] } as never, undefined, "lead-1")).rejects.toMatchObject({ statusCode: 404 });
  await requestApi("/tasks/task-1", { method: "PATCH", body: JSON.stringify({ assigneeIds: ["lead-1"] }) });
  await expect(createQaRequestRecord({ ...payload, mentorId: "missing-mentor" } as never, undefined, "lead-1")).rejects.toMatchObject({ statusCode: 400 });
  await requestApi("/tasks/task-1", { method: "PATCH", body: JSON.stringify({ assigneeIds: [] }) });
  await expect(createQaRequestRecord(payload, undefined, "student-1")).rejects.toMatchObject({ statusCode: 403 });
  expect((await requestApi<BootstrapPayload>("/bootstrap")).qaRequests).toHaveLength(0);
  await expect(createQaRequestRecord(payload, undefined, "lead-1")).rejects.toMatchObject({ statusCode: 403 });
  await requestApi("/tasks/task-1", { method: "PATCH", body: JSON.stringify({ assigneeIds: ["lead-1"] }) });
  await expect(createQaRequestRecord(payload, undefined, "lead-1")).resolves.toMatchObject({ requestedById: "lead-1" });
});

it("does not publish a write if browser storage rejects it", async () => {
  await read();
  storage.setItem.mockImplementationOnce(() => { throw new Error("quota exceeded"); });
  await expect(write("Not saved")).rejects.toThrow("quota exceeded");
  expect((await read()).materials[0].name).toBe("Original");
});

it("retains a team's chosen icon and color after create, edit and reopening the demo", async () => {
  const baseline = createBootstrap();
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(baseline)));
  await read();
  const { item } = await requestApi<{ item: { id: string } }>("/responsible-groups", {
    method: "POST", body: JSON.stringify({ seasonId: baseline.seasons[0].id, name: "Custom team", icon: "wrench", color: "#2A9D8F" }),
  });
  expect((await read()).responsibleGroups.find(team => team.id === item.id)).toMatchObject({ icon: "wrench", color: "#2A9D8F" });
  await requestApi(`/responsible-groups/${item.id}`, { method: "PATCH", body: JSON.stringify({ icon: "megaphone", color: "#C855BC" }) });
  leaveLocalWorkspace(); enterLocalDemo();
  expect((await read()).responsibleGroups.find(team => team.id === item.id)).toMatchObject({ name: "Custom team", icon: "megaphone", color: "#C855BC" });
});

it("rejects unsupported local operations without falling through to a write API", async () => {
  await read();
  const calls = jest.mocked(fetch).mock.calls.length;
  await expect(requestApi("/onshape/sync", { method: "POST" })).rejects.toThrow();
  await expect(requestApi("/auth/preferences", { method: "PATCH" })).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(calls);
});

it("returns to the ordinary transport after leaving the local workspace without uploading its state", async () => {
  await read(); await write("Only local");
  leaveLocalWorkspace();
  await read();
  expect(jest.mocked(fetch).mock.calls.at(-1)?.[0]).toBe("/api/bootstrap");
  expect(jest.mocked(fetch).mock.calls.at(-1)?.[1]?.method).toBeUndefined();
});

it.each([200, 401])("ignores a remote %i completion after entering a local workspace", async (status) => {
  leaveLocalWorkspace();
  let finish!: (response: Response) => void;
  globalThis.fetch = jest.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
  const expire = jest.fn();
  const pending = requestApi("/bootstrap", {}, expire);
  enterLocalDemo();
  finish(new Response(JSON.stringify(seed), { status }));
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(expire).not.toHaveBeenCalled();
});

it("rolls back failed tutorial entry and cancels a seed load after the owner changes", async () => {
  await jest.isolateModulesAsync(async () => {
    const local = await import("../session");
    await expect(local.requestLocalWorkspace("/tutorial/session/start", { method: "POST" }, async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    expect(local.getLocalWorkspaceMode()).toBeNull();
    let finish!: (value: BootstrapPayload) => void;
    local.enterLocalDemo();
    const pending = local.requestLocalWorkspace("/materials/material", { method: "PATCH", body: JSON.stringify({ name: "Stale" }) }, () => new Promise((resolve) => { finish = resolve; }));
    local.leaveLocalWorkspace();
    finish(seed);
    await expect(pending).rejects.toThrow("cancelled");
    expect(data.size).toBe(0);
  });
});

it("Reset demo reloads the current roster baseline instead of retaining the cached examples", async () => {
  await read();
  const updated = structuredClone(seed);
  updated.materials[0].name = "Updated seed";
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(updated)));
  resetLocalDemo();
  expect((await read()).materials[0].name).toBe("Updated seed");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(jest.mocked(fetch).mock.calls[0][1]).toMatchObject({ credentials: "omit" });
});

it("archives an incompatible snapshot intact and starts from the current canonical examples", async () => {
  const incompatible = JSON.stringify({ schemaVersion: 0, baseline: { old: "prototype" }, snapshot: { tasks: [] } });
  data.set("meco.local-demo.v1", incompatible);
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
  await read();
  expect(data.get("meco.local-demo.v1.incompatible.0")).toBe(incompatible);
  expect(JSON.parse(data.get("meco.local-demo.v1")!)).toMatchObject({ schemaVersion: 3 });
  expect((await read()).projects).toEqual(seed.projects);
  expect(warning).toHaveBeenCalledWith(expect.stringContaining("archived as meco.local-demo.v1.incompatible.0"));
  warning.mockRestore();
});

it.each([1, 2])("archives schema-%s demo snapshots before reading groups without required identity fields", async (schemaVersion) => {
  const baseline = createBootstrap();
  baseline.responsibleGroups.push({
    id: "legacy-team", seasonId: baseline.seasons[0]?.id ?? "season", name: "Legacy Team", icon: "users", color: "#4F86C6",
    projectIds: [], workTypeIds: [], memberIds: [], primaryMemberIds: [], isArchived: false,
  });
  const snapshot = structuredClone(baseline);
  delete (baseline.responsibleGroups[0] as unknown as { primaryMemberIds?: string[] }).primaryMemberIds;
  delete (snapshot.responsibleGroups[0] as unknown as { primaryMemberIds?: string[] }).primaryMemberIds;
  delete (baseline.responsibleGroups[0] as unknown as { icon?: string }).icon;
  delete (snapshot.responsibleGroups[0] as unknown as { color?: string }).color;
  const legacy = JSON.stringify({ schemaVersion, baseline, snapshot });
  data.set("meco.local-demo.v1", legacy);
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});

  await read();

  expect(data.get(`meco.local-demo.v1.incompatible.${schemaVersion}`)).toBe(legacy);
  expect(JSON.parse(data.get("meco.local-demo.v1")!).schemaVersion).toBe(3);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(warning).toHaveBeenCalledWith(expect.stringContaining(`incompatible.${schemaVersion}`));
  warning.mockRestore();
});

it("derives cached task hours from logs across reload and tutorial entry", async () => {
  const snapshot = createBootstrap();
  snapshot.tasks[0].actualHours = 999;
  const taskId = snapshot.tasks[0].id;
  const expected = snapshot.workLogs.filter((log) => log.taskId === taskId).reduce((sum, log) => sum + log.hours, 0);
  data.set("meco.local-demo.v1", JSON.stringify({ schemaVersion: 3, baseline: snapshot, snapshot }));
  expect((await read()).tasks[0].actualHours).toBe(expected);
  leaveLocalWorkspace(); enterLocalDemo();
  expect((await read()).tasks[0].actualHours).toBe(expected);
  await requestApi("/tutorial/session/start", { method: "POST" });
  expect((await read()).tasks[0].actualHours).toBe(expected);
  expect(fetch).not.toHaveBeenCalled();
});

it("keeps individual part locations, Task manufacturing details and dependency links across reload", async () => {
  const baseline = createBootstrap();
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(baseline)));
  await read();
  const create = async (resource: string, body: object) => requestApi<{ item: { id: string } }>(`/${resource}`, {
    method: "POST", body: JSON.stringify(body),
  });
  const part = baseline.partInstances[0];
  const first = await create("part-instances", {
    ...part,
    id: undefined,
    location: { kind: "stock", location: "Bin A" },
  });
  const second = await create("part-instances", {
    ...part,
    id: undefined,
    location: { kind: "repair", location: "Bench 2" },
  });
  expect(first.item.id).not.toBe(second.item.id);
  const task = await create("tasks", {
    ...baseline.tasks[0], title: "Manufacture and inspect brackets",
    partInstanceIds: [second.item.id, first.item.id],
    manufacturingDetails: {
      part: { kind: "part-definition", partDefinitionId: part.partDefinitionId },
      quantity: 2,
      processId: "cnc",
      fulfillmentSource: "in-house",
      material: { kind: "specified-material", name: "Aluminum 6061" },
      fileArtifactIds: [],
      tolerances: ["±0.2 mm"],
      qaRequirements: ["Verify hole spacing"],
    },
  });
  const dependency = await create("task-dependencies", {
    taskId: task.item.id, kind: "part-instance", refId: second.item.id,
    requiredCondition: { kind: "physical-location", value: "repair" }, dependencyType: "hard",
  });
  leaveLocalWorkspace(); enterLocalDemo();
  const reloaded = await read();
  const ids = [first.item.id, second.item.id];
  const parts = reloaded.partInstances.filter((candidate) => ids.includes(candidate.id));
  expect(parts.map((candidate) => [candidate.id, candidate.location])).toEqual([
    [first.item.id, { kind: "stock", location: "Bin A" }],
    [second.item.id, { kind: "repair", location: "Bench 2" }],
  ]);
  expect(reloaded.tasks.find((candidate) => candidate.id === task.item.id)).toMatchObject({
    partInstanceIds: [second.item.id, first.item.id],
    manufacturingDetails: {
      part: { kind: "part-definition", partDefinitionId: part.partDefinitionId },
      fulfillmentSource: "in-house",
      processId: "cnc",
    },
  });
  expect(reloaded).not.toHaveProperty("manufacturingItems");
  expect(reloaded.taskDependencies?.find((candidate) => candidate.id === dependency.item.id)).toMatchObject({
    kind: "part-instance",
    refId: second.item.id,
    requiredCondition: { kind: "physical-location", value: "repair" },
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});
