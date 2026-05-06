import type { Dispatch, SetStateAction } from "react";

import type { RiskPayload } from "@/types";

import type { RiskEditorMode, SelectOption } from "./riskViewModel";

interface RiskEditorModalProps {
  attachmentOptions: SelectOption[];
  draft: RiskPayload;
  editorError: string | null;
  editorMode: Exclude<RiskEditorMode, "detail"> | null;
  getAttachmentOptionsForType: (attachmentType: RiskPayload["attachmentType"]) => SelectOption[];
  getSourceOptionsForType: (sourceType: RiskPayload["sourceType"]) => SelectOption[];
  isDeleting: boolean;
  isSaving: boolean;
  mitigationTaskOptions: SelectOption[];
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  setDraft: Dispatch<SetStateAction<RiskPayload>>;
  sourceOptions: SelectOption[];
}

export function RiskEditorModal({
  attachmentOptions,
  draft,
  editorError,
  editorMode,
  getAttachmentOptionsForType,
  getSourceOptionsForType,
  isDeleting,
  isSaving,
  mitigationTaskOptions,
  onClose,
  onDelete,
  onSave,
  setDraft,
  sourceOptions,
}: RiskEditorModalProps) {
  if (!editorMode) {
    return null;
  }

  return (
    <div
      className="modal-scrim"
      onClick={(milestone) => {
        if (milestone.target === milestone.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section aria-modal="true" className="modal-card" role="dialog">
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--official-red)" }}>
              Risk management
            </p>
            <h2>{editorMode === "create" ? "Create risk" : "Edit risk"}</h2>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={(milestone) => {
            milestone.preventDefault();
            void onSave();
          }}
        >
          <label className="field modal-wide">
            <span>Title</span>
            <input
              onChange={(milestone) =>
                setDraft((current) => ({
                  ...current,
                  title: milestone.target.value,
                }))
              }
              required
              value={draft.title}
            />
          </label>

          <label className="field modal-wide">
            <span>Detail</span>
            <textarea
              onChange={(milestone) =>
                setDraft((current) => ({
                  ...current,
                  detail: milestone.target.value,
                }))
              }
              required
              rows={4}
              value={draft.detail}
            />
          </label>

          <label className="field">
            <span>Severity</span>
            <select
              onChange={(milestone) =>
                setDraft((current) => ({
                  ...current,
                  severity: milestone.target.value as RiskPayload["severity"],
                }))
              }
              value={draft.severity}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="field">
            <span>Source type</span>
            <select
              onChange={(milestone) => {
                const nextSourceType = milestone.target.value as RiskPayload["sourceType"];
                const nextSourceOptions = getSourceOptionsForType(nextSourceType);
                setDraft((current) => ({
                  ...current,
                  sourceType: nextSourceType,
                  sourceId: nextSourceOptions[0]?.id ?? "",
                }));
              }}
              value={draft.sourceType}
            >
              <option value="qa-report">QA report</option>
              <option value="test-result">Test result</option>
            </select>
          </label>

          <label className="field modal-wide">
            <span>Source</span>
            <select
              onChange={(milestone) =>
                setDraft((current) => ({
                  ...current,
                  sourceId: milestone.target.value,
                }))
              }
              value={draft.sourceId}
            >
              {sourceOptions.length === 0 ? (
                <option value="">No sources available</option>
              ) : (
                sourceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="field">
            <span>Attachment type</span>
            <select
              onChange={(milestone) => {
                const nextAttachmentType = milestone.target.value as RiskPayload["attachmentType"];
                const nextAttachmentOptions = getAttachmentOptionsForType(nextAttachmentType);
                setDraft((current) => ({
                  ...current,
                  attachmentType: nextAttachmentType,
                  attachmentId: nextAttachmentOptions[0]?.id ?? "",
                }));
              }}
              value={draft.attachmentType}
            >
              <option value="project">Project</option>
              <option value="workstream">Workflow</option>
              <option value="mechanism">Mechanism</option>
              <option value="part-instance">Part instance</option>
            </select>
          </label>

          <label className="field modal-wide">
            <span>Attachment target</span>
            <select
              onChange={(milestone) =>
                setDraft((current) => ({
                  ...current,
                  attachmentId: milestone.target.value,
                }))
              }
              value={draft.attachmentId}
            >
              {attachmentOptions.length === 0 ? (
                <option value="">No attachment targets available</option>
              ) : (
                attachmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="field modal-wide">
            <span>Mitigation task</span>
            <select
              onChange={(milestone) =>
                setDraft((current) => ({
                  ...current,
                  mitigationTaskId: milestone.target.value || null,
                }))
              }
              value={draft.mitigationTaskId ?? ""}
            >
              <option value="">None</option>
              {mitigationTaskOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          {editorError ? (
            <p className="section-copy modal-wide" style={{ color: "var(--official-red)" }}>
              {editorError}
            </p>
          ) : null}

          <div className="modal-actions modal-wide">
            {editorMode === "edit" ? (
              <button
                className="secondary-action danger-action"
                disabled={isDeleting || isSaving}
                onClick={() => void onDelete()}
                type="button"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            ) : (
              <span />
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
              <button
                className="secondary-action"
                disabled={isSaving || isDeleting}
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-action" disabled={isSaving || isDeleting} type="submit">
                {isSaving
                  ? "Saving..."
                  : editorMode === "create"
                    ? "Create risk"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
