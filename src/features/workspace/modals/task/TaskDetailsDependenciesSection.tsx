import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyKind, TaskDependencyType } from "@/types/common";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatIterationVersion } from "@/lib/appUtils/common";
import { IconTasks, IconTrash } from "@/components/shared/Icons";
import { FilterDropdown } from "../../shared/filters/FilterDropdown";
import {
  getTaskDependencyRecordsForTask,
  getTaskDependencyTargetName,
  TASK_DEPENDENCY_KIND_LABELS,
  TASK_DEPENDENCY_KIND_OPTIONS,
  TASK_DEPENDENCY_TYPE_LABELS,
  getTaskDependencyTargetOptions,
} from "../../shared/task/taskTargeting";
import { TaskDetailReveal } from "./details/TaskDetailReveal";
import { TaskDetailsDependencyAddMenu } from "./details/sections/TaskDetailsDependencyAddMenu";

interface TaskDetailsDependenciesSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  collapsibleOpen?: boolean;
  onCollapsibleToggle?: (open: boolean) => void;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
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
  taskDraft,
}: TaskDetailsDependenciesSectionProps) {
  const [editingDependencyKey, setEditingDependencyKey] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState(true);

  useEffect(() => {
    setInternalOpen(true);
  }, [activeTask.id]);

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
  const dependencyKindOptions = TASK_DEPENDENCY_KIND_OPTIONS;
  const getDependencyTargetOptions = (kind: TaskDependencyKind) =>
    getTaskDependencyTargetOptions(kind, {
      tasksById,
      milestonesById,
      partInstancesById,
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
            <div className="task-details-dependency-editor">
              {dependencyRows.map((dependency, index) => {
                const isEditing = canInlineEdit && editingDependencyKey === dependency.key;
                const targetOptions = getDependencyTargetOptions(dependency.kind);

                if (isEditing && setTaskDraft) {
                  return (
                    <div className="task-details-dependency-row task-details-dependency-row-edit" key={dependency.key}>
                      <label className="field task-details-dependency-editor-field">
                        <span style={{ color: "var(--text-title)" }}>Type</span>
                        <FilterDropdown
                          allLabel="Select dependency type"
                          ariaLabel="Set dependency type"
                          buttonInlineEditField={`dependency-kind-${index}`}
                          className="task-queue-filter-menu-submenu task-details-dependency-kind-menu"
                          icon={<IconTasks />}
                          menuClassName="task-details-dependency-menu-popup"
                          onChange={(selection) =>
                            updateDependencyDraft(dependency.key, {
                              kind: selection[0] as TaskDependencyKind,
                              refId: "",
                            })
                          }
                          options={dependencyKindOptions}
                          portalMenu
                          portalMenuPlacement="below"
                          singleSelect
                          value={[dependency.kind]}
                        />
                      </label>
                      <label className="field task-details-dependency-editor-field">
                <span style={{ color: "var(--text-title)" }}>Depends on</span>
                <FilterDropdown
                  allLabel={`Select ${TASK_DEPENDENCY_KIND_LABELS[dependency.kind].toLowerCase()}`}
                  ariaLabel="Set dependency target"
                  buttonInlineEditField={`dependency-target-${index}`}
                  className="task-queue-filter-menu-submenu task-details-dependency-target-menu"
                  icon={<IconTasks />}
                          menuClassName="task-details-dependency-menu-popup"
                          onChange={(selection) =>
                            updateDependencyDraft(dependency.key, {
                              refId: selection[0] ?? "",
                            })
                          }
                          options={targetOptions}
                          portalMenu
                          portalMenuPlacement="below"
                          singleSelect
                          value={dependency.refId ? [dependency.refId] : []}
                        />
                      </label>
                    </div>
                  );
                }

                return (
                  <div
                    className={`workspace-detail-list-item task-detail-list-item task-details-dependency-row ${
                      canInlineEdit ? "task-details-dependency-row-with-delete" : ""
                    }`}
                    key={dependency.key}
                  >
                    {canInlineEdit ? (
                      <button
                        aria-label={`Remove dependency ${index + 1}`}
                        className="icon-button task-details-dependency-row-remove-button"
                        onClick={() => removeDependencyDraft(dependency.key)}
                        type="button"
                      >
                        <IconTrash />
                      </button>
                    ) : null}
                    <div className="task-details-dependency-row-content">
                      <TaskDetailReveal
                        className="task-detail-ellipsis-reveal"
                        style={{ color: "var(--text-title)", fontWeight: 800 }}
                        text={dependency.name}
                      />
                      <TaskDetailReveal
                        className="task-detail-ellipsis-reveal"
                        style={{ color: "var(--text-copy)", fontSize: "0.8rem" }}
                        text={`${TASK_DEPENDENCY_KIND_LABELS[dependency.kind]}${dependency.dependencyType ? ` / ${TASK_DEPENDENCY_TYPE_LABELS[dependency.dependencyType]}` : ""}${dependency.requiredState ? ` / ${dependency.requiredState}` : ""}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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
