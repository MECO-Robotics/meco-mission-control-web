import type {
  ArtifactPayload,
  ArtifactRecord,
  EventPayload,
  EventRecord,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MaterialPayload,
  MaterialRecord,
  MechanismPayload,
  MechanismRecord,
  MemberCreatePayload,
  MemberPayload,
  MemberRecord,
  PartDefinitionPayload,
  PartDefinitionRecord,
  PartInstancePayload,
  PartInstanceRecord,
  ProjectCreatePayload,
  ProjectPayload,
  ProjectRecord,
  PurchaseItemPayload,
  PurchaseItemRecord,
  ReportFindingPayload,
  ReportFindingRecord,
  ReportPayload,
  ReportRecord,
  QaReportPayload,
  RiskPayload,
  RiskRecord,
  SeasonCreatePayload,
  SeasonRecord,
  SubsystemPayload,
  SubsystemRecord,
  TaskBlockerPayload,
  TaskBlockerRecord,
  TaskDependencyPayload,
  TaskDependencyRecord,
  TaskPayload,
  TaskRecord,
  TestResultPayload,
  WorkLogPayload,
  WorkLogRecord,
  WorkstreamPayload,
  WorkstreamRecord,
} from "@/types";
import { requestApi } from "./core";

async function requestItem<TItem, TPayload>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  payload?: TPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TItem }>(
    path,
    method === "DELETE"
      ? { method }
      : {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
    onUnauthorized,
  );

  return response.item;
}

async function requestItems<TItem>(path: string, onUnauthorized?: () => void) {
  const response = await requestApi<{ items: TItem[] }>(path, {}, onUnauthorized);
  return response.items;
}

export function createTask(payload: TaskPayload, onUnauthorized?: () => void) {
  return requestItem<TaskRecord, TaskPayload>("/tasks", "POST", payload, onUnauthorized);
}

export function createEventRecord(payload: EventPayload, onUnauthorized?: () => void) {
  return requestItem<EventRecord, EventPayload>("/events", "POST", payload, onUnauthorized);
}

