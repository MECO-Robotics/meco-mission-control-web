import type { BootstrapPayload } from "@/types/bootstrap";
import { isMemberActiveInSeason, isPartDefinitionActiveInSeason } from "@/lib/appUtils/common";
import { scopeBootstrapRisks } from "./workspaceBootstrapRiskScope";

export function scopeBootstrapBySelection(
  payload: BootstrapPayload,
  selectedSeasonId: string | null,
  selectedProjectId: string | null,
): BootstrapPayload {
  const seasons = selectedSeasonId ? payload.seasons.filter(({ id }) => id === selectedSeasonId) : payload.seasons;
  const seasonProjects = selectedSeasonId
    ? payload.projects.filter(({ seasonId }) => seasonId === selectedSeasonId)
    : payload.projects;
  const selectedProjectValid = Boolean(selectedProjectId && seasonProjects.some(({ id }) => id === selectedProjectId));
  const projects = selectedProjectValid
    ? seasonProjects.filter(({ id }) => id === selectedProjectId)
    : seasonProjects;
  const projectIds = new Set(projects.map(({ id }) => id));
  const projectTypes = new Set(projects.map(({ projectType }) => projectType));
  const tasks = payload.tasks.filter(({ projectId }) => projectIds.has(projectId));
  const taskIds = new Set(tasks.map(({ id }) => id));
  const workstreams = payload.workstreams.filter(({ projectId }) => projectIds.has(projectId));
  const subsystems = payload.subsystems.filter(({ projectId }) => projectIds.has(projectId));
  const subsystemIds = new Set(subsystems.map(({ id }) => id));
  const mechanisms = payload.mechanisms.filter(({ subsystemId }) => subsystemIds.has(subsystemId));
  const mechanismIds = new Set(mechanisms.map(({ id }) => id));
  const partDefinitions = selectedSeasonId
    ? payload.partDefinitions.filter((part) => isPartDefinitionActiveInSeason(part, selectedSeasonId))
    : payload.partDefinitions;
  const partDefinitionIds = new Set(partDefinitions.map(({ id }) => id));
  const partInstances = payload.partInstances.filter((part) => {
    if (partDefinitionIds.has(part.partDefinitionId)) return true;
    if (part.intendedMechanismId && !mechanismIds.has(part.intendedMechanismId)) return false;
    if (part.intendedSubsystemId && subsystemIds.has(part.intendedSubsystemId)) return true;
    return part.location.kind === "installed" && subsystemIds.has(part.location.subsystemId) &&
      (!part.location.mechanismId || mechanismIds.has(part.location.mechanismId));
  });
  const partInstanceIds = new Set(partInstances.map(({ id }) => id));
  const milestones = payload.milestones.filter((item) =>
    (!selectedSeasonId || item.seasonId === selectedSeasonId) &&
    (item.projectIds.length === 0 || item.projectIds.some((id) => projectIds.has(id))),
  );
  const milestoneIds = new Set(milestones.map(({ id }) => id));
  const meetings = payload.meetings.filter((item) =>
    (!selectedSeasonId || item.seasonId === selectedSeasonId) &&
    (item.projectIds.length === 0 || item.projectIds.some((id) => projectIds.has(id))),
  );
  const events = payload.events.filter((item) =>
    (!selectedSeasonId || item.seasonId === selectedSeasonId) &&
    (item.projectIds.length === 0 || item.projectIds.some((id) => projectIds.has(id))),
  );
  const reports = payload.reports.filter(({ projectId }) => projectIds.has(projectId));
  const qaRequests = payload.qaRequests.filter(({ projectId }) => projectIds.has(projectId));
  const qaFindings = payload.qaFindings.filter(({ projectId }) => projectIds.has(projectId));
  const testResults = payload.testResults.filter(({ projectId }) => projectIds.has(projectId));
  const testFindings = payload.testFindings.filter(({ projectId }) => projectIds.has(projectId));
  const risks = scopeBootstrapRisks(payload, projectIds);
  const artifacts = payload.artifacts.filter(({ projectId }) => projectIds.has(projectId));
  const purchaseItems = payload.purchaseItems.filter(({ taskId }) => taskIds.has(taskId));
  const neededVendorIds = new Set([
    ...purchaseItems.flatMap(({ quotes }) => quotes.map(({ vendorId }) => vendorId)),
    ...payload.materials.flatMap(({ preferredVendorId }) => preferredVendorId ? [preferredVendorId] : []),
  ]);

  return {
    ...payload,
    seasons,
    projects,
    workTypes: payload.workTypes.filter(({ projectType }) => projectTypes.has(projectType)),
    responsibleGroups: payload.responsibleGroups.filter((group) =>
      (!selectedSeasonId || group.seasonId === selectedSeasonId) &&
      (group.projectIds.length === 0 || group.projectIds.some((id) => projectIds.has(id))),
    ),
    workstreams,
    vendors: payload.vendors.filter(({ id }) => neededVendorIds.has(id)),
    members: selectedSeasonId ? payload.members.filter((member) => isMemberActiveInSeason(member, selectedSeasonId)) : payload.members,
    subsystems,
    mechanisms,
    partDefinitions,
    partInstances,
    tasks,
    taskDependencies: payload.taskDependencies.filter((dependency) => {
      if (!taskIds.has(dependency.taskId)) return false;
      if (dependency.kind === "task") return taskIds.has(dependency.refId);
      if (dependency.kind === "milestone") return milestoneIds.has(dependency.refId);
      return partInstanceIds.has(dependency.refId);
    }),
    materials: payload.materials,
    purchaseItems,
    meetings,
    events,
    milestones,
    milestoneRequirements: payload.milestoneRequirements.filter(({ milestoneId }) => milestoneIds.has(milestoneId)),
    reports,
    qaRequests,
    qaFindings,
    testResults,
    testFindings,
    risks,
    artifacts,
    workLogs: payload.workLogs.filter(({ taskId }) => taskIds.has(taskId)),
    attendanceRecords: selectedSeasonId
      ? payload.attendanceRecords.filter(({ memberId }) => payload.members.some((member) => member.id === memberId && isMemberActiveInSeason(member, selectedSeasonId)))
      : payload.attendanceRecords,
    designIterations: payload.designIterations?.filter((record) => !record.taskId || taskIds.has(record.taskId)),
    qaReviews: payload.qaReviews?.filter((review) => review.subjectType === "task" && taskIds.has(review.subjectId)),
    actions: payload.actions?.filter((action) =>
      (!action.projectId || projectIds.has(action.projectId)) &&
      (!action.taskId || taskIds.has(action.taskId)) &&
      (!action.subsystemId || subsystemIds.has(action.subsystemId)),
    ),
    escalations: payload.escalations,
    manufacturingProcesses: payload.manufacturingProcesses,
  };
}
