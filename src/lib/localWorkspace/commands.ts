import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

const collections = {
  seasons: "seasons", projects: "projects", workstreams: "workstreams", members: "members",
  materials: "materials", artifacts: "artifacts", subsystems: "subsystems", mechanisms: "mechanisms",
  "part-definitions": "partDefinitions", "part-instances": "partInstances",
  milestones: "milestones", "milestone-requirements": "milestoneRequirements", meetings: "meetings",
  tasks: "tasks", "task-dependencies": "taskDependencies", "task-blockers": "taskBlockers",
  reports: "reports", risks: "risks", "work-logs": "workLogs",
  purchases: "purchaseItems", manufacturing: "manufacturingItems",
} as const satisfies Record<string, keyof BootstrapPayload>;
type Row = Record<string, unknown> & { id: string };

// These are roster foreign keys across planning, reports, work logs and inventory.
const memberFields = new Set([
  "ownerId", "mentorId", "responsibleEngineerId", "createdByMemberId", "createdById",
  "requestedById", "requestedByMemberId", "reviewedById", "approvedById", "actorMemberId", "memberId",
]);
const memberListFields = new Set(["assigneeIds", "mentorIds", "participantIds", "memberIds"]);

function validateRosterReferences(snapshot: BootstrapPayload, item: Row) {
  const memberIds = new Set(snapshot.members.map((member) => member.id));
  for (const [field, value] of Object.entries(item)) {
    if (memberFields.has(field) && value != null && value !== "" && !memberIds.has(String(value))) {
      throw new Error("The selected person is no longer in the local roster. Choose a current roster member.");
    }
    if (memberListFields.has(field) && (!Array.isArray(value) || value.some((id) => typeof id !== "string" || !memberIds.has(id)))) {
      throw new Error("An assigned person is no longer in the local roster. Choose current roster members.");
    }
  }
}

// getRandomValues also works on HTTP Meshnet hosts, unlike randomUUID.
function newLocalId() {
  return `local-${Array.from(crypto.getRandomValues(new Uint32Array(4)), (part) => part.toString(16).padStart(8, "0")).join("")}`;
}

function refreshTasks(snapshot: BootstrapPayload) {
  for (const task of snapshot.tasks) {
    task.blockers = [...new Set((snapshot.taskBlockers ?? [])
      .filter((blocker) => blocker.blockedTaskId === task.id && blocker.status === "open")
      .map((blocker) => blocker.description))];
    task.isBlocked = (snapshot.taskBlockers ?? []).some((b) => b.blockedTaskId === task.id && b.status === "open");
    task.isWaitingOnDependency = task.status !== "complete" && (snapshot.taskDependencies ?? []).some((dependency) => {
      if (dependency.taskId !== task.id || dependency.dependencyType !== "hard") return false;
      const targets = dependency.kind === "task" ? snapshot.tasks : dependency.kind === "milestone" ? snapshot.milestones : snapshot.partInstances;
      const target = targets.find((candidate) => candidate.id === dependency.refId);
      if (!target) return true;
      if (dependency.kind === "task") return target.status !== dependency.requiredState;
      const order: Record<string, number> = { "not ready": 0, blocked: 1, qa: 2, ready: 3 };
      return !(order[target.status ?? "not ready"] >= order[dependency.requiredState]);
    });
    task.planningState = task.isBlocked ? "blocked" : task.isWaitingOnDependency ? "waiting-on-dependency" : "ready";
  }
}

function defaults(resource: string, snapshot: BootstrapPayload): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);
  switch (resource) {
    case "seasons": return { type: "season", startDate: today, endDate: today };
    case "projects": return { description: "", status: "active" };
    case "members": return { email: "", elevated: false, role: "student", activeSeasonIds: [], plannedAttendanceDays: [] };
    case "subsystems": return { isCore: false, iteration: 1, mentorIds: [], risks: [], parentSubsystemId: null, responsibleEngineerId: null };
    case "tasks": return {
      projectId: snapshot.projects[0]?.id ?? "", workstreamId: null, workstreamIds: [], summary: "",
      subsystemId: "", subsystemIds: [], disciplineId: "", mechanismId: null, mechanismIds: [],
      partInstanceId: null, partInstanceIds: [], artifactId: null, artifactIds: [], targetMilestoneId: null,
      ownerId: null, assigneeIds: [], mentorId: null, startDate: today, dueDate: today, priority: "medium",
      status: "not-started", blockers: [], linkedManufacturingIds: [], linkedPurchaseIds: [],
      estimatedHours: 0, actualHours: 0, requiresDocumentation: false, documentationLinked: false,
    };
    case "task-dependencies": return { createdAt: new Date().toISOString() };
    case "task-blockers": return { status: "open", createdAt: new Date().toISOString(), resolvedAt: null, createdByMemberId: null, blockerId: null };
    case "meetings": return { rsvpsYes: 0, rsvpsMaybe: 0, openSignIns: 0 };
    default: return {};
  }
}

