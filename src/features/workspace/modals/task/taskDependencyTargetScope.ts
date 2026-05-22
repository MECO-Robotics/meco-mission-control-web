import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

interface TaskDependencyTargetScopeArgs {
  bootstrap: BootstrapPayload;
  milestonesById: Record<string, BootstrapPayload["milestones"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  targetProjectId?: string | null;
  tasksById: Record<string, TaskRecord>;
}

export function getScopedTaskDependencyTargets({
  bootstrap,
  milestonesById,
  partInstancesById,
  targetProjectId,
  tasksById,
}: TaskDependencyTargetScopeArgs) {
  const targetTasksById = Object.fromEntries(
    Object.values(tasksById)
      .filter((task) => !targetProjectId || task.projectId === targetProjectId)
      .map((task) => [task.id, task] as const),
  );
  const targetMilestonesById = Object.fromEntries(
    Object.values(milestonesById)
      .filter(
        (milestone) =>
          !targetProjectId ||
          milestone.projectIds.length === 0 ||
          milestone.projectIds.includes(targetProjectId),
      )
      .map((milestone) => [milestone.id, milestone] as const),
  );
  const targetPartInstancesById = Object.fromEntries(
    Object.values(partInstancesById)
      .filter((partInstance) => {
        const subsystem = bootstrap.subsystems.find(
          (candidate) => candidate.id === partInstance.subsystemId,
        );
        return !targetProjectId || subsystem?.projectId === targetProjectId;
      })
      .map((partInstance) => [partInstance.id, partInstance] as const),
  );

  return {
    targetMilestonesById,
    targetPartInstancesById,
    targetTasksById,
  };
}
