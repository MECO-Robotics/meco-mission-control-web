import { useState, type ComponentPropsWithoutRef } from "react";
import { CircleHelp, TriangleAlert } from "lucide-react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { OpenEditTaskModalOptions } from "@/types/taskEditIntent";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatDate } from "@/lib/appUtils/common";
import { getTaskOpenBlockersForTask } from "@/features/workspace/shared/task/taskPlanning";
import { readTaskAssigneeIds } from "../taskQueueKanbanCard";
import { getMemberInitial, getTaskQueueCardContextLabel, TaskPriorityBadge } from "../taskQueueKanbanCardMeta";
import { getTaskQueueBoardState } from "../taskQueueKanbanBoardState";

function getTaskCardDeadline(task: TaskRecord) {
  const date = new Date(`${task.dueDate}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) || Number.isNaN(date.getTime()) || date.getDate() !== Number(task.dueDate.slice(-2))) {
    return { text: "No due date", tone: "neutral" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (task.status !== "complete") {
    if (date < today) return { text: `Overdue · ${formatDate(task.dueDate)}`, tone: "danger" };
    if (date.getTime() === today.getTime()) return { text: "Due today", tone: "warning" };
  }
  return { text: `Due ${formatDate(task.dueDate)}`, tone: "neutral" };
}

interface TaskQueueCardProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "onClick" | "type"> {
  bootstrap: BootstrapPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord, options?: OpenEditTaskModalOptions) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  task: TaskRecord;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
}

export function TaskQueueCard({
  bootstrap,
  className,
  membersById,
  openEditTaskModal,
  projectsById,
  subsystemsById,
  task,
  workstreamsById,
  ...buttonProps
}: TaskQueueCardProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const assigneeIds = [...new Set(readTaskAssigneeIds(task))];
  const person = membersById[assigneeIds[0]];
  const assigneeNames = assigneeIds.map((id) => membersById[id]?.name ?? "Unavailable assignee").join(", ");
  const deadline = getTaskCardDeadline(task);
  const context = getTaskQueueCardContextLabel(task, projectsById[task.projectId]?.projectType, subsystemsById, workstreamsById);
  const blockers = getTaskOpenBlockersForTask(task.id, bootstrap);
  const needsHelp = bootstrap.risks.some((risk) => risk.category === "help" && risk.status !== "resolved" &&
    risk.relatedTargets.some((target) => target.kind === "task" && target.id === task.id));

  return (
    <button
      {...buttonProps}
      className={`task-queue-board-card${className ? ` ${className}` : ""}`}
      data-board-state={getTaskQueueBoardState(task, bootstrap)}
      data-priority={task.priority}
      data-tutorial-target="edit-task-row"
      onClick={(event) => {
        event.stopPropagation();
        openEditTaskModal(task);
      }}
      type="button"
    >
      <strong className="task-queue-board-card-title" title={task.title}>{task.title}</strong>
      {context ? <span className="task-queue-board-card-context" title={context}>{context}</span> : null}
      {blockers.length || needsHelp ? (
        <span className="task-queue-board-card-exceptions">
          {blockers.length ? (
            <span className="task-queue-board-card-blocker-count">
              <TriangleAlert aria-hidden="true" size={13} />
              {blockers.length} blocker{blockers.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {needsHelp ? (
            <span className="task-queue-board-card-help">
              <CircleHelp aria-hidden="true" size={13} />Help requested
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="task-queue-board-card-footer">
        <span className="task-queue-board-card-schedule">
          <TaskPriorityBadge priority={task.priority} />
          <span className="task-queue-board-card-due" data-tone={deadline.tone}>{deadline.text}</span>
        </span>
        {assigneeIds.length ? (
          <span aria-label={assigneeNames} className="task-queue-board-card-person" role="img" title={assigneeNames}>
            {person?.photoUrl && person.photoUrl !== failedPhotoUrl ? (
              <img
                alt=""
                className="profile-avatar"
                loading="lazy"
                onError={() => setFailedPhotoUrl(person.photoUrl ?? null)}
                referrerPolicy="no-referrer"
                src={person.photoUrl}
              />
            ) : (
              <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                {person ? getMemberInitial(person) : "?"}
              </span>
            )}
            {assigneeIds.length > 1 ? <span aria-hidden="true" className="task-queue-board-card-assignee-count">+{assigneeIds.length - 1}</span> : null}
          </span>
        ) : <span className="task-queue-board-card-unassigned">Unassigned</span>}
      </span>
    </button>
  );
}
