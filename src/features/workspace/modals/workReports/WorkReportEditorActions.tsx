interface WorkReportEditorActionsProps {
  disabled: boolean;
  isSaving: boolean;
  onCancel: () => void;
  submitLabel: string;
}

export function WorkReportEditorActions({
  disabled,
  isSaving,
  onCancel,
  submitLabel,
}: WorkReportEditorActionsProps) {
  return (
    <div className="modal-actions modal-wide">
      <button className="secondary-action" onClick={onCancel} type="button">
        Cancel
      </button>
      <button className="primary-action" disabled={disabled} type="submit">
        {isSaving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
