import type { TaskStatus } from "@/types/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord, MilestoneRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getMilestoneProjectIds } from "@/features/workspace/shared/events/eventProjectUtils";

export interface HomeViewModel {
  upcomingMilestones: MilestoneRecord[];
  tasksByStatus: Record<TaskStatus, TaskRecord[]>;
}

export const HOME_TASK_STATUSES: readonly { id: TaskStatus; label: string; tone: string }[] = [
  { id: "not-started", label: "Not started", tone: "neutral" },
  { id: "in-progress", label: "In progress", tone: "info" },
  { id: "waiting-for-qa", label: "Waiting for QA", tone: "warning" },
  { id: "complete", label: "Complete", tone: "success" },
] as const;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function milestoneIsVisible(milestone: MilestoneRecord, projectId: string | null) {
  if (!projectId) return true;
  const projectIds = getMilestoneProjectIds(milestone);
  return projectIds.length === 0 || projectIds.includes(projectId);
}

export function buildHomeViewModel({
  activePersonFilter = [],
  bootstrap,
  projectId = null,
  today = new Date(),
}: {
  activePersonFilter?: FilterSelection;
  bootstrap: BootstrapPayload;
  projectId?: string | null;
  today?: Date;
}): HomeViewModel {
  const scopedTasks = bootstrap.tasks.filter((task) =>
    (!projectId || task.projectId === projectId) && filterSelectionMatchesTaskPeople(activePersonFilter, task),
  );
  const tasksByStatus = Object.fromEntries(HOME_TASK_STATUSES.map(({ id }) => [
    id,
    scopedTasks.filter((task) => task.status === id),
  ])) as Record<TaskStatus, TaskRecord[]>;
  const todayStart = startOfLocalDay(today);
  const upcomingMilestones = bootstrap.milestones
    .filter((milestone) => milestone.status !== "complete" && milestoneIsVisible(milestone, projectId))
    .filter((milestone) => {
      const start = new Date(`${milestone.startAt.slice(0, 10)}T00:00:00`).getTime();
      return Number.isFinite(start) && start >= todayStart;
    })
    .sort((left, right) => left.startAt.localeCompare(right.startAt))
    .slice(0, 4);

  return { upcomingMilestones, tasksByStatus };
}
