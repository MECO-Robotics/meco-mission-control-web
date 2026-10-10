import { filterSelectionMatchesTaskPeople, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskRecord } from "@/types/recordsReporting";

import { parseTimestamp } from "./riskViewMetricsUtils";

export interface ScopedRiskViewPools {
  scopedReports: BootstrapPayload["reports"];
  scopedTaskIds: Set<string>;
  scopedTasks: BootstrapPayload["tasks"];
  scopedWorkLogs: BootstrapPayload["workLogs"];
}

export function buildScopedRiskViewPools({
  activePersonFilter,
  bootstrap,
}: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
}): ScopedRiskViewPools {
  const scopedTasks =
    activePersonFilter.length > 0
      ? bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task))
      : bootstrap.tasks;
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedWorkLogs =
    activePersonFilter.length > 0
      ? bootstrap.workLogs.filter((workLog) => scopedTaskIds.has(workLog.taskId))
      : bootstrap.workLogs;
  const scopedReports =
    activePersonFilter.length > 0
      ? bootstrap.reports.filter((report) => report.targetRefs.some((ref) => ref.kind === "task" && scopedTaskIds.has(ref.id)))
      : bootstrap.reports;
  return {
    scopedReports,
    scopedTaskIds,
    scopedTasks,
    scopedWorkLogs,
  };
}

export function buildOpenBlockersByTaskId(scopedTaskIds: Set<string>, bootstrap: BootstrapPayload) {
  const openBlockersByTaskId = new Map<string, RiskRecord[]>();
  bootstrap.risks.forEach((risk) => {
    if (!risk.blocksWork || risk.status === "resolved") return;
    risk.relatedTargets.filter((target) => target.kind === "task" && scopedTaskIds.has(target.id)).forEach((target) => {
      if (target.kind !== "task") return;
      const existing = openBlockersByTaskId.get(target.id) ?? [];
      existing.push(risk);
      openBlockersByTaskId.set(target.id, existing);
    });
  });

  return openBlockersByTaskId;
}

export function buildLastActivityByTaskId({
  openBlockersByTaskId,
  scopedReports,
  scopedTaskIds,
  scopedTasks,
  scopedWorkLogs,
}: {
  openBlockersByTaskId: Map<string, RiskRecord[]>;
  scopedReports: BootstrapPayload["reports"];
  scopedTaskIds: Set<string>;
  scopedTasks: BootstrapPayload["tasks"];
  scopedWorkLogs: BootstrapPayload["workLogs"];
}) {
  const lastActivityByTaskId = new Map<string, number>();

  const registerTaskActivity = (taskId: string | null | undefined, value: string | null | undefined) => {
    if (!taskId || !scopedTaskIds.has(taskId)) {
      return;
    }

    const timestamp = parseTimestamp(value);
    if (timestamp === null) {
      return;
    }

    const current = lastActivityByTaskId.get(taskId);
    if (typeof current !== "number" || timestamp > current) {
      lastActivityByTaskId.set(taskId, timestamp);
    }
  };

  scopedTasks.forEach((task) => {
    registerTaskActivity(task.id, task.startDate);
  });
  scopedWorkLogs.forEach((workLog) => {
    registerTaskActivity(workLog.taskId, workLog.date);
  });
  scopedReports.forEach((report) => {
    report.targetRefs.filter((target) => target.kind === "task").forEach((target) => registerTaskActivity(target.id, report.reviewedAt ?? report.createdAt));
  });
  openBlockersByTaskId.forEach((risks, taskId) => risks.forEach((risk) => {
    registerTaskActivity(taskId, risk.updatedAt);
  }));

  return lastActivityByTaskId;
}

export function buildScopeMetricInputs({
  bootstrap,
  scopedReports,
  scopedWorkLogs,
}: {
  bootstrap: BootstrapPayload;
  scopedReports: BootstrapPayload["reports"];
  scopedWorkLogs: BootstrapPayload["workLogs"];
}) {
  const workHoursByTaskId = new Map<string, number>();
  scopedWorkLogs.forEach((workLog) => {
    workHoursByTaskId.set(
      workLog.taskId,
      (workHoursByTaskId.get(workLog.taskId) ?? 0) + Math.max(0, Number(workLog.hours) || 0),
    );
  });

  const qaPassTaskIds = new Set<string>();
  scopedReports.forEach((report) => {
    if (report.reportType === "qa" && report.result === "pass" && report.status === "reviewed") {
      report.targetRefs.filter((target) => target.kind === "task").forEach((target) => qaPassTaskIds.add(target.id));
    }
  });

  return {
    membersById: Object.fromEntries(bootstrap.members.map((member) => [member.id, member] as const)),
    projectsById: Object.fromEntries(bootstrap.projects.map((project) => [project.id, project] as const)),
    qaPassTaskIds,
    subsystemsById: Object.fromEntries(
      bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
    ),
    workHoursByTaskId,
  };
}
