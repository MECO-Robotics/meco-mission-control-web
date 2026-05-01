import type { TaskDependencyType, TaskPayload, TaskRecord } from "@/types";

type TaskDependencyDraft = NonNullable<TaskPayload["taskDependencies"]>[number];

interface TaskDependencyEditorProps {
  dependencyDrafts: TaskDependencyDraft[];
  dependencyTaskOptions: TaskRecord[];
  dependencyTypeLabels: Record<TaskDependencyType, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<TaskDependencyDraft>) => void;
  visibleDependencyDrafts: TaskDependencyDraft[];
}

export function TaskDependencyEditor({
  dependencyDrafts,
  dependencyTaskOptions,
  dependencyTypeLabels,
  onAdd,
  onRemove,
  onUpdate,
  visibleDependencyDrafts,
}: TaskDependencyEditorProps) {
  return (
    <div className="field modal-wide">
      <span style={{ color: "var(--text-title)" }}>Dependencies</span>
      <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
        Planned sequencing between tasks. Use blocking dependencies for normal order.
      </p>
      <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
        {visibleDependencyDrafts.map((dependency, index) => (
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
              <span style={{ color: "var(--text-title)" }}>Depends on</span>
              <select
                onChange={(event) =>
                  onUpdate(index, {
                    upstreamTaskId: event.target.value,
                  })
                }
                style={{
                  background: "var(--bg-panel)",
                  color: "var(--text-title)",
                  border: "1px solid var(--border-base)",
                }}
                value={dependency.upstreamTaskId}
              >
                <option value="">Select task</option>
                {dependencyTaskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span style={{ color: "var(--text-title)" }}>Dependency type</span>
              <select
                onChange={(event) =>
                  onUpdate(index, {
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
                {Object.entries(dependencyTypeLabels).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {dependencyDrafts.length > 0 ? (
              <button
                className="secondary-action"
                onClick={() => onRemove(index)}
                type="button"
              >
                Remove dependency
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <button
        className="secondary-action"
        onClick={onAdd}
        style={{ marginTop: "0.75rem" }}
        type="button"
      >
        Add dependency
      </button>
    </div>
  );
}
