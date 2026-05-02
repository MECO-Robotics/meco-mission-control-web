import type { Dispatch, SetStateAction } from "react";

import { formatTaskStatusLabel } from "@/features/workspace/shared/model";
import type { BootstrapPayload, TaskPayload } from "@/types";

interface TaskEditorAdvancedTaskMetaSectionProps {
  bootstrap: BootstrapPayload;
  closeTaskModal: () => void;
  isDeletingTask: boolean;
  isSavingTask: boolean;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function TaskEditorAdvancedTaskMetaSection({
  bootstrap,
  closeTaskModal,
  isDeletingTask,
  isSavingTask,
  setTaskDraft,
  taskDraft,
}: TaskEditorAdvancedTaskMetaSectionProps) {
  return (
    <>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Target event</span>
        <select
          onChange={(event) =>
            setTaskDraft((current) => ({
              ...current,
              targetEventId: event.target.value || null,
            }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.targetEventId ?? ""}
        >
          <option value="">No event</option>
          {bootstrap.events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Status</span>
        <select
          onChange={(event) =>
            setTaskDraft((current) => ({
              ...current,
              status: event.target.value as TaskPayload["status"],
            }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.status}
        >
          <option value="not-started">Not started</option>
          <option value="in-progress">In progress</option>
          <option value="waiting-for-qa">{formatTaskStatusLabel("waiting-for-qa")}</option>
          <option value="complete">Complete</option>
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Start date</span>
        <input
          onChange={(event) =>
            setTaskDraft((current) => ({ ...current, startDate: event.target.value }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          type="date"
          value={taskDraft.startDate}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Due date</span>
        <input
          onChange={(event) =>
            setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          type="date"
          value={taskDraft.dueDate}
        />
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Estimated hours</span>
        <input
          min="0"
          onChange={(event) =>
            setTaskDraft((current) => ({
              ...current,
              estimatedHours: Number(event.target.value),
            }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          type="number"
          value={taskDraft.estimatedHours}
        />
      </label>
      <div className="checkbox-row modal-wide">
        <label className="checkbox-field">
          <input
            checked={taskDraft.requiresDocumentation}
            onChange={(event) =>
              setTaskDraft((current) => ({
                ...current,
                requiresDocumentation: event.target.checked,
              }))
            }
            type="checkbox"
          />
          <span style={{ color: "var(--text-title)" }}>Requires documentation</span>
        </label>
        <label className="checkbox-field">
          <input
            checked={taskDraft.documentationLinked}
            onChange={(event) =>
              setTaskDraft((current) => ({
                ...current,
                documentationLinked: event.target.checked,
              }))
            }
            type="checkbox"
          />
          <span style={{ color: "var(--text-title)" }}>Documentation linked</span>
        </label>
      </div>
      <div className="modal-actions modal-wide">
        <button
          className="secondary-action"
          onClick={closeTaskModal}
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          type="button"
        >
          Cancel
        </button>
        <button className="primary-action" disabled={isSavingTask || isDeletingTask} type="submit">
          {isSavingTask ? "Saving..." : "Create task"}
        </button>
      </div>
    </>
  );
}
