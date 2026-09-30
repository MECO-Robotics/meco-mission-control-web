import type { BootstrapPayload } from "@/types/bootstrap";
import { isTaskDependencySatisfied } from "@/features/workspace/shared/task/taskPlanningInternals";

type CollectionKey = Exclude<keyof BootstrapPayload, "x_contract">;
type Row = Record<string, unknown> & { id: string };

const collections: Record<string, CollectionKey> = {
  seasons: "seasons", projects: "projects", "work-types": "workTypes", "responsible-groups": "responsibleGroups",
  workstreams: "workstreams", vendors: "vendors", members: "members", tasks: "tasks",
  "task-dependencies": "taskDependencies", "manufacturing/processes": "manufacturingProcesses",
  purchases: "purchaseItems", materials: "materials", "part-definitions": "partDefinitions",
  "part-instances": "partInstances", meetings: "meetings", events: "events", milestones: "milestones",
  risks: "risks", reports: "reports", "qa-requests": "qaRequests", "qa-findings": "qaFindings",
  "test-results": "testResults", "test-findings": "testFindings", artifacts: "artifacts",
  "work-logs": "workLogs", "attendance-records": "attendanceRecords", "milestone-requirements": "milestoneRequirements",
};

const memberFields = new Set([
  "ownerId", "mentorId", "responsibleEngineerId", "createdByMemberId", "createdById", "requestedById",
  "reviewedById", "approvedById", "actorMemberId", "memberId",
]);
const memberListFields = new Set(["assigneeIds", "mentorIds", "participantIds", "memberIds"]);

function validateRosterReferences(snapshot: BootstrapPayload, item: Row) {
  const memberIds = new Set(snapshot.members.map(({ id }) => id));
  for (const [field, value] of Object.entries(item)) {
    if (memberFields.has(field) && value != null && value !== "" && !memberIds.has(String(value))) {
      throw new Error("The selected person is no longer in the local roster. Choose a current roster member.");
    }
    if (memberListFields.has(field) && (!Array.isArray(value) || value.some((id) => typeof id !== "string" || !memberIds.has(id)))) {
      throw new Error("An assigned person is no longer in the local roster. Choose current roster members.");
    }
  }
}

function newLocalId() {
  return `local-${Array.from(crypto.getRandomValues(new Uint32Array(4)), (part) => part.toString(16).padStart(8, "0")).join("")}`;
}

export function refreshLocalTaskState(snapshot: BootstrapPayload) {
  const loggedHours = new Map<string, number>();
  for (const log of snapshot.workLogs) loggedHours.set(log.taskId, (loggedHours.get(log.taskId) ?? 0) + log.hours);
  for (const task of snapshot.tasks) {
    task.actualHours = loggedHours.get(task.id) ?? 0;
    task.isBlocked = snapshot.risks.some((risk) => risk.projectId === task.projectId && risk.blocksWork && risk.status !== "resolved" && risk.relatedTargets.some((target) => target.kind === "task" && target.id === task.id));
    task.isWaitingOnDependency = task.status !== "complete" && snapshot.taskDependencies.some((dependency) =>
      dependency.taskId === task.id && dependency.dependencyType === "hard" && !isTaskDependencySatisfied(dependency, snapshot),
    );
  }
}

function defaults(resource: string, snapshot: BootstrapPayload): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);
  switch (resource) {
    case "seasons": return { type: "season", startDate: today, endDate: today };
    case "projects": return { description: "", status: "planned" };
    case "members": return { email: "", elevated: false, role: "student", activeSeasonIds: [], plannedAttendanceDays: [] };
    case "subsystems": return { isCore: false, iteration: 1, mentorIds: [], parentSubsystemId: null, responsibleEngineerId: null };
    case "tasks": return {
      projectId: snapshot.projects[0]?.id ?? "", workTypeId: "", responsibleGroupId: null, workstreamIds: [], title: "", summary: "",
      subsystemIds: [], mechanismIds: [], partInstanceIds: [], scheduleRefs: [], requestedById: null, ownerId: null, assigneeIds: [], mentorId: null,
      startDate: today, dueDate: today, priority: "medium", status: "not-started", checklistItems: [], manufacturingDetails: null,
      estimatedHours: 0, actualHours: 0, requiresDocumentation: false,
    };
    case "task-dependencies": return { createdAt: new Date().toISOString() };
    case "meetings": case "events": return { projectIds: [], endAt: null, location: "", description: "" };
    case "milestones": return { projectIds: [], endAt: null, status: "planned", description: "" };
    default: return {};
  }
}

