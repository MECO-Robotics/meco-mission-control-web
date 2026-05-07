import type { BootstrapPayload } from "@/types/bootstrap";
import { formatDate } from "@/lib/appUtils/common";
import {
  formatTaskPlanningState,
  getTaskBlocksTasks,
  getTaskOpenBlockersForTask,
  getTaskPlanningState,
  getTaskWaitingOnDependencies,
} from "@/features/workspace/shared/task/taskPlanning";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";

type MilestoneTaskCardProps = {
  bootstrap: BootstrapPayload;
  task: BootstrapPayload["tasks"][number];
};

export function MilestoneTaskCard({ bootstrap, task }: MilestoneTaskCardProps) {
  const taskPlanningState = getTaskPlanningState(task, bootstrap);
  const blockers = getTaskOpenBlockersForTask(task.id, bootstrap);
  const waitingOn = getTaskWaitingOnDependencies(task.id, bootstrap);
  const blocks = getTaskBlocksTasks(task.id, bootstrap);

  return (
    <div
      style={{
        display: "grid",
        gap: "0.25rem",
        padding: "0.75rem",
        border: "1px solid var(--border-base)",
        borderRadius: "12px",
        background: "var(--bg-row-alt)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <strong style={{ color: "var(--text-title)" }}>{task.title}</strong>
        <span className={getStatusPillClassName(taskPlanningState)}>
          {formatTaskPlanningState(taskPlanningState)}
        </span>
      </div>
      <small style={{ color: "var(--text-copy)" }}>
        Due {formatDate(task.dueDate)}
        {blockers.length > 0 ? ` · blocked by ${blockers.length}` : ""}
        {waitingOn.length > 0 ? ` · waiting on ${waitingOn.length}` : ""}
        {blocks.length > 0 ? ` · blocks ${blocks.length}` : ""}
      </small>
    </div>
  );
}
