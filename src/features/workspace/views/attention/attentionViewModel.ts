import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  filterSelectionIncludes,
  filterSelectionMatchesTaskPeople,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { isTaskDueSoon } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import { buildTaskLastUpdatedAtById } from "./attentionActionNowShared";
import {
  ATTENTION_DUE_SOON_DAYS,
  isDateOverdue,
  isWithinRecentWindow,
} from "./attentionViewHelpers";
import {
  buildManufacturingTriageItems,
  buildPurchaseTriageItems,
  buildReportTriageItems,
  buildRiskTriageItems,
  buildTaskTriageItems,
} from "./attentionTriageItems";
import { buildAttentionSummaryGroups } from "./attentionSummaryGroups";
import { buildAttentionActionNowItems } from "./attentionActionNowItems";
import { buildMentorActionQueueItems } from "./mentorActionQueueModel";
import { detectStaleTasks } from "./staleTaskDetector";
import type {
  AttentionSummaryGroup,
  AttentionTriageGroup,
  AttentionViewModel,
} from "./attentionViewTypes";

export type {
  AttentionNowItem,
  AttentionReason,
  AttentionSummaryCategory,
  AttentionSummaryCard,
  AttentionSummaryGroup,
  AttentionTriageGroup,
  AttentionTriageItem,
  AttentionViewModel,
  MentorActionQueueItem,
} from "./attentionViewTypes";

interface BuildAttentionViewModelArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
}

function buildTaskByReportId(
  bootstrap: BootstrapPayload,
  tasksById: Record<string, BootstrapPayload["tasks"][number]>,
) {
  const taskByReportId = new Map<string, BootstrapPayload["tasks"][number]>();

  for (const report of bootstrap.reports) {
    if (!report.taskId) {
      continue;
    }

    const task = tasksById[report.taskId];
    if (task) {
      taskByReportId.set(report.id, task);
    }
  }

  return taskByReportId;
}

function riskMatchesPersonFilter({
  activePersonFilter,
  risk,
  taskByReportId,
  tasksById,
}: {
  activePersonFilter: FilterSelection;
  risk: BootstrapPayload["risks"][number];
  taskByReportId: Map<string, BootstrapPayload["tasks"][number]>;
  tasksById: Record<string, BootstrapPayload["tasks"][number]>;
}) {
  if (activePersonFilter.length === 0) {
    return true;
  }

  const mitigationTask = risk.mitigationTaskId ? tasksById[risk.mitigationTaskId] : null;
  const sourceTask = taskByReportId.get(risk.sourceId);
  return [mitigationTask, sourceTask]
    .filter((task): task is BootstrapPayload["tasks"][number] => Boolean(task))
    .some((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task));
}

