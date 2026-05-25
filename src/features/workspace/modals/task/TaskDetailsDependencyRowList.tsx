import type { Dispatch, SetStateAction } from "react";
import type { TaskDependencyKind, TaskDependencyType } from "@/types/common";
import type { TaskPayload } from "@/types/payloads";
import { IconTasks, IconTrash } from "@/components/shared/Icons";
import { FilterDropdown } from "../../shared/filters/FilterDropdown";
import {
  TASK_DEPENDENCY_KIND_LABELS,
  TASK_DEPENDENCY_KIND_OPTIONS,
  TASK_DEPENDENCY_TYPE_LABELS,
  type getTaskDependencyTargetOptions,
} from "../../shared/task/taskTargeting";
import { TaskDetailReveal } from "./details/TaskDetailReveal";
import { TaskDetailsDependencyEditActions } from "./TaskDetailsDependencyEditActions";

type TaskDependencyDraft = NonNullable<TaskPayload["taskDependencies"]>[number];
type DependencyTargetOptions = ReturnType<typeof getTaskDependencyTargetOptions>;

interface TaskDetailsDependencyRow {
  dependencyType?: TaskDependencyType | null;
  key: string;
  kind: TaskDependencyKind;
  name: string;
  refId: string;
  requiredState?: string | null;
}

interface TaskDetailsDependencyRowListProps {
  canInlineEdit: boolean;
  dependencyRows: readonly TaskDetailsDependencyRow[];
  editingDependencyKey: string | null;
  getDependencyDefaultState: (kind: TaskDependencyKind) => string;
  getDependencyTargetOptions: (kind: TaskDependencyKind) => DependencyTargetOptions;
  removeDependencyDraft: (dependencyKey: string) => void;
  setEditingDependencyKey: Dispatch<SetStateAction<string | null>>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  updateDependencyDraft: (dependencyKey: string, updates: Partial<TaskDependencyDraft>) => void;
}

const dependencyKindOptions = TASK_DEPENDENCY_KIND_OPTIONS;
const dependencyTypeOptions = Object.entries(TASK_DEPENDENCY_TYPE_LABELS).map(([type, label]) => ({
  id: type,
  name: label,
  icon: <IconTasks />,
}));

export function TaskDetailsDependencyRowList({
  canInlineEdit,
  dependencyRows,
  editingDependencyKey,
  getDependencyDefaultState,
  getDependencyTargetOptions,
  removeDependencyDraft,
  setEditingDependencyKey,
  setTaskDraft,
  updateDependencyDraft,
}: TaskDetailsDependencyRowListProps) {
  return (
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
              <label className="field task-details-dependency-editor-field">
                <span style={{ color: "var(--text-title)" }}>Required state</span>
                <input
                  onChange={(milestone) =>
                    updateDependencyDraft(dependency.key, {
                      requiredState: milestone.target.value,
                    })
                  }
                  placeholder={getDependencyDefaultState(dependency.kind)}
                  style={{
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-base)",
                    color: "var(--text-title)",
                  }}
                  value={dependency.requiredState ?? ""}
                />
              </label>
              <label className="field task-details-dependency-editor-field">
                <span style={{ color: "var(--text-title)" }}>Dependency type</span>
                <FilterDropdown
                  allLabel="Select dependency type"
                  ariaLabel="Set dependency type"
                  buttonInlineEditField={`dependency-type-${index}`}
                  className="task-queue-filter-menu-submenu task-details-dependency-type-menu"
                  icon={<IconTasks />}
                  menuClassName="task-details-dependency-menu-popup"
                  onChange={(selection) =>
                    updateDependencyDraft(dependency.key, {
                      dependencyType: selection[0] as TaskDependencyType,
                    })
                  }
                  options={dependencyTypeOptions}
                  portalMenu
                  portalMenuPlacement="below"
                  singleSelect
                  value={[dependency.dependencyType ?? "hard"]}
                />
              </label>
              <TaskDetailsDependencyEditActions
                index={index}
                onDone={() => setEditingDependencyKey(null)}
                onRemove={() => removeDependencyDraft(dependency.key)}
              />
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
  );
}
