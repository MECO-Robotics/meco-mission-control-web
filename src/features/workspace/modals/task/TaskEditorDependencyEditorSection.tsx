import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyKind, TaskDependencyType } from "@/types/common";
import type { TaskPayload } from "@/types/payloads";
import { IconTasks, IconTrash } from "@/components/shared/Icons";
import { formatIterationVersion } from "@/lib/appUtils/common";
import { FilterDropdown } from "../../shared/filters/FilterDropdown";
import {
  TASK_DEPENDENCY_KIND_LABELS,
  TASK_DEPENDENCY_KIND_OPTIONS,
  TASK_DEPENDENCY_TYPE_LABELS,
  getTaskDependencyTargetOptions,
} from "../../shared/task/taskTargeting";

interface TaskEditorDependencyEditorSectionProps {
  bootstrap: BootstrapPayload;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
  showHeader?: boolean;
}

function getDependencyDefaultState(kind: TaskDependencyKind) {
  return kind === "part_instance" || kind === "milestone" ? "ready" : "complete";
}

export function TaskEditorDependencyEditorSection({
  bootstrap,
  setTaskDraft,
  taskDraft,
  showHeader = true,
}: TaskEditorDependencyEditorSectionProps) {
  const dependencyTaskOptions = [...bootstrap.tasks]
    .filter((task) => task.projectId === taskDraft.projectId)
    .sort((left, right) => left.title.localeCompare(right.title));
  const dependencyDrafts = taskDraft.taskDependencies ?? [];
  const visibleDependencyDrafts =
    dependencyDrafts.length > 0
      ? dependencyDrafts
      : [
          {
            kind: "task" as TaskDependencyKind,
            refId: "",
            requiredState: "complete",
            dependencyType: "hard" as TaskDependencyType,
          },
        ];
  const dependencyKindOptions = TASK_DEPENDENCY_KIND_OPTIONS;
  const dependencyTypeOptions = Object.entries(TASK_DEPENDENCY_TYPE_LABELS).map(([type, label]) => ({
    id: type,
    name: label,
    icon: <IconTasks />,
  }));
  const dependencyMilestoneOptions = bootstrap.milestones
    .filter((milestone) =>
      milestone.projectIds.length === 0 ? true : milestone.projectIds.includes(taskDraft.projectId),
    )
    .sort((left, right) => left.title.localeCompare(right.title));
  const getDependencyTargetOptions = (kind: TaskDependencyKind) =>
    getTaskDependencyTargetOptions(kind, {
      tasksById: Object.fromEntries(dependencyTaskOptions.map((task) => [task.id, task] as const)),
      milestonesById: Object.fromEntries(
        dependencyMilestoneOptions.map((milestone) => [milestone.id, milestone] as const),
      ),
      partInstancesById: Object.fromEntries(
        bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
      ),
      partDefinitionsById: Object.fromEntries(
        bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
      ),
      formatIterationVersion,
    });
  const updateDependencyDraft = (
    index: number,
    updates: Partial<NonNullable<TaskPayload["taskDependencies"]>[number]>,
  ) => {
    setTaskDraft((current) => {
      const nextDependencyDrafts = [...(current.taskDependencies ?? [])];
      const existingDraft =
        nextDependencyDrafts[index] ?? {
          kind: "task" as TaskDependencyKind,
          refId: "",
          requiredState: "complete",
          dependencyType: "hard" as TaskDependencyType,
        };

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
  const addDependencyDraft = () => {
    setTaskDraft((current) => ({
      ...current,
      taskDependencies: [
        ...(current.taskDependencies ?? []),
        {
          kind: "task" as TaskDependencyKind,
          refId: "",
          requiredState: "complete",
          dependencyType: "hard" as TaskDependencyType,
        },
      ],
    }));
  };
  const removeDependencyDraft = (index: number) => {
    setTaskDraft((current) => ({
      ...current,
      taskDependencies: (current.taskDependencies ?? []).filter(
        (_dependency, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  return (
    <div className={showHeader ? "field modal-wide" : undefined}>
      {showHeader ? (
        <>
          <span style={{ color: "var(--text-title)" }}>Dependencies</span>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
            Structured prerequisites. Hard dependencies gate waiting state; soft dependencies are advisory.
          </p>
        </>
      ) : null}
      <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
        {visibleDependencyDrafts.map((dependency, index) => {
          const targetOptions = getDependencyTargetOptions(dependency.kind);

          return (
            <div
              key={dependency.id ?? `dependency-${index}`}
              style={{
                position: "relative",
                display: "grid",
                gap: "0.75rem",
                padding: "0.75rem 2.75rem 0.75rem 0.75rem",
                border: "1px solid var(--border-base)",
                borderRadius: "12px",
                background: "var(--bg-row-alt)",
              }}
            >
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Dependency kind</span>
                <FilterDropdown
                  allLabel="Select dependency kind"
                  ariaLabel="Set dependency kind"
                  buttonInlineEditField={`dependency-kind-${index}`}
                  className="task-queue-filter-menu-submenu task-details-dependency-kind-menu"
                  icon={<IconTasks />}
                  menuClassName="task-details-dependency-menu-popup"
                  onChange={(selection) =>
                    updateDependencyDraft(index, {
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
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Depends on</span>
                <FilterDropdown
                  allLabel={`Select ${TASK_DEPENDENCY_KIND_LABELS[dependency.kind].toLowerCase()}`}
                  ariaLabel="Set dependency target"
                  buttonInlineEditField={`dependency-target-${index}`}
                  className="task-queue-filter-menu-submenu task-details-dependency-target-menu"
                  icon={<IconTasks />}
                  menuClassName="task-details-dependency-menu-popup"
                  onChange={(selection) =>
                    updateDependencyDraft(index, {
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
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Required state</span>
                <input
                  onChange={(milestone) =>
                    updateDependencyDraft(index, {
                      requiredState: milestone.target.value,
                    })
                  }
                  placeholder={getDependencyDefaultState(dependency.kind)}
                  style={{
                    background: "var(--bg-panel)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
                  value={dependency.requiredState ?? ""}
                />
              </label>
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Dependency type</span>
                <FilterDropdown
                  allLabel="Select dependency type"
                  ariaLabel="Set dependency type"
                  buttonInlineEditField={`dependency-type-${index}`}
                  className="task-queue-filter-menu-submenu task-details-dependency-type-menu"
                  icon={<IconTasks />}
                  menuClassName="task-details-dependency-menu-popup"
                  onChange={(selection) =>
                    updateDependencyDraft(index, {
                      dependencyType: selection[0] as TaskDependencyType,
                    })
                  }
                  options={dependencyTypeOptions}
                  portalMenu
                  portalMenuPlacement="below"
                  singleSelect
                  value={[dependency.dependencyType]}
                />
              </label>
              {dependencyDrafts.length > 0 ? (
                <button
                  aria-label="Remove dependency"
                  className="icon-button task-details-draft-remove-button"
                  onClick={() => removeDependencyDraft(index)}
                  type="button"
                >
                  <IconTrash />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        className="secondary-action"
        onClick={addDependencyDraft}
        style={{ marginTop: "0.75rem" }}
        type="button"
      >
        Add dependency
      </button>
    </div>
  );
}
