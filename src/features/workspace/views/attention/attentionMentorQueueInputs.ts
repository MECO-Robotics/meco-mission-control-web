import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  filterSelectionIncludes,
  filterSelectionMatchesTaskPeople,
} from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";

interface BuildAttentionMentorQueueInputsArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  filteredTasks: BootstrapPayload["tasks"];
  tasksById: Record<string, BootstrapPayload["tasks"][number]>;
}

function indexPurchaseLinkedTasks(tasks: BootstrapPayload["tasks"]) {
  const purchaseLinkedTasksById = new Map<string, BootstrapPayload["tasks"]>();
  for (const task of tasks) {
    for (const purchaseId of task.linkedPurchaseIds) {
      const linkedTasks = purchaseLinkedTasksById.get(purchaseId) ?? [];
      linkedTasks.push(task);
      purchaseLinkedTasksById.set(purchaseId, linkedTasks);
    }
  }

  return purchaseLinkedTasksById;
}

export function buildAttentionMentorQueueInputs({
  activePersonFilter,
  bootstrap,
  filteredTasks,
  tasksById,
}: BuildAttentionMentorQueueInputsArgs) {
  const scopedPurchaseLinkedTasksById = indexPurchaseLinkedTasks(filteredTasks);
  const purchaseLinkedTasksById = indexPurchaseLinkedTasks(
    bootstrap.tasks.filter((task) => task.status !== "complete"),
  );

  const pendingPurchaseApprovals = bootstrap.purchaseItems
    .filter(
      (item) =>
        !item.approvedByMentor &&
        item.status === "requested" &&
        (filterSelectionIncludes(activePersonFilter, item.requestedById) ||
          (scopedPurchaseLinkedTasksById.get(item.id)?.length ?? 0) > 0),
    )
    .sort((left, right) => left.title.localeCompare(right.title));

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

    if (review.subjectType !== "task") {
      return false;
    }

    const sourceTask = tasksById[review.subjectId];
    if (!sourceTask) {
      return false;
    }

    if (activePersonFilter.length === 0) {
      return true;
    }

    return (
      review.participantIds.some((memberId) => activePersonFilter.includes(memberId)) ||
      (sourceTask ? filterSelectionMatchesTaskPeople(activePersonFilter, sourceTask) : false)
    );
  });

  return {
    pendingPurchaseApprovals,
    pendingQaReports,
    pendingQaReviews,
    purchaseLinkedTasksById,
    scopedPurchaseLinkedTasksById,
  };
}
