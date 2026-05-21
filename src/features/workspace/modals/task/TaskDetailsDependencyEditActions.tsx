import { IconTrash } from "@/components/shared/Icons";

interface TaskDetailsDependencyEditActionsProps {
  index: number;
  onDone: () => void;
  onRemove: () => void;
}

export function TaskDetailsDependencyEditActions({
  index,
  onDone,
  onRemove,
}: TaskDetailsDependencyEditActionsProps) {
  return (
    <div className="task-details-dependency-editor-field">
      <span style={{ color: "var(--text-title)" }}>Actions</span>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          className="secondary-action"
          onClick={onDone}
          type="button"
        >
          Done
        </button>
        <button
          aria-label={`Remove dependency ${index + 1}`}
          className="icon-button task-details-dependency-row-remove-button"
          onClick={onRemove}
          type="button"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
}
