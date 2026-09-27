import type { BootstrapPayload } from "@/types/bootstrap";
import type { AttentionTriageGroup, AttentionTriageItem } from "./attentionViewTypes";
import { ATTENTION_DUE_SOON_DAYS } from "./attentionViewHelpers";
import {
  formatContextLabel,
  formatOwnerLabel,
  normalizeDateOnly,
} from "./attentionViewHelpers";

export interface AttentionLookup {
  membersById: Record<string, BootstrapPayload["members"][number]>;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  tasksById: Record<string, BootstrapPayload["tasks"][number]>;
  taskByReportId: Map<string, BootstrapPayload["tasks"][number]>;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
}

export function buildAttentionTriageGroups({
  blockedTasks,
  criticalRisks,
  dueSoonTasks,
  highRisks,
  manufacturingItems,
  overdueTasks,
  purchaseItems,
  reportItems,
  staleTasks,
  waitingQaTasks,
  lookup,
}: {
  blockedTasks: BootstrapPayload["tasks"];
  criticalRisks: BootstrapPayload["risks"];
  dueSoonTasks: BootstrapPayload["tasks"];
  highRisks: BootstrapPayload["risks"];
  manufacturingItems: AttentionTriageItem[];
  overdueTasks: BootstrapPayload["tasks"];
  purchaseItems: AttentionTriageItem[];
  reportItems: AttentionTriageItem[];
  staleTasks: BootstrapPayload["tasks"];
  waitingQaTasks: BootstrapPayload["tasks"];
  lookup: AttentionLookup;
}): AttentionTriageGroup[] {
  return [
    { emptyLabel: "No critical risks in scope.", id: "critical-risks", items: buildRiskTriageItems(criticalRisks, lookup), title: "Critical risks" },
    { emptyLabel: "No high risks in scope.", id: "high-risks", items: buildRiskTriageItems(highRisks, lookup), title: "High risks" },
    { emptyLabel: "No blocked tasks in scope.", id: "blocked-tasks", items: buildTaskTriageItems(blockedTasks, "Blocked", lookup), title: "Blocked tasks" },
    { emptyLabel: "No tasks waiting QA in scope.", id: "waiting-qa", items: buildTaskTriageItems(waitingQaTasks, "Waiting QA", lookup), title: "Waiting for QA" },
    { emptyLabel: "No stale tasks in scope.", id: "stale-tasks", items: buildTaskTriageItems(staleTasks, "Stale", lookup), title: "Stale tasks" },
    { emptyLabel: "No tasks due soon in scope.", id: "due-soon", items: buildTaskTriageItems(dueSoonTasks, `Due <= ${ATTENTION_DUE_SOON_DAYS} days`, lookup), title: "Tasks due soon" },
    { emptyLabel: "No overdue tasks in scope.", id: "overdue", items: buildTaskTriageItems(overdueTasks, "Overdue", lookup), title: "Overdue tasks" },
    { emptyLabel: "No manufacturing blockers in scope.", id: "manufacturing-blockers", items: manufacturingItems, title: "Manufacturing blockers" },
    { emptyLabel: "No purchase delays in scope.", id: "purchase-delays", items: purchaseItems, title: "Purchase delays" },
    { emptyLabel: "No recent failed QA/report signals.", id: "failed-reports", items: reportItems, title: "Recently failed QA / reports" },
  ];
}

export function buildRiskTriageItems(
  rows: BootstrapPayload["risks"],
  lookup: AttentionLookup,
) {
  const {
    membersById,
    projectsById,
    subsystemsById,
    tasksById,
    taskByReportId,
    workstreamsById,
  } = lookup;

  return rows.map<AttentionTriageItem>((risk) => {
    const mitigationTask = risk.mitigationTaskId ? tasksById[risk.mitigationTaskId] : null;
    const sourceTask = taskByReportId.get(risk.sourceId);
    const taskContext = mitigationTask ?? sourceTask;
    const projectName = taskContext ? projectsById[taskContext.projectId]?.name : undefined;
    const workstreamId = taskContext?.workstreamIds[0] ?? null;
    const workstreamName = workstreamId ? workstreamsById[workstreamId]?.name : undefined;
    const subsystemName = taskContext ? subsystemsById[taskContext.subsystemIds[0] ?? ""]?.name : undefined;

    return {
      actionType: "open-risk",
      contextLabel: formatContextLabel({ projectName, subsystemName, workstreamName }),
      id: `risk-${risk.id}`,
      kind: "risk",
      ownerLabel: formatOwnerLabel(
        mitigationTask?.ownerId ? membersById[mitigationTask.ownerId]?.name : null,
      ),
      recordId: risk.id,
      severityLabel: risk.severity === "high" ? "High" : "Medium",
      statusLabel: mitigationTask ? "Mitigation linked" : "Needs mitigation",
      subtitle: risk.detail,
      title: risk.title,
    };
  });
}

