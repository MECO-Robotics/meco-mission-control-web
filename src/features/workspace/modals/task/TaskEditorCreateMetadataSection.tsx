import type { Dispatch, SetStateAction } from "react";

import { formatTaskStatusLabel } from "@/features/workspace/shared/model/workspaceOptions";
import type { TaskPayload } from "@/types/payloads";

interface TaskEditorCreateMetadataSectionProps {
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function TaskEditorCreateMetadataSection({
  setTaskDraft,
  taskDraft,
}: TaskEditorCreateMetadataSectionProps) {
  return (
    <details className="task-details-section-collapse modal-wide" open>
      <summary className="task-details-section-title task-details-section-summary">
        <span>Task metadata</span>
      </summary>
      <div className="task-details-section-grid">
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
      </div>
    </details>
  );
}
