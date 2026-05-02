import type { FilterSelection } from "@/features/workspace/shared";
import { filterSelectionMatchesTaskPeople } from "@/features/workspace/shared";
import type { BootstrapPayload, RiskPayload, RiskRecord } from "@/types";

import { buildScopeMetrics, type ScopeMetricRow } from "./RiskMetrics";

export type RiskSeverityFilter = "all" | RiskPayload["severity"];
export type RiskSourceFilter = "all" | RiskPayload["sourceType"];

export interface SelectOption {
  id: string;
  name: string;
}

export const SEVERITY_RANK: Record<RiskPayload["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const ATTACHMENT_TYPE_LABELS: Record<RiskPayload["attachmentType"], string> = {
  project: "Project",
  workstream: "Workflow",
  mechanism: "Mechanism",
  "part-instance": "Part instance",
};

export const RISK_SEVERITY_ORDER = ["high", "medium", "low"] as const;

export function formatRiskSeverity(severity: RiskPayload["severity"]) {
  switch (severity) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return severity;
  }
}

export function getRiskSeverityPillClassName(severity: RiskPayload["severity"]) {
  switch (severity) {
    case "high":
      return "status-pill status-pill-danger";
    case "medium":
      return "status-pill status-pill-warning";
    case "low":
      return "status-pill status-pill-neutral";
    default:
      return "status-pill status-pill-neutral";
  }
}

export function toRiskPayload(risk: RiskRecord): RiskPayload {
  return {
    title: risk.title,
    detail: risk.detail,
    severity: risk.severity,
    sourceType: risk.sourceType,
    sourceId: risk.sourceId,
    attachmentType: risk.attachmentType,
    attachmentId: risk.attachmentId,
    mitigationTaskId: risk.mitigationTaskId,
  };
}

export function sanitizeRiskPayload(payload: RiskPayload): RiskPayload {
  const mitigationTaskId =
    typeof payload.mitigationTaskId === "string" && payload.mitigationTaskId.trim().length > 0
      ? payload.mitigationTaskId.trim()
      : null;

  return {
    ...payload,
    title: payload.title.trim(),
    detail: payload.detail.trim(),
    sourceId: payload.sourceId.trim(),
    attachmentId: payload.attachmentId.trim(),
    mitigationTaskId,
  };
}

export function buildDefaultRiskPayload(
  bootstrap: BootstrapPayload,
  qaSourceOptions: SelectOption[],
  testSourceOptions: SelectOption[],
  projectAttachmentOptions: SelectOption[],
): RiskPayload {
  const hasQaSources = qaSourceOptions.length > 0;
  const sourceType: RiskPayload["sourceType"] = hasQaSources ? "qa-report" : "test-result";
  const sourceId = hasQaSources ? qaSourceOptions[0]?.id ?? "" : testSourceOptions[0]?.id ?? "";

  return {
    title: "",
    detail: "",
    severity: "medium",
    sourceType,
    sourceId,
    attachmentType: "project",
    attachmentId: projectAttachmentOptions[0]?.id ?? bootstrap.projects[0]?.id ?? "",
    mitigationTaskId: null,
  };
}

interface BuildRisksViewDataArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  search: string;
  severityFilter: RiskSeverityFilter;
  sourceFilter: RiskSourceFilter;
}

export interface RiskViewData {
  activeMechanismCount: number;
  activeSubsystemCount: number;
  attendanceHours: number;
  attachmentOptionsForType: (attachmentType: RiskPayload["attachmentType"]) => SelectOption[];
  blockerCount: number;
  clampedCompletionWidth: string;
  completionRate: number;
  completedTaskCount: number;
  deliveredPurchases: number;
  filteredRows: RiskRecord[];
  getAttachmentLabel: (risk: RiskRecord) => string;
  getMitigationLabel: (risk: RiskRecord) => string;
  getSourceLabel: (risk: RiskRecord) => string;
  loggedHours: number;
  lowStockMaterials: number;
  maxMetricHours: number;
  mechanismAttachmentOptions: SelectOption[];
  mechanismMetrics: ScopeMetricRow[];
  mitigationTaskOptions: SelectOption[];
  plannedHours: number;
  projectAttachmentOptions: SelectOption[];
  qaPassCount: number;
  qaSourceOptions: SelectOption[];
  risksBySeverity: Record<(typeof RISK_SEVERITY_ORDER)[number], RiskRecord[]>;
  scopedTaskCount: number;
  sourceOptionsForType: (sourceType: RiskPayload["sourceType"]) => SelectOption[];
  subsystemMetrics: ScopeMetricRow[];
  supplySignals: number;
  testSourceOptions: SelectOption[];
  totalMechanismCount: number;
  totalSubsystemCount: number;
  waitingForQaCount: number;
}

