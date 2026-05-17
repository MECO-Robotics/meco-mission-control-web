import { filterSelectionMatchesTaskPeople, type FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getTaskBlockerRecords } from "@/features/workspace/shared/task/taskPlanningInternals";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskBlockerRecord } from "@/types/recordsExecution";
import type { RiskRecord } from "@/types/recordsReporting";

import { parseTimestamp } from "./riskViewMetricsUtils";

export interface ScopedRiskViewPools {
  scopedReportIds: Set<string>;
  scopedReports: BootstrapPayload["reports"];
  scopedRisks: RiskRecord[];
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
      ? bootstrap.reports.filter((report) => report.taskId && scopedTaskIds.has(report.taskId))
      : bootstrap.reports;
  const scopedReportIds = new Set(scopedReports.map((report) => report.id));
  const scopedRisks =
    activePersonFilter.length > 0
      ? bootstrap.risks.filter((risk) => {
          if (risk.mitigationTaskId && scopedTaskIds.has(risk.mitigationTaskId)) {
            return true;
          }

          return scopedReportIds.has(risk.sourceId);
        })
      : bootstrap.risks;

  return {
    scopedReportIds,
    scopedReports,
    scopedRisks,
    scopedTaskIds,
    scopedTasks,
    scopedWorkLogs,
  };
}

export function buildOpenBlockersByTaskId(scopedTaskIds: Set<string>, bootstrap: BootstrapPayload) {
  const openBlockers = getTaskBlockerRecords(bootstrap).filter(
    (blocker) => blocker.status === "open" && scopedTaskIds.has(blocker.blockedTaskId),
  );
  const openBlockersByTaskId = new Map<string, TaskBlockerRecord[]>();

  openBlockers.forEach((blocker) => {
    const existing = openBlockersByTaskId.get(blocker.blockedTaskId) ?? [];
    existing.push(blocker);
    openBlockersByTaskId.set(blocker.blockedTaskId, existing);
  });

  return { openBlockers, openBlockersByTaskId };
}

export function buildLastActivityByTaskId({
  openBlockers,
  scopedReports,
  scopedTaskIds,
  scopedTasks,
  scopedWorkLogs,
}: {
  openBlockers: TaskBlockerRecord[];
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
    registerTaskActivity(report.taskId, report.reviewedAt ?? report.createdAt);
  });
  openBlockers.forEach((blocker) => {
    registerTaskActivity(blocker.blockedTaskId, blocker.createdAt);
  });

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
    if (report.result === "pass" && report.mentorApproved && report.taskId) {
      qaPassTaskIds.add(report.taskId);
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
