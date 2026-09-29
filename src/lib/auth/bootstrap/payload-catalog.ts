import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneStatus, PlannedAttendanceDay } from "@/types/common";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";
import { normalizeSubsystemLayoutFields } from "@/lib/appUtils/subsystemLayout";

const PLANNED_ATTENDANCE_DAYS = new Set<PlannedAttendanceDay>([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
const MILESTONE_STATUSES = new Set<MilestoneStatus>(["not ready", "blocked", "qa", "ready"]);

function normalizeMilestoneStatus(status: unknown): MilestoneStatus {
  return typeof status === "string" && MILESTONE_STATUSES.has(status as MilestoneStatus)
    ? (status as MilestoneStatus)
    : "not ready";
}

function normalizePlannedAttendanceDays(days: unknown) {
  if (!Array.isArray(days)) {
    return [];
  }

  return Array.from(
    new Set(
      days.filter(
        (day): day is PlannedAttendanceDay =>
          typeof day === "string" && PLANNED_ATTENDANCE_DAYS.has(day as PlannedAttendanceDay),
      ),
    ),
  );
}

export function normalizeBootstrapCatalogRecords(source: BootstrapPayload) {
  return {
    members: source.members.map((member) => ({
      ...member,
      email: member.email ?? "",
      photoUrl: member.photoUrl ?? "",
      elevated: member.elevated ?? (member.role === "lead" || member.role === "admin"),
      activeSeasonIds: Array.from(new Set([...(member.activeSeasonIds ?? []), member.seasonId].filter(Boolean))),
      plannedWeeklyAttendanceHours: Math.max(0, member.plannedWeeklyAttendanceHours ?? 0),
      plannedAttendanceDays: normalizePlannedAttendanceDays(member.plannedAttendanceDays),
      plannedAttendanceNotes: member.plannedAttendanceNotes ?? "",
    })),
    subsystems: source.subsystems.map((subsystem) => ({
      ...subsystem,
      ...normalizeSubsystemLayoutFields(subsystem),
      color: resolveWorkspaceColor(
        subsystem.color,
        `${subsystem.projectId}:${subsystem.id}:${subsystem.name}`,
        subsystem.iteration ?? 0,
      ),
      isArchived: subsystem.isArchived ?? false,
    })),
    mechanisms: source.mechanisms.map((mechanism) => ({
      ...mechanism,
      googleSheetsUrl: mechanism.googleSheetsUrl ?? "",
      isArchived: mechanism.isArchived ?? false,
    })),
    materials: source.materials.map((material) => ({ ...material, photoUrl: material.photoUrl ?? "" })),
    artifacts: source.artifacts.map((artifact) => ({
      ...artifact,
      summary: artifact.summary ?? "",
      link: artifact.link ?? "",
      photoUrl: artifact.photoUrl ?? "",
      isArchived: artifact.isArchived ?? false,
    })),
    partDefinitions: source.partDefinitions.map((partDefinition) => ({
      ...partDefinition,
      isArchived: partDefinition.isArchived ?? false,
      materialId: partDefinition.materialId ?? null,
      description: partDefinition.description ?? "",
    })),
    // Identity consolidation belongs to commands, never bootstrap reads.
    partInstances: source.partInstances.map((partInstance) => ({
      ...partInstance,
      mechanismId: partInstance.mechanismId ?? null,
      status: partInstance.status ?? "not ready",
    })),
    milestones: source.milestones.map((milestone) => ({
      ...milestone,
      status: normalizeMilestoneStatus(milestone.status),
    })),
    workLogs: source.workLogs.map((workLog) => ({
      ...workLog,
      participantIds: workLog.participantIds ?? [],
      notes: workLog.notes ?? "",
    })),
    purchaseItems: source.purchaseItems.map((item) => ({
      ...item,
      partDefinitionId: item.partDefinitionId ?? null,
    })),
    manufacturingItems: source.manufacturingItems.map((item) => ({
      ...item,
      materialId: item.materialId ?? null,
      partDefinitionId: item.partDefinitionId ?? null,
      partInstanceIds: item.partInstanceIds ?? (item.partInstanceId ? [item.partInstanceId] : []),
      inHouse: item.process === "cnc" ? item.inHouse ?? true : false,
    })),
  };
}
