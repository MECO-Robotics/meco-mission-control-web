import { ModalDialog } from "@/components/ModalDialog";
import { useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { QaReportPayload } from "@/types/payloads";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";
import { WorkReportEditorActions } from "./WorkReportEditorActions";

interface QaReportEditorModalProps {
  bootstrap: BootstrapPayload;
  closeQaReportModal: () => void;
  handleQaReportSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isSavingQaReport: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  qaReportDraft: QaReportPayload;
  setQaReportDraft: Dispatch<SetStateAction<QaReportPayload>>;
}

export function QaReportEditorModal({
  bootstrap,
  closeQaReportModal: onClose,
  handleQaReportSubmit,
  isSavingQaReport,
  requestPhotoUpload,
  qaReportDraft,
  setQaReportDraft,
}: QaReportEditorModalProps) {
  const initialDraft = useRef(JSON.stringify(qaReportDraft));
  const closeQaReportModal = () => {
    if (JSON.stringify(qaReportDraft) !== initialDraft.current && !window.confirm("Discard unsaved changes?")) return;
    onClose();
  };
  const taskRef = qaReportDraft.targetRefs.find((ref) => ref.kind === "task");
  const selectedTask = bootstrap.tasks.find((task) => task.id === taskRef?.id);
  const qaReportPhotoProjectId = selectedTask?.projectId ?? bootstrap.projects[0]?.id ?? null;

  return (
    <ModalDialog label="Add QA report" onClose={closeQaReportModal}>
      <section
        className="modal-card task-details-modal modal-panel-surface"
      >
        <div className="panel-header compact-header task-details-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              QA report
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add QA report</h2>
          </div>
          <button
            aria-label="Close QA report modal"
            className="icon-button task-details-close-button"
            onClick={closeQaReportModal}
            type="button"
          >
            {"\u00D7"}
          </button>
        </div>
        <form
          className="modal-form task-details-grid"
          onSubmit={handleQaReportSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span>Task</span>
            <select
              aria-label="Task"
              onChange={(milestone) =>
                setQaReportDraft((current) => ({
                  ...current,
                  projectId: bootstrap.tasks.find((task) => task.id === milestone.target.value)?.projectId ?? current.projectId,
                  targetRefs: [{ kind: "task", id: milestone.target.value }],
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={taskRef?.id ?? ""}
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
            <span>Result</span>
            <select
              onChange={(milestone) =>
                setQaReportDraft((current) => ({
                  ...current,
                  result: milestone.target.value as QaReportPayload["result"],
                }))
              }
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={qaReportDraft.result ?? ""}
            >
              <option value="pass">Pass</option>
              <option value="minor-fix">Minor fix</option>
              <option value="iteration-worthy">Iteration worthy</option>
            </select>
          </label>
          <label className="field">
            <span>Reviewed date</span>
            <input
              onChange={(milestone) =>
                setQaReportDraft((current) => ({
                  ...current,
                  reviewedAt: milestone.target.value,
                }))
              }
              type="date"
              value={qaReportDraft.reviewedAt ?? ""}
            />
          </label>
          <label className="field modal-wide">
            <span>Participants</span>
            <select
              multiple
              onChange={(milestone) =>
                setQaReportDraft((current) => ({
                  ...current,
                  participantIds: Array.from(
                    milestone.currentTarget.selectedOptions,
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
          <label className="field modal-wide">
            <span>Notes</span>
            <textarea
              onChange={(milestone) =>
                setQaReportDraft((current) => ({
                  ...current,
                  notes: milestone.target.value,
                }))
              }
              placeholder="QA observations and follow-up."
              rows={3}
              value={qaReportDraft.notes}
            />
          </label>
          <PhotoUploadField
            accept="image/*,video/*"
            currentUrl={qaReportDraft.photoUrl ?? ""}
            label="QA report media"
            onChange={(value) => setQaReportDraft((current) => ({ ...current, photoUrl: value }))}
            onUpload={async (file) => {
              if (!qaReportPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(qaReportPhotoProjectId, file);
            }}
          />
          <WorkReportEditorActions
            disabled={
              isSavingQaReport || bootstrap.tasks.length === 0 || bootstrap.members.length === 0
            }
            isSaving={isSavingQaReport}
            onCancel={closeQaReportModal}
            submitLabel="Add QA report"
          />
        </form>
      </section>
    </ModalDialog>
  );
}
