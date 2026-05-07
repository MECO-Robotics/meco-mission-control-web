import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import { getTaskSelectedAssigneeIds } from "../../shared/task/taskTargeting";

interface TaskEditorCoreFieldsSectionProps {
  mentors: BootstrapPayload["members"];
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  students: BootstrapPayload["members"];
  taskDraft: TaskPayload;
}

export function TaskEditorCoreFieldsSection({
  mentors,
  setTaskDraft,
  students,
  taskDraft,
}: TaskEditorCoreFieldsSectionProps) {
  const selectedAssigneeIds = getTaskSelectedAssigneeIds(taskDraft);

  return (
    <div className="task-details-section-grid task-details-overview-grid modal-wide">
      <label className="field task-detail-row modal-wide">
        <span style={{ color: "var(--text-title)" }}>Summary</span>
        <textarea
          onChange={(milestone) =>
            setTaskDraft((current) => ({ ...current, summary: milestone.target.value }))
          }
          required
          rows={3}
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.summary}
        />
      </label>
      <label className="field task-detail-row task-detail-row-chip">
        <span style={{ color: "var(--text-title)" }}>Priority</span>
        <select
          onChange={(milestone) =>
            setTaskDraft((current) => ({
              ...current,
              priority: milestone.target.value as TaskPayload["priority"],
            }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.priority}
        >
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </label>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Owner</span>
        <select
          onChange={(milestone) => {
            const ownerId = milestone.target.value || null;
            setTaskDraft((current) => ({
              ...current,
              ownerId,
              assigneeIds: ownerId
                ? Array.from(new Set([...current.assigneeIds, ownerId]))
                : current.assigneeIds,
            }));
          }}
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.ownerId ?? ""}
        >
          <option value="">Unassigned</option>
          {students.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <div className="task-details-overview-assigned">
        <span style={{ color: "var(--text-title)" }}>Assigned</span>
        <select
          multiple
          onChange={(milestone) => {
            const assigneeIds = Array.from(milestone.currentTarget.selectedOptions, (option) => option.value);
            setTaskDraft((current) => ({
              ...current,
              assigneeIds: Array.from(
                new Set(
                  [...assigneeIds, current.ownerId].filter(
                    (memberId): memberId is string => Boolean(memberId),
                  ),
                ),
              ),
            }));
          }}
          size={Math.min(students.length || 1, 5)}
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={selectedAssigneeIds}
        >
          {students.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>
      <label className="field">
        <span style={{ color: "var(--text-title)" }}>Mentor</span>
        <select
          onChange={(milestone) =>
            setTaskDraft((current) => ({
              ...current,
              mentorId: milestone.target.value || null,
            }))
          }
          style={{
            background: "var(--bg-row-alt)",
            color: "var(--text-title)",
            border: "1px solid var(--border-base)",
          }}
          value={taskDraft.mentorId ?? ""}
        >
          <option value="">Unassigned</option>
          {mentors.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
