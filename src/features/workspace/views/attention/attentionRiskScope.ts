import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";

export function buildTaskByReportId(
  bootstrap: BootstrapPayload,
  tasksById: Record<string, BootstrapPayload["tasks"][number]>,
) {
  const taskByReportId = new Map<string, BootstrapPayload["tasks"][number]>();
  for (const report of bootstrap.reports) {
    const task = report.taskId ? tasksById[report.taskId] : undefined;
    if (task) taskByReportId.set(report.id, task);
  }
  return taskByReportId;
}

export function riskMatchesPersonFilter({
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
  if (activePersonFilter.length === 0) return true;
  const mitigationTask = risk.mitigationTaskId ? tasksById[risk.mitigationTaskId] : null;
  const sourceTask = taskByReportId.get(risk.sourceId);
  return [mitigationTask, sourceTask]
    .filter((task): task is BootstrapPayload["tasks"][number] => Boolean(task))
    .some((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task));
}
