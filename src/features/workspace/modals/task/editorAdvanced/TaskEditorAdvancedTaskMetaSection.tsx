import type { Dispatch, SetStateAction } from "react";

import { formatTaskStatusLabel } from "@/features/workspace/shared/model/workspaceOptions";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";

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
        <span style={{ color: "var(--text-title)" }}>Target milestone</span>
        <select
          onChange={(milestone) =>
            setTaskDraft((current) => ({
              ...current,
              targetMilestoneId: milestone.target.value || null,
            }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.targetMilestoneId ?? ""}
        >
          <option value="">No milestone</option>
          {bootstrap.milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.title}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Status</span>
        <select
          onChange={(milestone) =>
            setTaskDraft((current) => ({
              ...current,
              status: milestone.target.value as TaskPayload["status"],
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
          onChange={(milestone) =>
            setTaskDraft((current) => ({ ...current, startDate: milestone.target.value }))
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
          onChange={(milestone) =>
            setTaskDraft((current) => ({ ...current, dueDate: milestone.target.value }))
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
          onChange={(milestone) =>
            setTaskDraft((current) => ({
              ...current,
              estimatedHours: Number(milestone.target.value),
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
            onChange={(milestone) =>
              setTaskDraft((current) => ({
                ...current,
                requiresDocumentation: milestone.target.checked,
              }))
            }
            type="checkbox"
          />
          <span style={{ color: "var(--text-title)" }}>Requires documentation</span>
        </label>
        <label className="checkbox-field">
          <input
            checked={taskDraft.documentationLinked}
            onChange={(milestone) =>
              setTaskDraft((current) => ({
                ...current,
                documentationLinked: milestone.target.checked,
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
