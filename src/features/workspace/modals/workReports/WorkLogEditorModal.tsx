import { ModalDialog } from "@/components/ModalDialog";
import { useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkLogPayload } from "@/types/payloads";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";
import { WorkReportEditorActions } from "./WorkReportEditorActions";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";

interface WorkLogEditorModalProps {
  bootstrap: BootstrapPayload;
  closeWorkLogModal: () => void;
  handleWorkLogSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  isSavingWorkLog: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  setWorkLogDraft: Dispatch<SetStateAction<WorkLogPayload>>;
  workLogDraft: WorkLogPayload;
}

export function WorkLogEditorModal({
  bootstrap,
  closeWorkLogModal: onClose,
  handleWorkLogSubmit,
  isSavingWorkLog,
  requestPhotoUpload,
  setWorkLogDraft,
  workLogDraft,
}: WorkLogEditorModalProps) {
  const initialDraft = useRef(JSON.stringify(workLogDraft));
  const closeWorkLogModal = () => {
    if (JSON.stringify(workLogDraft) !== initialDraft.current && !window.confirm("Discard unsaved changes?")) return;
    onClose();
  };
  const selectedTask = bootstrap.tasks.find((task) => task.id === workLogDraft.taskId);
  const workLogPhotoProjectId = selectedTask?.projectId ?? bootstrap.projects[0]?.id ?? null;
  const taskOptions = bootstrap.tasks.map((task) => {
    const subsystemName = task.subsystemIds
      .map((subsystemId) => bootstrap.subsystems.find((subsystem) => subsystem.id === subsystemId)?.name)
      .filter(Boolean)
      .join(", ") || "Unknown subsystem";
    return { id: task.id, name: `${task.title} - ${subsystemName}` };
  });
  const participantOptions = bootstrap.members.map((member) => ({ id: member.id, name: member.name }));

  return (
    <ModalDialog label="Add work log" onClose={closeWorkLogModal}>
      <section
        className="modal-card modal-panel-surface"
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Work log editor
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add work log</h2>
          </div>
          <button
            className="icon-button"
            onClick={closeWorkLogModal}
            type="button"
            style={{ color: "var(--text-copy)", background: "transparent" }}
          >
            Close
          </button>
        </div>
        <form
          className="modal-form"
          onSubmit={handleWorkLogSubmit}
          style={{ color: "var(--text-copy)" }}
        >
          <label className="field modal-wide">
            <span>Task</span>
            <FilterDropdown allLabel="Choose a task" ariaLabel="Task" portalMenu onChange={(selection) => {
              const taskId = selection[0];
              if (taskId) setWorkLogDraft((current) => ({ ...current, taskId }));
            }} options={taskOptions} showAllOption={false} singleSelect buttonContent={<span>{taskOptions.find((option) => option.id === workLogDraft.taskId)?.name ?? "Choose a task"}</span>} value={workLogDraft.taskId ? [workLogDraft.taskId] : []} />
            {bootstrap.tasks.length === 0 ? (
              <small style={{ color: "var(--text-copy)" }}>
                No tasks are available in this filtered workspace.
              </small>
            ) : null}
            {selectedTask ? <small style={{ color: "var(--text-copy)" }}>{selectedTask.summary}</small> : null}
          </label>
          <label className="field">
            <span>Date</span>
            <input
              onChange={(milestone) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  date: milestone.target.value,
                }))
              }
              required
              type="date"
              value={workLogDraft.date}
            />
          </label>
          <label className="field">
            <span>Hours</span>
            <input
              min="0.5"
              onChange={(milestone) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  hours: Number(milestone.target.value),
                }))
              }
              required
              step="0.5"
              type="number"
              value={workLogDraft.hours}
            />
          </label>
          <label className="field modal-wide">
            <span>Participants</span>
            <FilterDropdown allLabel="Select participants" ariaLabel="Participants" portalMenu compactSummary buttonContent={<span>{workLogDraft.participantIds.length ? `Participants (${workLogDraft.participantIds.length})` : "Select participants"}</span>} onChange={(selection) => setWorkLogDraft((current) => ({ ...current, participantIds: selection }))} options={participantOptions} showAllOption={false} value={workLogDraft.participantIds} />
            {workLogDraft.participantIds.length ? <small>{workLogDraft.participantIds.map((id) => participantOptions.find((option) => option.id === id)?.name).filter(Boolean).join(", ")}</small> : null}
          </label>
          <label className="field modal-wide">
            <span>Notes</span>
            <textarea
              onChange={(milestone) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  notes: milestone.target.value,
                }))
              }
              placeholder="What got done?"
              rows={3}
              value={workLogDraft.notes}
            />
          </label>
          <PhotoUploadField
            currentUrl={workLogDraft.photoUrl}
            label="Work log photo"
            onChange={(value) => setWorkLogDraft((current) => ({ ...current, photoUrl: value }))}
            onUpload={async (file) => {
              if (!workLogPhotoProjectId) {
                throw new Error("No project is available for photo upload.");
              }

              return requestPhotoUpload(workLogPhotoProjectId, file);
            }}
          />
          <WorkReportEditorActions
            disabled={isSavingWorkLog || bootstrap.tasks.length === 0 || bootstrap.members.length === 0}
            isSaving={isSavingWorkLog}
            onCancel={closeWorkLogModal}
            submitLabel="Add work log"
          />
        </form>
      </section>
    </ModalDialog>
  );
}