function removeReferences(snapshot: BootstrapPayload, resource: string, id: string) {
  if (resource === "part-definitions") {
    const instances = snapshot.partInstances.filter((part) => part.partDefinitionId === id);
    snapshot.partInstances = snapshot.partInstances.filter((part) => part.partDefinitionId !== id);
    for (const part of instances) removeReferences(snapshot, "part-instances", part.id);
  }
  const referenceFields: Record<string, [string, string?]> = {
    mechanisms: ["mechanismId", "mechanismIds"], "part-instances": ["partInstanceId", "partInstanceIds"],
    "part-definitions": ["partDefinitionId"], artifacts: ["artifactId", "artifactIds"],
    materials: ["materialId"], milestones: ["targetMilestoneId"], risks: ["targetRiskId"],
  };
  const fields = referenceFields[resource];
  if (fields) {
    for (const collection of Object.values(snapshot)) {
      if (!Array.isArray(collection)) continue;
      for (const record of collection as unknown as Record<string, unknown>[]) {
        const [single, multiple] = fields;
        if (multiple && Array.isArray(record[multiple])) record[multiple] = (record[multiple] as unknown[]).filter((value) => value !== id);
        if (record[single] === id) record[single] = multiple ? (record[multiple] as unknown[] | undefined)?.[0] ?? null : null;
      }
    }
  }
  if (resource === "milestones") {
    snapshot.milestoneRequirements = (snapshot.milestoneRequirements ?? []).filter((requirement) => requirement.milestoneId !== id);
    snapshot.reports = snapshot.reports.filter((report) => report.milestoneId !== id);
  }
  if (resource === "tasks") {
    snapshot.taskDependencies = (snapshot.taskDependencies ?? []).filter((d) => d.taskId !== id);
    snapshot.taskBlockers = (snapshot.taskBlockers ?? []).filter((b) => b.blockedTaskId !== id);
    snapshot.workLogs = snapshot.workLogs.filter((log) => log.taskId !== id);
    snapshot.qaRequests = snapshot.qaRequests.filter((request) => request.taskId !== id);
    for (const report of snapshot.reports) if (report.taskId === id) report.taskId = null;
    for (const risk of snapshot.risks) if (risk.mitigationTaskId === id) risk.mitigationTaskId = null;
  }
  if (resource === "members") {
    snapshot.attendanceRecords = (snapshot.attendanceRecords ?? []).filter((record) => record.memberId !== id);
    snapshot.qaRequests = snapshot.qaRequests.filter((request) => request.mentorId !== id);
    for (const collection of Object.values(snapshot)) {
      if (!Array.isArray(collection)) continue;
      for (const record of collection as unknown as Record<string, unknown>[]) {
        for (const field of memberFields) if (record[field] === id) record[field] = null;
        for (const field of memberListFields) {
          if (Array.isArray(record[field])) record[field] = record[field].filter((memberId: unknown) => memberId !== id);
        }
      }
    }
  }
}

