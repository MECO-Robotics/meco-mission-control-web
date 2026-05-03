interface TimelineMilestoneModalActionsProps {
  isDeletingMilestone: boolean;
  isSavingMilestone: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onDelete: () => void;
}

export function TimelineMilestoneModalActions({
  isDeletingMilestone,
  isSavingMilestone,
  mode,
  onClose,
  onDelete,
}: TimelineMilestoneModalActionsProps) {
  return (
    <div className="modal-actions modal-wide">
      {mode === "edit" ? (
        <button
          className="danger-action"
          disabled={isDeletingMilestone || isSavingMilestone}
          onClick={onDelete}
          type="button"
        >
          {isDeletingMilestone ? "Deleting..." : "Delete milestone"}
        </button>
      ) : null}
      <button
        className="secondary-action"
        disabled={isDeletingMilestone || isSavingMilestone}
        onClick={onClose}
        style={{
          background: "var(--bg-row-alt)",
          color: "var(--text-title)",
          border: "1px solid var(--border-base)",
        }}
        type="button"
      >
        Cancel
      </button>
      <button className="primary-action" disabled={isDeletingMilestone || isSavingMilestone} type="submit">
        {isSavingMilestone ? "Saving..." : mode === "create" ? "Add milestone" : "Save changes"}
      </button>
    </div>
  );
}
