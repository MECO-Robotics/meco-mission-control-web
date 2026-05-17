import type { BootstrapPayload } from "@/types/bootstrap";
import { isMemberActiveInSeason, isPartDefinitionActiveInSeason } from "@/lib/appUtils/common";
import { scopeBootstrapRisks } from "./workspaceBootstrapRiskScope";

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
  const scopedMilestones = payload.milestones.filter((milestone) => {
    const milestoneProjectIds = milestone.projectIds ?? [];
    return milestoneProjectIds.length === 0
      ? true
      : milestoneProjectIds.some((projectId) => activeProjectIds.has(projectId));
  });
  const scopedWorkstreamIds = new Set(scopedWorkstreams.map((workstream) => workstream.id));
  const scopedMilestoneIds = new Set(scopedMilestones.map((milestone) => milestone.id));
  const scopedPartInstanceIds = new Set(scopedPartInstances.map((partInstance) => partInstance.id));
  const scopedTasks = payload.tasks.filter(
    (task) =>
      activeProjectIds.has(task.projectId) &&
      (scopedSubsystemIds.has(task.subsystemId) ||
        task.subsystemIds.some((subsystemId) => scopedSubsystemIds.has(subsystemId))),
  );
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedTasksWithVisibleDependencies = scopedTasks.map((task) => ({
    ...task,
    dependencyIds: task.dependencyIds.filter((dependencyId) =>
      scopedTaskIds.has(dependencyId),
    ),
  }));
  const scopedTaskDependencies = (payload.taskDependencies ?? []).filter((dependency) => {
    if (!scopedTaskIds.has(dependency.taskId)) {
      return false;
    }

    if (dependency.kind === "task") {
      return scopedTaskIds.has(dependency.refId);
    }

    if (dependency.kind === "milestone") {
      return scopedMilestoneIds.has(dependency.refId);
    }

    if (dependency.kind === "part_instance") {
      return scopedPartInstanceIds.has(dependency.refId);
    }

    return false;
  });
  const scopedTaskBlockers = (payload.taskBlockers ?? []).filter((blocker) => {
    if (!scopedTaskIds.has(blocker.blockedTaskId)) {
      return false;
    }

    if (!blocker.blockerId || blocker.blockerType === "external") {
      return true;
    }

    if (blocker.blockerType === "task") {
      return scopedTaskIds.has(blocker.blockerId);
    }

    if (blocker.blockerType === "part_instance") {
      return scopedPartInstanceIds.has(blocker.blockerId);
    }

    if (blocker.blockerType === "milestone") {
      return scopedMilestoneIds.has(blocker.blockerId);
    }

    return true;
  });
  const scopedWorkLogs = payload.workLogs.filter((workLog) => scopedTaskIds.has(workLog.taskId));
  const scopedReports = payload.reports.filter((report) => {
    if (!activeProjectIds.has(report.projectId)) {
      return false;
    }

    if (report.taskId && !scopedTaskIds.has(report.taskId)) {
      return false;
    }

    if (report.milestoneId && !scopedMilestoneIds.has(report.milestoneId)) {
      return false;
    }

    return true;
  });
  const scopedReportsById = new Map(scopedReports.map((report) => [report.id, report] as const));
  const scopedReportFindings = payload.reportFindings.filter((finding) =>
    scopedReports.some((report) => report.id === finding.reportId),
  );
  const scopedQaReports = scopedReports.filter((report) => report.reportType === "QA");
  const scopedTestResults = scopedReports.filter((report) => report.reportType !== "QA");
  const scopedQaReportIds = new Set(scopedQaReports.map((report) => report.id));
  const scopedTestResultIds = new Set(scopedTestResults.map((report) => report.id));
  const scopedQaFindings = scopedReportFindings
    .filter((finding) => scopedQaReportIds.has(finding.reportId))
    .map((finding) => {
      const report = scopedReportsById.get(finding.reportId);
      return {
        id: finding.id,
        qaReportId: finding.reportId || null,
        taskId: finding.taskId ?? report?.taskId ?? null,
        projectId: finding.projectId ?? report?.projectId ?? "",
        workstreamId: finding.workstreamId ?? report?.workstreamId ?? null,
        subsystemId: finding.subsystemId ?? null,
        mechanismId: finding.mechanismId ?? null,
        partInstanceId: finding.partInstanceId ?? null,
        artifactId: finding.artifactInstanceId ?? null,
        title: finding.title ?? finding.issueType,
        detail: finding.detail ?? finding.notes,
        severity: finding.severity,
        status: finding.status ?? "open",
        createdAt: finding.createdAt ?? new Date().toISOString(),
        updatedAt: finding.updatedAt ?? finding.createdAt ?? new Date().toISOString(),
      };
    });
  const scopedTestFindings = scopedReportFindings
    .filter((finding) => scopedTestResultIds.has(finding.reportId))
    .map((finding) => {
      const report = scopedReportsById.get(finding.reportId);
      return {
        id: finding.id,
        testResultId: finding.reportId || null,
        milestoneId: finding.milestoneId ?? report?.milestoneId ?? null,
        taskId: finding.taskId ?? report?.taskId ?? null,
        projectId: finding.projectId ?? report?.projectId ?? "",
        workstreamId: finding.workstreamId ?? report?.workstreamId ?? null,
        subsystemId: finding.subsystemId ?? null,
        mechanismId: finding.mechanismId ?? null,
        partInstanceId: finding.partInstanceId ?? null,
        artifactId: finding.artifactInstanceId ?? null,
        title: finding.title ?? finding.issueType,
        detail: finding.detail ?? finding.notes,
        severity: finding.severity,
        status: finding.status ?? "open",
        createdAt: finding.createdAt ?? new Date().toISOString(),
        updatedAt: finding.updatedAt ?? finding.createdAt ?? new Date().toISOString(),
      };
    });
  const scopedRisks = scopeBootstrapRisks(
    payload,
    activeProjectIds,
    scopedWorkstreamIds,
    scopedTaskIds,
    scopedQaReportIds,
    scopedTestResultIds,
  );
  const scopedMembers = selectedSeasonId
    ? payload.members.filter((member) => isMemberActiveInSeason(member, selectedSeasonId))
    : payload.members;
  const scopedPartDefinitions = selectedSeasonId
    ? payload.partDefinitions.filter((partDefinition) =>
        isPartDefinitionActiveInSeason(partDefinition, selectedSeasonId),
      )
    : payload.partDefinitions;
  const scopedActions = (payload.actions ?? []).filter((action) => {
    if (action.projectId && !activeProjectIds.has(action.projectId)) {
      return false;
    }

    const requiresExistingScopeEntities = action.operation !== "delete";

    if (requiresExistingScopeEntities && action.taskId && !scopedTaskIds.has(action.taskId)) {
      return false;
    }

    if (
      requiresExistingScopeEntities &&
      action.subsystemId &&
      !scopedSubsystemIds.has(action.subsystemId)
    ) {
      return false;
    }

    return true;
  });

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
    milestones: scopedMilestones,
    members: scopedMembers,
    partDefinitions: scopedPartDefinitions,
    tasks: scopedTasksWithVisibleDependencies,
    workLogs: scopedWorkLogs,
    reports: scopedReports,
    reportFindings: scopedReportFindings,
    qaReports: scopedQaReports,
    testResults: scopedTestResults,
    qaFindings: scopedQaFindings,
    testFindings: scopedTestFindings,
    risks: scopedRisks,
    taskDependencies: scopedTaskDependencies,
    taskBlockers: scopedTaskBlockers,
    actions: scopedActions,
  };
}
