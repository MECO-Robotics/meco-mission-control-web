import { localTodayDate, parseLocalDate } from "@/lib/dateUtils";
import { ModalDialog } from "@/components/ModalDialog";
import { useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { QaReportPayload } from "@/types/payloads";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";

interface QaReportEditorModalProps {
  bootstrap: BootstrapPayload;
  closeQaReportModal: () => void;
  handleQaReportSubmit: (milestone: FormEvent<HTMLFormElement>, status: QaReportPayload["status"]) => void | Promise<void>;
  canReviewQa?: boolean;
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
  canReviewQa = false,
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
  const taskOptions = bootstrap.tasks.map((task) => {
    const subsystemName = task.subsystemIds
      .map((subsystemId) => bootstrap.subsystems.find((subsystem) => subsystem.id === subsystemId)?.name)
      .filter(Boolean)
      .join(", ") || "Unknown subsystem";
    return { id: task.id, name: `${task.title} - ${subsystemName}` };
  });
  const qaReportPhotoProjectId = selectedTask?.projectId ?? bootstrap.projects[0]?.id ?? null;
  const participantOptions = bootstrap.members.map((member) => ({ id: member.id, name: member.name }));

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
          onSubmit={(event) => {
            const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            const status = submitter?.value === "draft" || submitter?.value === "reviewed" ? submitter.value : "submitted";
            handleQaReportSubmit(event, status);
          }}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span>Task</span>
            <FilterDropdown allLabel="Choose a task" ariaLabel="Task" portalMenu singleSelect showAllOption={false}
              onChange={(selection) => {
                const taskId = selection[0];
                if (!taskId) return;
                setQaReportDraft((current) => ({
                  ...current,
                  projectId: bootstrap.tasks.find((task) => task.id === taskId)?.projectId ?? current.projectId,
                  targetRefs: [{ kind: "task", id: taskId }],
                }));
              }}
              options={taskOptions} buttonContent={<span>{taskOptions.find((option) => option.id === taskRef?.id)?.name ?? "Choose a task"}</span>}
              value={taskRef?.id ? [taskRef.id] : []}
            />
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
            <span>Observed date</span>
            <input
              onChange={(milestone) =>
                setQaReportDraft((current) => ({
                  ...current,
                  createdAt: parseLocalDate(milestone.target.value)?.toISOString() ?? current.createdAt,
                }))
              }
              type="date"
              value={qaReportDraft.createdAt ? localTodayDate(new Date(qaReportDraft.createdAt)) : ""}
            />
          </label>
          <label className="field modal-wide">
            <span>Participants</span>
            <FilterDropdown allLabel="Select participants" ariaLabel="Participants" portalMenu compactSummary buttonContent={<span>{qaReportDraft.participantIds.length ? `Participants (${qaReportDraft.participantIds.length})` : "Select participants"}</span>} onChange={(selection) => setQaReportDraft((current) => ({ ...current, participantIds: selection }))} options={participantOptions} showAllOption={false} value={qaReportDraft.participantIds} />
            {qaReportDraft.participantIds.length ? <small>{qaReportDraft.participantIds.map((id) => participantOptions.find((option) => option.id === id)?.name).filter(Boolean).join(", ")}</small> : null}
          </label>
          <small className="modal-wide">{canReviewQa ? "Choose whether to save, submit, or approve this report." : "Submit this report for review by a mentor or admin."}</small>
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
          <div className="modal-actions modal-wide">
            <button className="secondary-action" onClick={closeQaReportModal} type="button">Cancel</button>
            <button className="secondary-action" disabled={isSavingQaReport || bootstrap.tasks.length === 0 || !taskRef?.id || bootstrap.members.length === 0 || qaReportDraft.participantIds.length === 0} type="submit" value="draft">{isSavingQaReport ? "Saving…" : "Save draft"}</button>
            <button className="primary-action" disabled={isSavingQaReport || bootstrap.tasks.length === 0 || !taskRef?.id || bootstrap.members.length === 0 || qaReportDraft.participantIds.length === 0} type="submit" value="submitted">{isSavingQaReport ? "Saving…" : "Submit for review"}</button>
            {canReviewQa ? <button className="primary-action" disabled={isSavingQaReport || bootstrap.tasks.length === 0 || !taskRef?.id || bootstrap.members.length === 0 || qaReportDraft.participantIds.length === 0} type="submit" value="reviewed">{isSavingQaReport ? "Saving…" : "Review and approve"}</button> : null}
          </div>
        </form>
      </section>
    </ModalDialog>
  );
}
