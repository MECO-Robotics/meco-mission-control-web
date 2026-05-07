import type { SubsystemPayload } from "@/types/payloads";

interface SubsystemEditorModalActionsProps {
  activeSubsystemId: string | null;
  closeSubsystemModal: () => void;
  handleToggleSubsystemArchived: (subsystemId: string) => void;
  isSavingSubsystem: boolean;
  subsystemDraft: SubsystemPayload;
  subsystemModalMode: "create" | "edit";
}

export function SubsystemEditorModalActions({
  activeSubsystemId,
  closeSubsystemModal,
  handleToggleSubsystemArchived,
  isSavingSubsystem,
  subsystemDraft,
  subsystemModalMode,
}: SubsystemEditorModalActionsProps) {
  return (
    <div className="modal-actions modal-wide">
      {subsystemModalMode === "edit" && activeSubsystemId ? (
        <button
          className={subsystemDraft.isArchived ? "secondary-action" : "danger-action"}
          disabled={isSavingSubsystem}
          onClick={() => handleToggleSubsystemArchived(activeSubsystemId)}
          type="button"
        >
          {subsystemDraft.isArchived ? "Restore subsystem" : "Archive subsystem"}
        </button>
      ) : null}
      <button
        className="secondary-action"
        onClick={closeSubsystemModal}
        type="button"
        style={{
          background: "var(--bg-row-alt)",
          color: "var(--text-title)",
          border: "1px solid var(--border-base)",
        }}
      >
        Cancel
      </button>
      <button className="primary-action" disabled={isSavingSubsystem} type="submit">
        {isSavingSubsystem
          ? "Saving..."
          : subsystemModalMode === "create"
            ? "Add subsystem"
            : "Save changes"}
      </button>
    </div>
  );
}
