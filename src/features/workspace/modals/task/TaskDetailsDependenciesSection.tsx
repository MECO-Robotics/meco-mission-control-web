import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyKind, TaskDependencyType } from "@/types/common";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatIterationVersion } from "@/lib/appUtils/common";
import {
  getTaskDependencyRecordsForTask,
  getTaskDependencyTargetName,
  getTaskDependencyTargetOptions,
} from "../../shared/task/taskTargeting";
import { TaskDetailsDependencyAddMenu } from "./details/sections/TaskDetailsDependencyAddMenu";
import { TaskDetailsDependencyRowList } from "./TaskDetailsDependencyRowList";
import { getScopedTaskDependencyTargets } from "./taskDependencyTargetScope";

interface TaskDetailsDependenciesSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  collapsibleOpen?: boolean;
  onCollapsibleToggle?: (open: boolean) => void;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  targetProjectId?: string | null;
  taskDraft?: TaskPayload;
}

function getDependencyDefaultState(kind: TaskDependencyKind) {
  return kind === "part_instance" || kind === "milestone" ? "ready" : "complete";
}

function getDependencyKey(dependency: { id?: string } | undefined, index: number) {
  return dependency?.id ?? `dependency-${index}`;
}

export function TaskDetailsDependenciesSection({
  activeTask,
  bootstrap,
  canInlineEdit,
  collapsibleOpen,
  onCollapsibleToggle,
  setTaskDraft,
  targetProjectId,
  taskDraft,
}: TaskDetailsDependenciesSectionProps) {
  const [editingDependencyKey, setEditingDependencyKey] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(true);

  useEffect(() => {
    setInternalOpen(true);
  }, [activeTask.id]);

  const dependencyDraftCount = taskDraft?.taskDependencies?.length ?? 0;

  useEffect(() => {
    if (!canInlineEdit) {
      return;
    }

    const dependencyDrafts = taskDraft?.taskDependencies ?? [];
    const placeholderIndex = dependencyDrafts.findIndex((dependency) => !dependency.refId.trim());
    if (placeholderIndex >= 0) {
      setEditingDependencyKey(getDependencyKey(dependencyDrafts[placeholderIndex], placeholderIndex));
    }
  }, [activeTask.id, canInlineEdit, dependencyDraftCount]);

  const tasksById = Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task] as const));
  const milestonesById = Object.fromEntries(
    bootstrap.milestones.map((milestone) => [milestone.id, milestone] as const),
  );
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
  );
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
  );
  const {
    targetMilestonesById,
    targetPartInstancesById,
    targetTasksById,
  } = getScopedTaskDependencyTargets({
    bootstrap,
    milestonesById,
    partInstancesById,
    targetProjectId,
    tasksById,
  });
  const dependencyRows = (
    taskDraft?.taskDependencies ??
    getTaskDependencyRecordsForTask(activeTask.id, bootstrap).filter((dependency) => dependency.taskId === activeTask.id)
  ).map((dependency, index) => {
    const key = getDependencyKey(dependency, index);

    return {
        ...dependency,
        key,
        name: getTaskDependencyTargetName(dependency.kind, dependency.refId, {
          tasksById,
          milestonesById,
          partInstancesById,
          partDefinitionsById,
          formatIterationVersion,
        }),
      };
    });
  const getDependencyTargetOptions = (kind: TaskDependencyKind) =>
    getTaskDependencyTargetOptions(kind, {
      tasksById: targetTasksById,
      milestonesById: targetMilestonesById,
      partInstancesById: targetPartInstancesById,
      partDefinitionsById,
      formatIterationVersion,
    });
  const isOpen = collapsibleOpen ?? internalOpen;

  const updateDependencyDraft = (
    dependencyKey: string,
    updates: Partial<NonNullable<TaskPayload["taskDependencies"]>[number]>,
  ) => {
    setTaskDraft?.((current) => {
      const nextDependencyDrafts = [...(current.taskDependencies ?? [])];
      const index = nextDependencyDrafts.findIndex(
        (dependency, currentIndex) => getDependencyKey(dependency, currentIndex) === dependencyKey,
      );
      if (index < 0) {
        return current;
      }

      const existingDraft = nextDependencyDrafts[index];
      nextDependencyDrafts[index] = {
        ...existingDraft,
        requiredState:
          updates.kind !== undefined && updates.kind !== existingDraft.kind
            ? getDependencyDefaultState(updates.kind)
            : updates.requiredState ?? existingDraft.requiredState,
        ...updates,
      };

      return {
        ...current,
        taskDependencies: nextDependencyDrafts,
      };
    });
  };

  const addDependencyDraft = (kind: TaskDependencyKind, refId = "") => {
    const dependencyId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `dependency-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setTaskDraft?.((current) => ({
      ...current,
      taskDependencies: [
        ...(current.taskDependencies ?? []),
        {
          id: dependencyId,
          kind,
          refId,
          requiredState: getDependencyDefaultState(kind),
          dependencyType: "hard" as TaskDependencyType,
        },
      ],
    }));
    setEditingDependencyKey(dependencyId);
  };

  const removeDependencyDraft = (dependencyKey: string) => {
    setTaskDraft?.((current) => ({
      ...current,
      taskDependencies: (current.taskDependencies ?? []).filter(
        (dependency, currentIndex) => getDependencyKey(dependency, currentIndex) !== dependencyKey,
      ),
    }));
    setEditingDependencyKey((current) => (current === dependencyKey ? null : current));
  };

  return (
    <div className="task-detail-blocker-split-column task-detail-collapsible-field">
      <details
        className="task-detail-collapsible"
        open={isOpen}
        onToggle={(milestone) => {
          const nextOpen = milestone.currentTarget.open;
          setInternalOpen(nextOpen);
          onCollapsibleToggle?.(nextOpen);
        }}
      >
        <summary className="task-detail-collapsible-summary task-detail-collapsible-summary-inline">
          <span className="task-detail-collapsible-summary-main">
            <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
            <span className="task-detail-copy">Dependencies</span>
          </span>
          {canInlineEdit ? (
            <TaskDetailsDependencyAddMenu
              className="task-details-section-add-menu task-details-dependency-kind-menu"
              getTargetOptions={getDependencyTargetOptions}
              menuClassName="task-details-dependency-menu-popup"
              onAddDependency={addDependencyDraft}
            />
          ) : null}
        </summary>
        <div className="task-detail-collapsible-body">
          {dependencyRows.length > 0 ? (
            <TaskDetailsDependencyRowList
              canInlineEdit={canInlineEdit}
              dependencyRows={dependencyRows}
              editingDependencyKey={editingDependencyKey}
              getDependencyDefaultState={getDependencyDefaultState}
              getDependencyTargetOptions={getDependencyTargetOptions}
              removeDependencyDraft={removeDependencyDraft}
              setEditingDependencyKey={setEditingDependencyKey}
              setTaskDraft={setTaskDraft}
              updateDependencyDraft={updateDependencyDraft}
            />
          ) : (
            <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
              {canInlineEdit ? "No dependencies yet" : "None"}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