export function updateEventRecord(
  eventId: string,
  payload: Partial<EventPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<EventRecord, Partial<EventPayload>>(
    `/events/${eventId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteEventRecord(eventId: string, onUnauthorized?: () => void) {
  return requestItem<EventRecord, never>(`/events/${eventId}`, "DELETE", undefined, onUnauthorized);
}

export function createWorkLogRecord(
  payload: WorkLogPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<WorkLogRecord, WorkLogPayload>("/work-logs", "POST", payload, onUnauthorized);
}

export function createReportRecord(
  payload: ReportPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ReportRecord, ReportPayload>("/reports", "POST", payload, onUnauthorized);
}

export function createReportFindingRecord(
  payload: ReportFindingPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ReportFindingRecord, ReportFindingPayload>(
    "/report-findings",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function createQaReportRecord(
  payload: QaReportPayload,
  onUnauthorized?: () => void,
) {
  return createReportRecord(payload, onUnauthorized);
}

export function createTestResultRecord(
  payload: TestResultPayload,
  onUnauthorized?: () => void,
) {
  return createReportRecord(payload, onUnauthorized);
}

export function createRiskRecord(payload: RiskPayload, onUnauthorized?: () => void) {
  return requestItem<RiskRecord, RiskPayload>("/risks", "POST", payload, onUnauthorized);
}

export function updateRiskRecord(
  riskId: string,
  payload: Partial<RiskPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<RiskRecord, Partial<RiskPayload>>(
    `/risks/${riskId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteRiskRecord(riskId: string, onUnauthorized?: () => void) {
  return requestItem<RiskRecord, never>(`/risks/${riskId}`, "DELETE", undefined, onUnauthorized);
}

export function createSubsystemRecord(
  payload: SubsystemPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<SubsystemRecord, SubsystemPayload>(
    "/subsystems",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateSubsystemRecord(
  subsystemId: string,
  payload: Partial<SubsystemPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<SubsystemRecord, Partial<SubsystemPayload>>(
    `/subsystems/${subsystemId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function createMechanismRecord(
  payload: MechanismPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<MechanismRecord, MechanismPayload>(
    "/mechanisms",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateMechanismRecord(
  mechanismId: string,
  payload: Partial<MechanismPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<MechanismRecord, Partial<MechanismPayload>>(
    `/mechanisms/${mechanismId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteMechanismRecord(
  mechanismId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<MechanismRecord, never>(
    `/mechanisms/${mechanismId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}

export function updateTaskRecord(
  taskId: string,
  payload: Partial<TaskPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskRecord, Partial<TaskPayload>>(
    `/tasks/${taskId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteTaskRecord(taskId: string, onUnauthorized?: () => void) {
  return requestItem<TaskRecord, never>(`/tasks/${taskId}`, "DELETE", undefined, onUnauthorized);
}

export function createTaskDependencyRecord(
  payload: TaskDependencyPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskDependencyRecord, TaskDependencyPayload>(
    "/task-dependencies",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateTaskDependencyRecord(
  dependencyId: string,
  payload: Partial<TaskDependencyPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskDependencyRecord, Partial<TaskDependencyPayload>>(
    `/task-dependencies/${dependencyId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteTaskDependencyRecord(
  dependencyId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskDependencyRecord, never>(
    `/task-dependencies/${dependencyId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}

export function createTaskBlockerRecord(
  payload: TaskBlockerPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskBlockerRecord, TaskBlockerPayload>(
    "/task-blockers",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateTaskBlockerRecord(
  blockerId: string,
  payload: Partial<TaskBlockerPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskBlockerRecord, Partial<TaskBlockerPayload>>(
    `/task-blockers/${blockerId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteTaskBlockerRecord(
  blockerId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskBlockerRecord, never>(
    `/task-blockers/${blockerId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}

export function createSeasonRecord(
  payload: SeasonCreatePayload,
  onUnauthorized?: () => void,
) {
  return requestItem<SeasonRecord, SeasonCreatePayload>(
    "/seasons",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function createProjectRecord(
  payload: ProjectCreatePayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ProjectRecord, ProjectCreatePayload>(
    "/projects",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateProjectRecord(
  projectId: string,
  payload: Partial<ProjectPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<ProjectRecord, Partial<ProjectPayload>>(
    `/projects/${projectId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function createMemberRecord(
  payload: MemberCreatePayload,
  onUnauthorized?: () => void,
) {
  return requestItem<MemberRecord, MemberCreatePayload>(
    "/members",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateMemberRecord(
  memberId: string,
  payload: Partial<MemberPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<MemberRecord, Partial<MemberPayload>>(
    `/members/${memberId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteMemberRecord(memberId: string, onUnauthorized?: () => void) {
  return requestItem<MemberRecord, never>(`/members/${memberId}`, "DELETE", undefined, onUnauthorized);
}

export function createMaterialRecord(
  payload: MaterialPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<MaterialRecord, MaterialPayload>(
    "/materials",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateMaterialRecord(
  materialId: string,
  payload: Partial<MaterialPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<MaterialRecord, Partial<MaterialPayload>>(
    `/materials/${materialId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteMaterialRecord(materialId: string, onUnauthorized?: () => void) {
  return requestItem<MaterialRecord, never>(`/materials/${materialId}`, "DELETE", undefined, onUnauthorized);
}

export function fetchArtifactRecords(onUnauthorized?: () => void) {
  return requestItems<ArtifactRecord>("/artifacts", onUnauthorized);
}

export function createArtifactRecord(
  payload: ArtifactPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ArtifactRecord, ArtifactPayload>(
    "/artifacts",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function createWorkstreamRecord(
  payload: WorkstreamPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<WorkstreamRecord, WorkstreamPayload>(
    "/workstreams",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateWorkstreamRecord(
  workstreamId: string,
  payload: Partial<WorkstreamPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<WorkstreamRecord, Partial<WorkstreamPayload>>(
    `/workstreams/${workstreamId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function updateArtifactRecord(
  artifactId: string,
  payload: Partial<ArtifactPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<ArtifactRecord, Partial<ArtifactPayload>>(
    `/artifacts/${artifactId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteArtifactRecord(
  artifactId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<ArtifactRecord, never>(
    `/artifacts/${artifactId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}

export function createPartDefinitionRecord(
  payload: PartDefinitionPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<PartDefinitionRecord, PartDefinitionPayload>(
    "/part-definitions",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updatePartDefinitionRecord(
  partDefinitionId: string,
  payload: Partial<PartDefinitionPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<PartDefinitionRecord, Partial<PartDefinitionPayload>>(
    `/part-definitions/${partDefinitionId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deletePartDefinitionRecord(
  partDefinitionId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<PartDefinitionRecord, never>(
    `/part-definitions/${partDefinitionId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}

export function createPartInstanceRecord(
  payload: PartInstancePayload,
  onUnauthorized?: () => void,
) {
  return requestItem<PartInstanceRecord, PartInstancePayload>(
    "/part-instances",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updatePartInstanceRecord(
  partInstanceId: string,
  payload: Partial<PartInstancePayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<PartInstanceRecord, Partial<PartInstancePayload>>(
    `/part-instances/${partInstanceId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deletePartInstanceRecord(
  partInstanceId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<PartInstanceRecord, never>(
    `/part-instances/${partInstanceId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}

export function createPurchaseItemRecord(
  payload: PurchaseItemPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<PurchaseItemRecord, PurchaseItemPayload>(
    "/purchases",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updatePurchaseItemRecord(
  itemId: string,
  payload: Partial<PurchaseItemPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<PurchaseItemRecord, Partial<PurchaseItemPayload>>(
    `/purchases/${itemId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function createManufacturingItemRecord(
  payload: ManufacturingItemPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<ManufacturingItemRecord, ManufacturingItemPayload>(
    "/manufacturing",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateManufacturingItemRecord(
  itemId: string,
  payload: Partial<ManufacturingItemPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<ManufacturingItemRecord, Partial<ManufacturingItemPayload>>(
    `/manufacturing/${itemId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}
