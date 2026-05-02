import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import { getTaskDependencyRecordsForTask, getTaskDependencyTargetName, TASK_DEPENDENCY_KIND_LABELS } from "../shared/taskTargeting";
import { formatIterationVersion } from "@/lib/appUtils";

interface TaskDetailsDependenciesSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  taskDraft?: TaskPayload;
}

export function TaskDetailsDependenciesSection({
  activeTask,
  bootstrap,
  canInlineEdit,
  taskDraft,
}: TaskDetailsDependenciesSectionProps) {
  const tasksById = Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task] as const));
  const eventsById = Object.fromEntries(bootstrap.events.map((event) => [event.id, event] as const));
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
  );
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
  );
  const dependencyRows = (
    taskDraft?.taskDependencies ??
    getTaskDependencyRecordsForTask(activeTask.id, bootstrap).filter((dependency) => dependency.taskId === activeTask.id)
  ).map((dependency) => ({
    ...dependency,
    name: getTaskDependencyTargetName(dependency.kind, dependency.refId, {
      tasksById,
      eventsById,
      partInstancesById,
      partDefinitionsById,
      formatIterationVersion,
    }),
  }));

  return (
    <div className="task-detail-blocker-split-column">
      <span style={{ color: "var(--text-title)" }}>Dependencies</span>
      {dependencyRows.length > 0 ? (
        <div className="task-detail-list" style={{ marginTop: "0.25rem" }}>
          {dependencyRows.map((dependency) => (
            <div className="workspace-detail-list-item task-detail-list-item" key={dependency.id}>
              <div style={{ minWidth: 0, flex: "1 1 auto", display: "grid", gap: "0.1rem" }}>
                <strong
                  className="task-detail-ellipsis-reveal"
                  data-full-text={dependency.name}
                  style={{ color: "var(--text-title)" }}
                >
                  {dependency.name}
                </strong>
                <div
                  className="task-detail-ellipsis-reveal"
                  data-full-text={`${TASK_DEPENDENCY_KIND_LABELS[dependency.kind]}${dependency.dependencyType ? ` ? ${dependency.dependencyType}` : ""}${dependency.requiredState ? ` ? ${dependency.requiredState}` : ""}`}
                  style={{ color: "var(--text-copy)", fontSize: "0.8rem" }}
                >
                  {TASK_DEPENDENCY_KIND_LABELS[dependency.kind]}
                  {dependency.dependencyType ? ` ? ${dependency.dependencyType}` : ""}
                  {dependency.requiredState ? ` ? ${dependency.requiredState}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
          {canInlineEdit ? "No dependencies yet" : "None"}
        </p>
      )}
    </div>
  );
}