/** Applies browser workspace commands only. Caller clones and persists the draft atomically. */
export function applyLocalCommand(snapshot: BootstrapPayload, path: string, options: RequestInit = {}): unknown {
  const pathname = path.split("?")[0].replace(/^\/api\//, "/");
  const method = (options.method ?? "GET").toUpperCase();
  const body: Record<string, unknown> = typeof options.body === "string" ? JSON.parse(options.body) : {};
  if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("Expected a JSON command object.");
  if (pathname.startsWith("/navigation/favorites/") && method === "PATCH") {
    const viewId = decodeURIComponent(pathname.slice("/navigation/favorites/".length));
    snapshot.favoriteViews = (snapshot.favoriteViews ?? []).filter((favorite) => favorite.viewId !== viewId);
    if (body.isFavorite) snapshot.favoriteViews.push({ id: newLocalId(), userKey: "local", viewId, createdAt: new Date().toISOString() });
    return { favoriteViews: snapshot.favoriteViews };
  }
  const [, resource, encodedId, extra] = pathname.split("/");
  if (extra || !(resource in collections)) throw new Error(`This local workspace does not support ${method} ${pathname}; nothing was synced.`);
  const key = collections[resource as keyof typeof collections];
  const rows = (snapshot[key] ?? []) as unknown as Row[];
  // Optional bootstrap collections are initialized only when their command is supported.
  (snapshot as unknown as Record<string, unknown>)[key] = rows;
  const id = encodedId ? decodeURIComponent(encodedId) : undefined;
  const index = rows.findIndex((row) => row.id === id);
  if (id && index < 0) throw new Error(`The ${resource} record no longer exists in this local workspace.`);
  if (method === "GET") return id ? { item: rows[index] } : { items: rows };
  if (!((method === "POST" && !id) || ((method === "PATCH" || method === "DELETE") && id))) {
    throw new Error(`This local workspace does not support ${method} ${pathname}; nothing was synced.`);
  }
  let item: Row;
  if (method === "DELETE") {
    item = rows.splice(index, 1)[0];
    removeReferences(snapshot, resource, item.id);
  } else {
    item = { ...(method === "POST" ? defaults(resource, snapshot) : rows[index]), ...body, id: id ?? newLocalId() };
    validateRosterReferences(snapshot, item);
    if (resource === "tasks") {
      delete item.taskDependencies;
      delete item.taskBlockers;
      delete item.blockers;
      const task = item as unknown as TaskRecord;
      if (task.status === "complete") {
        const existing = snapshot.tasks.find((candidate) => candidate.id === id);
        refreshTasks(snapshot);
        if (existing?.isBlocked || existing?.isWaitingOnDependency) throw new Error("Resolve blockers and required dependencies before completing this task.");
      }
    }
    if (resource === "task-dependencies" && !snapshot.tasks.some((task) => task.id === item.taskId)) throw new Error("Dependency task does not exist.");
    if (resource === "task-blockers") {
      if (!snapshot.tasks.some((task) => task.id === item.blockedTaskId)) throw new Error("Blocked task does not exist.");
      item.sourceKind = body.blockerType ?? item.sourceKind ?? "external";
      item.blockerType = body.issueType ?? item.issueType ?? item.blockerType;
      item.resolvedAt = item.status === "resolved" ? item.resolvedAt ?? new Date().toISOString() : null;
    }
    if (resource === "meetings") {
      item.date = String(item.startDateTime ?? "").slice(0, 10);
      item.time = String(item.startDateTime ?? "").slice(11, 16);
    }
    if (resource === "reports") {
      if ((item.proposedRiskSeverity || item.proposedRiskStatus) && !item.targetRiskId) throw new Error("A risk reassessment requires a target risk.");
      const risk = snapshot.risks.find((candidate) => candidate.id === item.targetRiskId);
      if (item.targetRiskId && !risk) throw new Error("The target risk does not exist.");
      if (item.reportType === "QA") {
        const task = snapshot.tasks.find((candidate) => candidate.id === item.taskId);
        if (!task) throw new Error("QA reports require an existing task.");
        item.projectId = task.projectId;
        item.workstreamId = task.workstreamId;
        item.title = task.title;
        item.summary = item.notes ?? "";
        item.reviewedAt = item.reviewedAt ?? item.createdAt ?? new Date().toISOString();
        item.createdAt = item.reviewedAt;
        if (risk && item.mentorApproved) {
          risk.severity = item.proposedRiskStatus === "full-mitigation" ? "low" : (item.proposedRiskSeverity as typeof risk.severity | undefined) ?? risk.severity;
          risk.mitigationTaskId = risk.mitigationTaskId ?? task.id;
        }
      }
    }
    if (method === "POST") rows.push(item); else rows[index] = item;
  }
  snapshot.qaReports = snapshot.reports.filter((report) => report.reportType === "QA");
  snapshot.testResults = snapshot.reports.filter((report) => report.reportType === "MilestoneTest");
  refreshTasks(snapshot);
  if (resource === "task-blockers") return { item: { ...item, blockerType: item.sourceKind ?? "external", issueType: item.blockerType } };
  return { item };
}