export function buildAttentionViewModel({
  activePersonFilter,
  bootstrap,
}: BuildAttentionViewModelArgs): AttentionViewModel {
  const membersById = Object.fromEntries(
    bootstrap.members.map((member) => [member.id, member] as const),
  );
  const projectsById = Object.fromEntries(
    bootstrap.projects.map((project) => [project.id, project] as const),
  );
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  );
  const workstreamsById = Object.fromEntries(
    bootstrap.workstreams.map((workstream) => [workstream.id, workstream] as const),
  );
  const tasksById = Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task] as const));

  const filteredTasks = bootstrap.tasks.filter(
    (task) =>
      filterSelectionMatchesTaskPeople(activePersonFilter, task) && task.status !== "complete",
  );

  const taskByReportId = buildTaskByReportId(bootstrap, tasksById);

  const criticalRisks = bootstrap.risks
    .filter((risk) => risk.severity === "high" && !risk.mitigationTaskId)
    .filter((risk) =>
      riskMatchesPersonFilter({
        activePersonFilter,
        risk,
        taskByReportId,
        tasksById,
      }),
    );

  const highRisks = bootstrap.risks
    .filter((risk) => risk.severity === "high" && Boolean(risk.mitigationTaskId))
    .filter((risk) =>
      riskMatchesPersonFilter({
        activePersonFilter,
        risk,
        taskByReportId,
        tasksById,
      }),
    );

  const blockedTasks = filteredTasks.filter(
    (task) =>
      task.isBlocked ||
      task.blockers.length > 0 ||
      task.planningState === "blocked" ||
      task.planningState === "waiting-on-dependency",
  );
  const waitingQaTasks = filteredTasks.filter((task) => task.status === "waiting-for-qa");
  const overdueTasks = filteredTasks.filter((task) => task.dueDate && isDateOverdue(task.dueDate));
  const dueSoonTasks = filteredTasks.filter(
    (task) =>
      task.dueDate &&
      !isDateOverdue(task.dueDate) &&
      isTaskDueSoon(task.dueDate, new Date()) &&
      task.status !== "waiting-for-qa",
  );
  const taskLastUpdatedAtById = buildTaskLastUpdatedAtById(bootstrap);
  const staleTaskResults = detectStaleTasks({
    taskBlockers: bootstrap.taskBlockers,
    taskLastUpdatedAtById,
    tasks: filteredTasks,
  });
  const staleTasks = staleTaskResults.map((result) => result.task);

  const manufacturingBlockers = bootstrap.manufacturingItems
    .filter(
      (item) =>
        item.status !== "complete" &&
        filterSelectionIncludes(activePersonFilter, item.requestedById) &&
        (!item.mentorReviewed ||
          item.status === "requested" ||
          item.status === "approved" ||
          isDateOverdue(item.dueDate)),
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

  const purchaseDelays = bootstrap.purchaseItems
    .filter(
      (item) =>
        item.status !== "delivered" &&
        filterSelectionIncludes(activePersonFilter, item.requestedById),
    )
    .sort((left, right) => left.status.localeCompare(right.status));
  const purchaseLinkedTasksById = new Map<string, BootstrapPayload["tasks"]>();
  for (const task of filteredTasks) {
    for (const purchaseId of task.linkedPurchaseIds) {
      const linkedTasks = purchaseLinkedTasksById.get(purchaseId) ?? [];
      linkedTasks.push(task);
      purchaseLinkedTasksById.set(purchaseId, linkedTasks);
    }
  }
  const pendingPurchaseApprovals = bootstrap.purchaseItems
    .filter(
      (item) =>
        !item.approvedByMentor &&
        item.status === "requested" &&
        (filterSelectionIncludes(activePersonFilter, item.requestedById) ||
          (purchaseLinkedTasksById.get(item.id)?.length ?? 0) > 0),
    )
    .sort((left, right) => left.title.localeCompare(right.title));

  const failedReports = bootstrap.reports
    .filter((report) => report.status === "fail" || report.status === "blocked")
    .filter((report) => {
      if (activePersonFilter.length > 0) {
        const sourceTask = report.taskId ? tasksById[report.taskId] : null;
        if (
          !filterSelectionIncludes(activePersonFilter, report.createdByMemberId) &&
          !(sourceTask && filterSelectionMatchesTaskPeople(activePersonFilter, sourceTask))
        ) {
          return false;
        }
      }

      return report.createdAt ? isWithinRecentWindow(report.createdAt) : true;
    });

  const failedQaReviews = (bootstrap.qaReviews ?? []).filter((review) => {
    if (review.result === "pass") {
      return false;
    }

    if (activePersonFilter.length > 0) {
      const participantMatches = review.participantIds.some((memberId) =>
        activePersonFilter.includes(memberId),
      );
      if (!participantMatches) {
        return false;
      }
    }

    return isWithinRecentWindow(review.reviewedAt);
  });
  const pendingQaReports = bootstrap.reports.filter((report) => {
    if (report.reportType !== "QA" || report.mentorApproved === true) {
      return false;
    }

    if (activePersonFilter.length === 0) {
      return true;
    }

    const sourceTask = report.taskId ? tasksById[report.taskId] : null;
    return (
      filterSelectionIncludes(activePersonFilter, report.createdByMemberId) ||
      (sourceTask ? filterSelectionMatchesTaskPeople(activePersonFilter, sourceTask) : false)
    );
  });
  const pendingQaReviews = (bootstrap.qaReviews ?? []).filter((review) => {
    if (review.mentorApproved === true) {
      return false;
    }

    if (activePersonFilter.length === 0) {
      return true;
    }

    const sourceTask = review.subjectType === "task" ? tasksById[review.subjectId] : null;
    return (
      review.participantIds.some((memberId) => activePersonFilter.includes(memberId)) ||
      (sourceTask ? filterSelectionMatchesTaskPeople(activePersonFilter, sourceTask) : false)
    );
  });

  const lookup = {
    membersById,
    projectsById,
    subsystemsById,
    tasksById,
    taskByReportId,
    workstreamsById,
  };

  const manufacturingItems = buildManufacturingTriageItems(manufacturingBlockers, lookup);
  const purchaseItems = buildPurchaseTriageItems(purchaseDelays, lookup);
  const reportItems = buildReportTriageItems({
    bootstrap,
    failedQaReviews,
    failedReports,
    lookup,
  });

  const summaryGroups: AttentionSummaryGroup[] = buildAttentionSummaryGroups({
    blockedTasks: blockedTasks.length,
    criticalRisks: criticalRisks.length,
    dueSoonTasks: dueSoonTasks.length,
    failedReports: reportItems.length,
    highRisks: highRisks.length,
    manufacturingBlockers: manufacturingItems.length,
    overdueTasks: overdueTasks.length,
    purchaseDelays: purchaseItems.length,
    staleTasks: staleTaskResults.length,
    waitingQaTasks: waitingQaTasks.length,
  });

  const triageGroups: AttentionTriageGroup[] = [
    {
      emptyLabel: "No critical risks in scope.",
      id: "critical-risks",
      items: buildRiskTriageItems(criticalRisks, lookup),
      title: "Critical risks",
    },
    {
      emptyLabel: "No high risks in scope.",
      id: "high-risks",
      items: buildRiskTriageItems(highRisks, lookup),
      title: "High risks",
    },
    {
      emptyLabel: "No blocked tasks in scope.",
      id: "blocked-tasks",
      items: buildTaskTriageItems(blockedTasks, "Blocked", lookup),
      title: "Blocked tasks",
    },
    {
      emptyLabel: "No tasks waiting QA in scope.",
      id: "waiting-qa",
      items: buildTaskTriageItems(waitingQaTasks, "Waiting QA", lookup),
      title: "Waiting for QA",
    },
    {
      emptyLabel: "No stale tasks in scope.",
      id: "stale-tasks",
      items: buildTaskTriageItems(staleTasks, "Stale", lookup),
      title: "Stale tasks",
    },
    {
      emptyLabel: "No tasks due soon in scope.",
      id: "due-soon",
      items: buildTaskTriageItems(dueSoonTasks, `Due <= ${ATTENTION_DUE_SOON_DAYS} days`, lookup),
      title: "Tasks due soon",
    },
    {
      emptyLabel: "No overdue tasks in scope.",
      id: "overdue",
      items: buildTaskTriageItems(overdueTasks, "Overdue", lookup),
      title: "Overdue tasks",
    },
    {
      emptyLabel: "No manufacturing blockers in scope.",
      id: "manufacturing-blockers",
      items: manufacturingItems,
      title: "Manufacturing blockers",
    },
    {
      emptyLabel: "No purchase delays in scope.",
      id: "purchase-delays",
      items: purchaseItems,
      title: "Purchase delays",
    },
    {
      emptyLabel: "No recent failed QA/report signals.",
      id: "failed-reports",
      items: reportItems,
      title: "Recently failed QA / reports",
    },
  ];

  const actionNowItems = buildAttentionActionNowItems({
    blockedTasks,
    bootstrap,
    criticalRisks,
    failedQaReviews,
    failedReports,
    highRisks,
    lookup,
    manufacturingBlockers,
    overdueTasks,
    purchaseDelays,
    staleTaskResults,
    waitingQaTasks,
  });
  const mentorQueueItems = buildMentorActionQueueItems({
    blockedTasks,
    lookup,
    pendingQaReports,
    pendingQaReviews,
    pendingPurchaseApprovals,
    purchaseLinkedTasksById,
    riskReviewItems: [...criticalRisks, ...highRisks],
    staleTaskResults,
    waitingQaTasks,
  });

  return {
    actionNowItems,
    mentorQueueItems,
    summaryGroups,
    triageGroups,
  };
}
