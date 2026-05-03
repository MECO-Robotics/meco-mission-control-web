interface MilestonesMilestoneModalActionsProps {
  milestoneModalMode: "create" | "edit" | null;
  isDeletingMilestone: boolean;
  isSavingMilestone: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export function MilestonesMilestoneModalActions({
  milestoneModalMode,
  isDeletingMilestone,
  isSavingMilestone,
  onClose,
  onDelete,
}: MilestonesMilestoneModalActionsProps) {
  return (
    <div className="modal-actions modal-wide">
      {milestoneModalMode === "edit" ? (
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
        {isSavingMilestone ? "Saving..." : milestoneModalMode === "create" ? "Add milestone" : "Save milestone"}
      </button>
    </div>
  );
}
