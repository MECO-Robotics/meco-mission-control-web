import type { TaskStatus } from "@/types/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord, MilestoneRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getMilestoneProjectIds } from "@/features/workspace/shared/events/eventProjectUtils";

export interface HomeViewModel {
  tasks: TaskRecord[];
  milestones: MilestoneRecord[];
  tasksByStatus: Record<TaskStatus, TaskRecord[]>;
}

export const HOME_TASK_STATUSES: readonly { id: TaskStatus; label: string; tone: string }[] = [
  { id: "unrecorded", label: "Unrecorded", tone: "neutral" },
  { id: "not-started", label: "Not started", tone: "neutral" },
  { id: "in-progress", label: "In progress", tone: "info" },
  { id: "waiting-for-qa", label: "Waiting for QA", tone: "warning" },
  { id: "complete", label: "Complete", tone: "success" },
] as const;

function milestoneIsVisible(milestone: MilestoneRecord, projectId: string | null) {
  if (!projectId) return true;
  const projectIds = getMilestoneProjectIds(milestone);
  return projectIds.length === 0 || projectIds.includes(projectId);
}

export function buildHomeViewModel({
  activePersonFilter = [],
  bootstrap,
  projectId = null,
  search = "",
}: {
  activePersonFilter?: FilterSelection;
  bootstrap: BootstrapPayload;
  projectId?: string | null;
  search?: string;
}): HomeViewModel {
  const query = search.trim().toLocaleLowerCase();
  const matches = (value: string) => value.toLocaleLowerCase().includes(query);
  const scopedTasks = bootstrap.tasks.filter((task) =>
    (!projectId || task.projectId === projectId) && filterSelectionMatchesTaskPeople(activePersonFilter, task) && matches(`${task.title} ${task.summary}`),
  );
  const tasksByStatus = Object.fromEntries(HOME_TASK_STATUSES.map(({ id }) => [
    id,
    scopedTasks.filter((task) => task.status === id),
  ])) as Record<TaskStatus, TaskRecord[]>;
  const milestones = bootstrap.milestones.filter(milestone => milestoneIsVisible(milestone, projectId)
    && matches(`${milestone.title} ${milestone.description}`));
  return { tasks: scopedTasks, milestones, tasksByStatus };
}