export function buildRisksViewData({
  activePersonFilter,
  bootstrap,
  search,
  severityFilter,
  sourceFilter,
}: BuildRisksViewDataArgs): RiskViewData {
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

  const plannedHours = scopedTasks.reduce(
    (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
    0,
  );
  const loggedHours = scopedWorkLogs.reduce(
    (total, workLog) => total + Math.max(0, Number(workLog.hours) || 0),
    0,
  );
  const maxMetricHours = Math.max(plannedHours, loggedHours, 1);
  const completionRatio = plannedHours > 0 ? loggedHours / plannedHours : 0;
  const clampedCompletionWidth = `${Math.max(0, Math.min(100, completionRatio * 100))}%`;

  const tasksById = Object.fromEntries(scopedTasks.map((task) => [task.id, task] as const));
  const projectsById = Object.fromEntries(bootstrap.projects.map((project) => [project.id, project] as const));
  const workstreamsById = Object.fromEntries(
    bootstrap.workstreams.map((workstream) => [workstream.id, workstream] as const),
  );
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  );
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
  );
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const),
  );
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
  );
  const eventsById = Object.fromEntries(bootstrap.events.map((event) => [event.id, event] as const));
  const testResultsById = Object.fromEntries(
    scopedReports
      .filter((report) => report.reportType !== "QA")
      .map((testResult) => [testResult.id, testResult] as const),
  );
  const qaReportsById = Object.fromEntries(
    scopedReports
      .filter((report) => report.reportType === "QA")
      .map((qaReport) => [qaReport.id, qaReport] as const),
  );

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

  const subsystemMetrics = buildScopeMetrics(
    bootstrap.subsystems,
    scopedTasks,
    workHoursByTaskId,
    qaPassTaskIds,
    (subsystem) => `Project: ${projectsById[subsystem.projectId]?.name ?? "Unknown project"}`,
    (subsystem) => {
      const mechanismCount = bootstrap.mechanisms.filter(
        (mechanism) => mechanism.subsystemId === subsystem.id,
      ).length;
      return `${mechanismCount} mechanism${mechanismCount === 1 ? "" : "s"}`;
    },
    (task, subsystem) =>
      task.subsystemId === subsystem.id || (task.subsystemIds ?? []).includes(subsystem.id),
  );

  const mechanismMetrics = buildScopeMetrics(
    bootstrap.mechanisms,
    scopedTasks,
    workHoursByTaskId,
    qaPassTaskIds,
    (mechanism) => `Subsystem: ${subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem"}`,
    (mechanism) => {
      const partInstanceCount = bootstrap.partInstances.filter(
        (partInstance) => partInstance.mechanismId === mechanism.id,
      ).length;
      return `${partInstanceCount} part instance${partInstanceCount === 1 ? "" : "s"}`;
    },
    (task, mechanism) =>
      task.mechanismId === mechanism.id || (task.mechanismIds ?? []).includes(mechanism.id),
  );

  const qaSourceOptions = scopedReports
    .filter((report) => report.reportType === "QA")
    .map((qaReport) => {
      const taskTitle = tasksById[qaReport.taskId ?? ""]?.title ?? "Unknown task";
      return {
        id: qaReport.id,
        name: `${taskTitle} (${qaReport.reviewedAt})`,
      };
    });
  const testSourceOptions = scopedReports
    .filter((report) => report.reportType !== "QA")
    .map((testResult) => {
      const eventTitle = eventsById[testResult.eventId ?? ""]?.title ?? "Unknown event";
      return {
        id: testResult.id,
        name: `${testResult.title} (${eventTitle})`,
      };
    });
  const projectAttachmentOptions = bootstrap.projects.map((project) => ({
    id: project.id,
    name: project.name,
  }));
  const workstreamAttachmentOptions = bootstrap.workstreams.map((workstream) => ({
    id: workstream.id,
    name: `${workstream.name} (${projectsById[workstream.projectId]?.name ?? "Unknown project"})`,
  }));
  const mechanismAttachmentOptions = bootstrap.mechanisms.map((mechanism) => ({
    id: mechanism.id,
    name: `${mechanism.name} (${subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem"})`,
  }));
  const partInstanceAttachmentOptions = bootstrap.partInstances.map((partInstance) => {
    const partDefinitionName =
      partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part";
    return {
      id: partInstance.id,
      name: `${partInstance.name} (${partDefinitionName})`,
    };
  });
  const mitigationTaskOptions = scopedTasks.map((task) => ({
    id: task.id,
    name: task.title,
  }));

  const getSourceOptionsForType = (sourceType: RiskPayload["sourceType"]) =>
    sourceType === "qa-report" ? qaSourceOptions : testSourceOptions;
  const getAttachmentOptionsForType = (attachmentType: RiskPayload["attachmentType"]) => {
    switch (attachmentType) {
      case "project":
        return projectAttachmentOptions;
      case "workstream":
        return workstreamAttachmentOptions;
      case "mechanism":
        return mechanismAttachmentOptions;
      case "part-instance":
        return partInstanceAttachmentOptions;
      default:
        return projectAttachmentOptions;
    }
  };

  const getSourceLabel = (risk: RiskRecord) => {
    if (risk.sourceType === "qa-report") {
      const report = qaReportsById[risk.sourceId];
      if (!report) {
        return "Unknown QA report";
      }

      return `${tasksById[report.taskId ?? ""]?.title ?? "Unknown task"} QA report`;
    }

    const testResult = testResultsById[risk.sourceId];
    if (!testResult) {
      return "Unknown test result";
    }

    return `${testResult.title} test result`;
  };

  const getAttachmentLabel = (risk: RiskRecord) => {
    switch (risk.attachmentType) {
      case "project":
        return projectsById[risk.attachmentId]?.name ?? "Unknown project";
      case "workstream":
        return workstreamsById[risk.attachmentId]?.name ?? "Unknown workflow";
      case "mechanism": {
        const mechanism = mechanismsById[risk.attachmentId];
        if (!mechanism) {
          return "Unknown mechanism";
        }

        const subsystemName = subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem";
        return `${mechanism.name} (${subsystemName})`;
      }
      case "part-instance": {
        const partInstance = partInstancesById[risk.attachmentId];
        if (!partInstance) {
          return "Unknown part instance";
        }

        const partDefinitionName =
          partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part";
        return `${partInstance.name} (${partDefinitionName})`;
      }
      default:
        return "Unknown attachment";
    }
  };

  const getMitigationLabel = (risk: RiskRecord) =>
    risk.mitigationTaskId ? tasksById[risk.mitigationTaskId]?.title ?? "Unknown task" : "None";

  const filteredRows = scopedRisks
    .filter((risk) => {
      if (severityFilter !== "all" && risk.severity !== severityFilter) {
        return false;
      }

      if (sourceFilter !== "all" && risk.sourceType !== sourceFilter) {
        return false;
      }

      const normalizedSearch = search.trim().toLowerCase();
      if (normalizedSearch.length === 0) {
        return true;
      }

      return [
        risk.title,
        risk.detail,
        getSourceLabel(risk),
        getAttachmentLabel(risk),
        getMitigationLabel(risk),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort((left, right) => {
      const severityOrder = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
      if (severityOrder !== 0) {
        return severityOrder;
      }

      return left.title.localeCompare(right.title);
    });

  const risksBySeverity: RiskViewData["risksBySeverity"] = {
    high: [],
    medium: [],
    low: [],
  };
  filteredRows.forEach((risk) => {
    risksBySeverity[risk.severity].push(risk);
  });

  const completedTaskCount = scopedTasks.filter((task) => task.status === "complete").length;
  const waitingForQaCount = scopedTasks.filter((task) => task.status === "waiting-for-qa").length;
  const blockerCount = scopedTasks.reduce((sum, task) => sum + task.blockers.length, 0);
  const qaPassCount = scopedReports.filter(
    (report) => report.result === "pass" && report.mentorApproved,
  ).length;
  const deliveredPurchases = bootstrap.purchaseItems.filter(
    (purchase) => purchase.status === "delivered",
  ).length;
  const lowStockMaterials = bootstrap.materials.filter(
    (material) => material.onHandQuantity <= material.reorderPoint,
  ).length;
  const attendanceHours = (bootstrap.attendanceRecords ?? []).reduce(
    (sum, record) => sum + record.totalHours,
    0,
  );
  const activeSubsystemCount = subsystemMetrics.filter((metric) => metric.taskCount > 0).length;
  const activeMechanismCount = mechanismMetrics.filter((metric) => metric.taskCount > 0).length;
  const totalTaskCount = Math.max(scopedTasks.length, 1);
  const completionRate = completedTaskCount / totalTaskCount;
  const supplySignals = deliveredPurchases + lowStockMaterials;

  return {
    activeMechanismCount,
    activeSubsystemCount,
    attendanceHours,
    attachmentOptionsForType: getAttachmentOptionsForType,
    blockerCount,
    clampedCompletionWidth,
    completionRate,
    completedTaskCount,
    deliveredPurchases,
    filteredRows,
    getAttachmentLabel,
    getMitigationLabel,
    getSourceLabel,
    loggedHours,
    lowStockMaterials,
    maxMetricHours,
    mechanismAttachmentOptions,
    mechanismMetrics,
    mitigationTaskOptions,
    plannedHours,
    projectAttachmentOptions,
    qaPassCount,
    qaSourceOptions,
    risksBySeverity,
    scopedTaskCount: scopedTasks.length,
    sourceOptionsForType: getSourceOptionsForType,
    subsystemMetrics,
    supplySignals,
    testSourceOptions,
    totalMechanismCount: bootstrap.mechanisms.length,
    totalSubsystemCount: bootstrap.subsystems.length,
    waitingForQaCount,
  };
}