function removeReferences(snapshot: BootstrapPayload, resource: string, id: string) {
  if (resource === "part-definitions") snapshot.partInstances = snapshot.partInstances.filter((part) => part.partDefinitionId !== id);
  if (resource === "tasks") {
    snapshot.taskDependencies = snapshot.taskDependencies.filter((dependency) => dependency.taskId !== id);
    snapshot.workLogs = snapshot.workLogs.filter((log) => log.taskId !== id);
    snapshot.purchaseItems = snapshot.purchaseItems.filter((item) => item.taskId !== id);
    for (const risk of snapshot.risks) if (risk.mitigationTaskId === id) risk.mitigationTaskId = null;
  }
  if (resource === "members") {
    snapshot.attendanceRecords = snapshot.attendanceRecords.filter((record) => record.memberId !== id);
    for (const collection of Object.values(snapshot)) {
      if (!Array.isArray(collection)) continue;
      for (const record of collection as unknown as Record<string, unknown>[]) {
        for (const field of memberFields) if (record[field] === id) record[field] = null;
        for (const field of memberListFields) if (Array.isArray(record[field])) record[field] = (record[field] as unknown[]).filter((memberId) => memberId !== id);
      }
    }
  }
  const kind = ({ tasks: "task", "part-instances": "part-instance", "part-definitions": "part-definition", materials: "material", artifacts: "artifact", milestones: "milestone", meetings: "meeting", events: "event", risks: "risk", "workstreams": "workstream", vendors: "vendor" } as Record<string, string>)[resource];
  if (kind) {
    for (const record of [...snapshot.reports, ...snapshot.qaFindings, ...snapshot.testFindings, ...snapshot.testResults, ...snapshot.artifacts, ...snapshot.milestoneRequirements, ...snapshot.risks]) {
      if ("targetRefs" in record && Array.isArray(record.targetRefs)) record.targetRefs = record.targetRefs.filter((target) => target.kind !== kind || target.id !== id);
      if ("relatedTargets" in record && Array.isArray(record.relatedTargets)) record.relatedTargets = record.relatedTargets.filter((target) => target.kind !== kind || target.id !== id);
    }
    for (const task of snapshot.tasks) {
      task.scheduleRefs = task.scheduleRefs.filter((reference) => reference.kind !== kind || reference.id !== id);
      task.partInstanceIds = task.partInstanceIds.filter((targetId) => kind !== "part-instance" || targetId !== id);
      task.subsystemIds = task.subsystemIds.filter((targetId) => kind !== "subsystem" || targetId !== id);
      task.mechanismIds = task.mechanismIds.filter((targetId) => kind !== "mechanism" || targetId !== id);
    }
  }
}

/** Applies browser workspace commands only. Caller clones and persists the draft atomically. */
export function applyLocalCommand(snapshot: BootstrapPayload, path: string, options: RequestInit = {}): unknown {
  const pathname = path.split("?")[0].replace(/^\/api\//, "").replace(/^\//, "");
  const method = (options.method ?? "GET").toUpperCase();
  const body: Record<string, unknown> = typeof options.body === "string" ? JSON.parse(options.body) : {};
  if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("Expected a JSON command object.");

  const parts = pathname.split("/");
  const resource = parts[0] === "manufacturing" && parts[1] === "processes" ? "manufacturing/processes" : parts[0];
  const encodedId = resource === "manufacturing/processes" ? parts[2] : parts[1];
  const extra = resource === "manufacturing/processes" ? parts[3] : parts[2];
  if (extra || !(resource in collections)) throw new Error(`This local workspace does not support ${method} /${pathname}; nothing was synced.`);
  const key = collections[resource];
  const rows = snapshot[key] as unknown as Row[];
  const id = encodedId ? decodeURIComponent(encodedId) : undefined;
  const index = rows.findIndex((row) => row.id === id);
  if (id && index < 0) throw new Error(`The ${resource} record no longer exists in this local workspace.`);
  if (method === "GET") return id ? { item: rows[index] } : { items: rows };
  if (!((method === "POST" && !id) || ((method === "PATCH" || method === "DELETE") && id))) throw new Error(`This local workspace does not support ${method} /${pathname}; nothing was synced.`);

  if (method === "DELETE") {
    const [removed] = rows.splice(index, 1);
    removeReferences(snapshot, resource, removed.id);
    refreshLocalTaskState(snapshot);
    return { item: removed };
  }

  const item = { ...(method === "POST" ? defaults(resource, snapshot) : rows[index]), ...body, id: id ?? newLocalId() } as Row;
  validateRosterReferences(snapshot, item);
  if (resource === "tasks") {
    const removedFields = ["disciplineId", "blockers", "linkedManufacturingIds", "linkedPurchaseIds", "artifactIds"];
    if (removedFields.some((field) => Object.hasOwn(body, field))) throw new Error("Task commands use workTypeId, scheduleRefs, and typed domain references; removed Task fields are not accepted.");
    delete item.taskDependencies;
    delete item.actualHours;
    if (item.status === "complete") {
      refreshLocalTaskState(snapshot);
      const existing = snapshot.tasks.find((task) => task.id === id);
      if (existing?.isBlocked || existing?.isWaitingOnDependency) throw new Error("Resolve Risks and required dependencies before completing this task.");
    }
  }
  if (resource === "work-logs") {
    if (!snapshot.tasks.some((task) => task.id === item.taskId)) throw new Error("The work log Task no longer exists.");
    if (typeof item.hours !== "number" || !Number.isFinite(item.hours) || item.hours <= 0) throw new Error("Work log hours must be a positive number.");
  }
  if (resource === "task-dependencies" && !snapshot.tasks.some((task) => task.id === item.taskId)) throw new Error("Dependency Task does not exist.");
  if (resource === "purchases" && !snapshot.tasks.some((task) => task.id === item.taskId)) throw new Error("Purchasing records must link to a procurement or manufacturing Task.");
  if (method === "POST") rows.push(item); else rows[index] = item;
  refreshLocalTaskState(snapshot);
  return { item };
}
