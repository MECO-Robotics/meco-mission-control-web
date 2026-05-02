import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload, QaReportPayload } from "@/types";
import { PhotoUploadField } from "@/features/workspace/shared/PhotoUploadField";

interface QaReportEditorModalProps {
  bootstrap: BootstrapPayload;
  closeQaReportModal: () => void;
  handleQaReportSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSavingQaReport: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  qaReportDraft: QaReportPayload;
  setQaReportDraft: Dispatch<SetStateAction<QaReportPayload>>;
}

export function QaReportEditorModal({
  bootstrap,
  closeQaReportModal,
  handleQaReportSubmit,
  isSavingQaReport,
  requestPhotoUpload,
  qaReportDraft,
  setQaReportDraft,
}: QaReportEditorModalProps) {
  const selectedTask = bootstrap.tasks.find((task) => task.id === qaReportDraft.taskId);
  const qaReportPhotoProjectId = selectedTask?.projectId ?? bootstrap.projects[0]?.id ?? null;

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              QA report
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add QA report</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeQaReportModal}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handleQaReportSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Task</span>
            <select
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  taskId: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={qaReportDraft.taskId ?? ""}
            >
              <option disabled value="">
                Choose a task
              </option>
              {bootstrap.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            {selectedTask ? (
              <small style={{ color: "var(--text-copy)" }}>{selectedTask.summary}</small>
            ) : null}
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Result</span>
            <select
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  result: event.target.value as QaReportPayload["result"],
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={qaReportDraft.result}
            >
              <option value="pass">Pass</option>
              <option value="minor-fix">Minor fix</option>
              <option value="iteration-worthy">Iteration worthy</option>
            </select>
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Reviewed date</span>
            <input
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  reviewedAt: event.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="date"
              value={qaReportDraft.reviewedAt}
            />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Participants</span>
            <select
              multiple
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  participantIds: Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ),
                }))
              }
              size={Math.min(bootstrap.members.length || 1, 5)}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={qaReportDraft.participantIds}
            >
              {bootstrap.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <small style={{ color: "var(--text-copy)" }}>
              Hold Ctrl or Cmd to select multiple people.
            </small>
          </label>
          <label className="checkbox-field modal-wide">
            <input
              checked={qaReportDraft.mentorApproved}
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  mentorApproved: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span style={{ color: "var(--text-title)" }}>Mentor approved</span>
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Notes</span>
            <textarea
              onChange={(event) =>
                setQaReportDraft((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="QA observations and follow-up."
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={qaReportDraft.notes}
            />
          </label>
          <PhotoUploadField
            accept="image/*,video/*"
            currentUrl={qaReportDraft.photoUrl}
            label="QA report media"
            onChange={(value) => setQaReportDraft((current) => ({ ...current, photoUrl: value }))}
            onUpload={async (file) => {
              if (!qaReportPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(qaReportPhotoProjectId, file);
            }}
          />
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeQaReportModal}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={
                isSavingQaReport ||
                bootstrap.tasks.length === 0 ||
                bootstrap.members.length === 0
              }
              type="submit"
            >
              {isSavingQaReport ? "Saving..." : "Add QA report"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
