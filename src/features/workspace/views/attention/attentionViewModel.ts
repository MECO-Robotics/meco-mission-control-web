import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  filterSelectionIncludes,
  filterSelectionMatchesTaskPeople,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { isTaskDueSoon } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import { buildTaskLastUpdatedAtById } from "./attentionActionNowShared";
import {
  isDateOverdue,
  isWithinRecentWindow,
} from "./attentionViewHelpers";
import {
  buildManufacturingTriageItems,
  buildPurchaseTriageItems,
  buildReportTriageItems,
  buildAttentionTriageGroups,
} from "./attentionTriageItems";
import { buildAttentionSummaryGroups } from "./attentionSummaryGroups";
import { buildAttentionActionNowItems } from "./attentionActionNowItems";
import { buildAttentionMentorQueueInputs } from "./attentionMentorQueueInputs";
import { buildMentorActionQueueItems } from "./mentorActionQueueModel";
import { detectStaleTasks } from "./staleTaskDetector";
import { buildTaskByReportId, riskMatchesPersonFilter } from "./attentionRiskScope";
import type {
  AttentionSummaryGroup,
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
  const {
    pendingPurchaseApprovals,
    pendingQaReports,
    pendingQaReviews,
    purchaseLinkedTasksById,
    scopedPurchaseLinkedTasksById,
  } = buildAttentionMentorQueueInputs({
    activePersonFilter,
    bootstrap,
    filteredTasks,
    tasksById,
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

  const triageGroups = buildAttentionTriageGroups({
    blockedTasks,
    criticalRisks,
    dueSoonTasks,
    highRisks,
    lookup,
    manufacturingItems,
    overdueTasks,
    purchaseItems,
    reportItems,
    staleTasks,
    waitingQaTasks,
  });

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
    taskLastUpdatedAtById,
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
    scopedPurchaseLinkedTasksById,
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