export function buildTaskTriageItems(
  rows: BootstrapPayload["tasks"],
  statusLabel: string,
  lookup: AttentionLookup,
) {
  const { membersById, projectsById, subsystemsById, workstreamsById } = lookup;

  return rows.map<AttentionTriageItem>((task) => {
    const workstreamId = task.workstreamIds[0] ?? null;

    return {
      actionType: "open-task",
      contextLabel: formatContextLabel({
        projectName: projectsById[task.projectId]?.name,
        subsystemName: subsystemsById[task.subsystemIds[0] ?? ""]?.name,
        workstreamName: workstreamId ? workstreamsById[workstreamId]?.name : undefined,
      }),
      id: `task-${task.id}`,
      kind: "task",
      ownerLabel: formatOwnerLabel(task.ownerId ? membersById[task.ownerId]?.name : null),
      recordId: task.id,
      severityLabel: task.priority,
      statusLabel,
      subtitle: task.summary,
      title: task.title,
    };
  });
}

export function buildManufacturingTriageItems(
  rows: BootstrapPayload["manufacturingItems"],
  lookup: AttentionLookup,
) {
  const { membersById, projectsById, subsystemsById } = lookup;

  return rows.map<AttentionTriageItem>((item) => ({
    actionType: null,
    contextLabel: formatContextLabel({
      projectName: projectsById[subsystemsById[item.subsystemId]?.projectId]?.name,
      subsystemName: subsystemsById[item.subsystemId]?.name,
    }),
    id: `manufacturing-${item.id}`,
    kind: "manufacturing",
    ownerLabel: formatOwnerLabel(item.requestedById ? membersById[item.requestedById]?.name : null),
    recordId: item.id,
    severityLabel: item.mentorReviewed ? "Watch" : "Needs review",
    statusLabel: item.status,
    subtitle: `Due ${normalizeDateOnly(item.dueDate)} | Qty ${item.quantity}`,
    title: item.title,
  }));
}

export function buildPurchaseTriageItems(
  rows: BootstrapPayload["purchaseItems"],
  lookup: AttentionLookup,
) {
  const { membersById, projectsById, subsystemsById } = lookup;

  return rows.map<AttentionTriageItem>((item) => ({
    actionType: null,
    contextLabel: formatContextLabel({
      projectName: projectsById[subsystemsById[item.subsystemId]?.projectId]?.name,
      subsystemName: subsystemsById[item.subsystemId]?.name,
    }),
    id: `purchase-${item.id}`,
    kind: "purchase",
    ownerLabel: formatOwnerLabel(item.requestedById ? membersById[item.requestedById]?.name : null),
    recordId: item.id,
    severityLabel: "Supply",
    statusLabel: item.status,
    subtitle: `${item.vendor || "Vendor unknown"} | Qty ${item.quantity}`,
    title: item.title,
  }));
}

export function buildReportTriageItems({
  bootstrap,
  failedQaReviews,
  failedReports,
  lookup,
}: {
  bootstrap: BootstrapPayload;
  failedQaReviews: NonNullable<BootstrapPayload["qaReviews"]>;
  failedReports: BootstrapPayload["reports"];
  lookup: AttentionLookup;
}) {
  const { membersById, projectsById, subsystemsById, tasksById } = lookup;

  return [
    ...failedReports.map<AttentionTriageItem>((report) => {
      const task = report.taskId ? tasksById[report.taskId] : null;
      const projectName = report.projectId ? projectsById[report.projectId]?.name : undefined;
      const subsystemName = task ? subsystemsById[task.subsystemIds[0] ?? ""]?.name : undefined;

      return {
        actionType: task ? "open-task" : null,
        contextLabel: formatContextLabel({ projectName, subsystemName }),
        id: `report-${report.id}`,
        kind: "report",
        ownerLabel: formatOwnerLabel(
          report.createdByMemberId ? membersById[report.createdByMemberId]?.name : null,
        ),
        recordId: task?.id ?? report.id,
        severityLabel: report.reportType,
        statusLabel: report.status ?? "flagged",
        subtitle: report.summary || report.notes || "Failed report result",
        title: report.title || "Failed report",
      };
    }),
    ...failedQaReviews.map<AttentionTriageItem>((review) => {
      const sourceTask = review.subjectType === "task" ? tasksById[review.subjectId] : null;
      const sourceManufacturing =
        review.subjectType === "manufacturing"
          ? bootstrap.manufacturingItems.find((item) => item.id === review.subjectId)
          : null;
      const projectName = sourceTask
        ? projectsById[sourceTask.projectId]?.name
        : sourceManufacturing
          ? projectsById[subsystemsById[sourceManufacturing.subsystemId]?.projectId]?.name
          : undefined;
      const subsystemName = sourceTask
        ? subsystemsById[sourceTask.subsystemIds[0] ?? ""]?.name
        : sourceManufacturing
          ? subsystemsById[sourceManufacturing.subsystemId]?.name
          : undefined;

      return {
        actionType: sourceTask ? "open-task" : null,
        contextLabel: formatContextLabel({ projectName, subsystemName }),
        id: `qa-review-${review.id}`,
        kind: "report",
        ownerLabel:
          review.participantIds.length > 0
            ? formatOwnerLabel(membersById[review.participantIds[0]]?.name)
            : "Unassigned",
        recordId: sourceTask?.id ?? review.id,
        severityLabel: "QA",
        statusLabel: review.result,
        subtitle: review.notes,
        title: review.subjectTitle,
      };
    }),
  ];
}
