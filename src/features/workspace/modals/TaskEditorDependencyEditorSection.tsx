import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload, TaskDependencyKind, TaskDependencyType, TaskPayload } from "@/types";
import { TASK_DEPENDENCY_KIND_LABELS, TASK_DEPENDENCY_TYPE_LABELS } from "../shared/taskTargeting";

interface TaskEditorDependencyEditorSectionProps {
  bootstrap: BootstrapPayload;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

function getDependencyDefaultState(kind: TaskDependencyKind) {
  return kind === "part_instance" ? "available" : "complete";
}

export function TaskEditorDependencyEditorSection({
  bootstrap,
  setTaskDraft,
  taskDraft,
}: TaskEditorDependencyEditorSectionProps) {
  const dependencyTaskOptions = [...bootstrap.tasks]
    .filter((task) => task.projectId === taskDraft.projectId)
    .sort((left, right) => left.title.localeCompare(right.title));
  const dependencyEventOptions = bootstrap.events
    .filter((event) => event.projectIds.length === 0 ? true : event.projectIds.includes(taskDraft.projectId))
    .sort((left, right) => left.title.localeCompare(right.title));
  const dependencyPartInstanceOptions = bootstrap.partInstances;
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
  const getDependencyTargetOptions = (kind: TaskDependencyKind) => {
    if (kind === "task") {
      return dependencyTaskOptions.map((task) => ({ id: task.id, name: task.title }));
    }

    if (kind === "milestone" || kind === "event") {
      return dependencyEventOptions.map((event) => ({ id: event.id, name: event.title }));
    }

    return dependencyPartInstanceOptions.map((partInstance) => ({
      id: partInstance.id,
      name: partInstance.name,
    }));
  };
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
      taskDependencies: (current.taskDependencies ?? []).filter((_dependency, currentIndex) => currentIndex !== index),
    }));
  };

  return (
    <div className="field modal-wide">
      <span style={{ color: "var(--text-title)" }}>Dependencies</span>
      <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
        Structured prerequisites. Hard dependencies gate waiting state; soft dependencies are advisory.
      </p>
      <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
        {visibleDependencyDrafts.map((dependency, index) => {
          const targetOptions = getDependencyTargetOptions(dependency.kind);

          return (
            <div
              key={dependency.id ?? `dependency-${index}`}
              style={{
                display: "grid",
                gap: "0.75rem",
                padding: "0.75rem",
                border: "1px solid var(--border-base)",
                borderRadius: "12px",
                background: "var(--bg-row-alt)",
              }}
            >
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Dependency kind</span>
                <select
                  onChange={(event) =>
                    updateDependencyDraft(index, {
                      kind: event.target.value as TaskDependencyKind,
                      refId: "",
                    })
                  }
                  style={{
                    background: "var(--bg-panel)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
                  value={dependency.kind}
                >
                  {Object.entries(TASK_DEPENDENCY_KIND_LABELS).map(([kind, label]) => (
                    <option key={kind} value={kind}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Depends on</span>
                <select
                  onChange={(event) =>
                    updateDependencyDraft(index, {
                      refId: event.target.value,
                    })
                  }
                  style={{
                    background: "var(--bg-panel)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
                  value={dependency.refId}
                >
                  <option value="">Select {TASK_DEPENDENCY_KIND_LABELS[dependency.kind].toLowerCase()}</option>
                  {targetOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span style={{ color: "var(--text-title)" }}>Required state</span>
                <input
                  onChange={(event) =>
                    updateDependencyDraft(index, {
                      requiredState: event.target.value,
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
                <select
                  onChange={(event) =>
                    updateDependencyDraft(index, {
                      dependencyType: event.target.value as TaskDependencyType,
                    })
                  }
                  style={{
                    background: "var(--bg-panel)",
                    color: "var(--text-title)",
                    border: "1px solid var(--border-base)",
                  }}
                  value={dependency.dependencyType}
                >
                  {Object.entries(TASK_DEPENDENCY_TYPE_LABELS).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {dependencyDrafts.length > 0 ? (
                <button className="secondary-action" onClick={() => removeDependencyDraft(index)} type="button">
                  Remove dependency
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
