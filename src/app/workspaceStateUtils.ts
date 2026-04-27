import type { BootstrapPayload, MemberPayload } from "@/types";
import { isMemberActiveInSeason } from "@/lib/appUtils";

export function scopeBootstrapBySelection(
  payload: BootstrapPayload,
  selectedSeasonId: string | null,
  selectedProjectId: string | null,
): BootstrapPayload {
  const seasonScopedProjects = selectedSeasonId
    ? payload.projects.filter((project) => project.seasonId === selectedSeasonId)
    : payload.projects;
  const selectedProjectIsValid =
    selectedProjectId !== null &&
    seasonScopedProjects.some((project) => project.id === selectedProjectId);
  const activeProjectIds = new Set(
    (selectedProjectIsValid
      ? seasonScopedProjects.filter((project) => project.id === selectedProjectId)
      : seasonScopedProjects
    ).map((project) => project.id),
  );
  const scopedSeasons = selectedSeasonId
    ? payload.seasons.filter((season) => season.id === selectedSeasonId)
    : payload.seasons;
  const scopedProjects = seasonScopedProjects.filter((project) =>
    activeProjectIds.has(project.id),
  );
  const scopedWorkstreams = payload.workstreams.filter((workstream) =>
    activeProjectIds.has(workstream.projectId),
  );
  const scopedSubsystems = payload.subsystems.filter((subsystem) =>
    activeProjectIds.has(subsystem.projectId),
  );
  const scopedSubsystemIds = new Set(scopedSubsystems.map((subsystem) => subsystem.id));
  const scopedMechanisms = payload.mechanisms.filter((mechanism) =>
    scopedSubsystemIds.has(mechanism.subsystemId),
  );
  const scopedMechanismIds = new Set(scopedMechanisms.map((mechanism) => mechanism.id));
  const scopedPartInstances = payload.partInstances.filter(
    (partInstance) =>
      scopedSubsystemIds.has(partInstance.subsystemId) &&
      (!partInstance.mechanismId || scopedMechanismIds.has(partInstance.mechanismId)),
  );
  const scopedPurchaseItems = payload.purchaseItems.filter((item) =>
    scopedSubsystemIds.has(item.subsystemId),
  );
  const scopedManufacturingItems = payload.manufacturingItems.filter((item) =>
    scopedSubsystemIds.has(item.subsystemId),
  );
  const scopedEvents = payload.events.filter((event) => {
    const eventProjectIds = event.projectIds ?? [];
    if (eventProjectIds.length > 0) {
      return eventProjectIds.some((projectId) => activeProjectIds.has(projectId));
    }

    return (
      event.relatedSubsystemIds.length === 0 ||
      event.relatedSubsystemIds.some((subsystemId) => scopedSubsystemIds.has(subsystemId))
    );
  });
  const scopedWorkstreamIds = new Set(scopedWorkstreams.map((workstream) => workstream.id));
  const scopedTasks = payload.tasks.filter(
    (task) =>
      activeProjectIds.has(task.projectId) &&
      (scopedSubsystemIds.has(task.subsystemId) ||
        task.subsystemIds.some((subsystemId) => scopedSubsystemIds.has(subsystemId))),
  );
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedWorkLogs = payload.workLogs.filter((workLog) => scopedTaskIds.has(workLog.taskId));
  const scopedQaReports = payload.qaReports.filter((report) => scopedTaskIds.has(report.taskId));
  const scopedQaReportIds = new Set(scopedQaReports.map((report) => report.id));
  const scopedRisks = payload.risks.filter((risk) => {
    if (risk.attachmentType === "project" && !activeProjectIds.has(risk.attachmentId)) {
      return false;
    }

    if (
      risk.attachmentType === "workstream" &&
      !scopedWorkstreamIds.has(risk.attachmentId)
    ) {
      return false;
    }

    if (risk.mitigationTaskId && !scopedTaskIds.has(risk.mitigationTaskId)) {
      return false;
    }

    if (risk.sourceType === "qa-report" && !scopedQaReportIds.has(risk.sourceId)) {
      return false;
    }

    return true;
  });
  const scopedMembers = selectedSeasonId
    ? payload.members.filter((member) => isMemberActiveInSeason(member, selectedSeasonId))
    : payload.members;

  return {
    ...payload,
    seasons: scopedSeasons,
    projects: scopedProjects,
    workstreams: scopedWorkstreams,
    subsystems: scopedSubsystems,
    mechanisms: scopedMechanisms,
    partInstances: scopedPartInstances,
    purchaseItems: scopedPurchaseItems,
    manufacturingItems: scopedManufacturingItems,
    events: scopedEvents,
    members: scopedMembers,
    tasks: scopedTasks,
    workLogs: scopedWorkLogs,
    qaReports: scopedQaReports,
    risks: scopedRisks,
  };
}

export function isElevatedMemberRole(role: MemberPayload["role"]): boolean {
  return role === "lead" || role === "admin";
}

export function getSinglePersonFilterId(selection: readonly string[]) {
  return selection.length === 1 ? selection[0] : null;
}
