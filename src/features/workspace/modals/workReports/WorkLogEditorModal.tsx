import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkLogPayload } from "@/types/payloads";
import { PhotoUploadField } from "@/features/workspace/shared/media/PhotoUploadField";

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
  closeWorkLogModal,
  handleWorkLogSubmit,
  isSavingWorkLog,
  requestPhotoUpload,
  setWorkLogDraft,
  workLogDraft,
}: WorkLogEditorModalProps) {
  const selectedTask = bootstrap.tasks.find((task) => task.id === workLogDraft.taskId);
  const workLogPhotoProjectId = selectedTask?.projectId ?? bootstrap.projects[0]?.id ?? null;
  const selectedSubsystem = selectedTask
    ? bootstrap.subsystems.find((subsystem) => subsystem.id === selectedTask.subsystemId)
    : null;

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
            <span style={{ color: "var(--text-title)" }}>Task</span>
            <select
              onChange={(milestone) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  taskId: milestone.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              value={workLogDraft.taskId}
            >
              <option value="" disabled>
                Choose a task
              </option>
              {bootstrap.tasks.map((task) => {
                const subsystemName =
                  task.subsystemIds
                    .map(
                      (subsystemId) =>
                        bootstrap.subsystems.find((subsystem) => subsystem.id === subsystemId)
                          ?.name,
                    )
                    .filter(Boolean)
                    .join(", ") || "Unknown subsystem";

                return (
                  <option key={task.id} value={task.id}>
                    {task.title} - {subsystemName}
                  </option>
                );
              })}
            </select>
            {bootstrap.tasks.length === 0 ? (
              <small style={{ color: "var(--text-copy)" }}>
                No tasks are available in this filtered workspace.
              </small>
            ) : null}
            {selectedTask ? (
              <small style={{ color: "var(--text-copy)" }}>
                {selectedSubsystem?.name ?? "Unknown subsystem"} - {selectedTask.summary}
              </small>
            ) : null}
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Date</span>
            <input
              onChange={(milestone) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  date: milestone.target.value,
                }))
              }
              required
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="date"
              value={workLogDraft.date}
            />
          </label>
          <label className="field">
            <span style={{ color: "var(--text-title)" }}>Hours</span>
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
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="number"
              value={workLogDraft.hours}
            />
          </label>
          <label className="field modal-wide">
            <span style={{ color: "var(--text-title)" }}>Participants</span>
            <select
              multiple
              onChange={(milestone) =>
                setWorkLogDraft((current) => ({
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
              value={workLogDraft.participantIds}
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
            <span style={{ color: "var(--text-title)" }}>Notes</span>
            <textarea
              onChange={(milestone) =>
                setWorkLogDraft((current) => ({
                  ...current,
                  notes: milestone.target.value,
                }))
              }
              placeholder="What got done?"
              rows={3}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
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
          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={closeWorkLogModal}
              type="button"
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
            >
              Cancel
            </button>
            <button
              className="primary-action"
              disabled={isSavingWorkLog || bootstrap.tasks.length === 0 || bootstrap.members.length === 0}
              type="submit"
            >
              {isSavingWorkLog ? "Saving..." : "Add work log"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
