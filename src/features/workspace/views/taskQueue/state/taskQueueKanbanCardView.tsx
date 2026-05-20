import type { CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatDate } from "@/lib/appUtils/common";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import { getTimelineTaskDisciplineColor } from "@/features/workspace/views/timeline/model/timelineTaskColors";

import {
  getMemberInitial,
  getTaskCardPerson,
  getTaskQueueCardContextAccentColor,
  getTaskQueueCardContextLabel,
  TaskPriorityBadge,
} from "../taskQueueKanbanCardMeta";
import { TaskDisciplineBadge } from "../taskQueueDisciplineBadge";
import { getTaskQueueBoardState } from "../taskQueueKanbanBoardState";
import { shouldHideTaskQueueSummary } from "../taskQueueViewState";

function isTaskCardDateOverdue(dateValue: string): boolean {
  if (!dateValue) {
    return false;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate.getTime() < today.getTime();
}

function isTaskCardDateToday(dateValue: string): boolean {
  if (!dateValue) {
    return false;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate.getTime() === today.getTime();
}

function getTaskCardDueDatePillClassName(task: TaskRecord): string {
  if (!task.dueDate) {
    return "pill status-pill status-pill-neutral";
  }

  if (task.status === "complete") {
    return "pill task-detail-deadline-pill task-detail-deadline-pill-success";
  }

  if (isTaskCardDateOverdue(task.dueDate)) {
    return "pill task-detail-deadline-pill task-detail-deadline-pill-danger";
  }

  if (isTaskCardDateToday(task.dueDate)) {
    return "pill task-detail-deadline-pill task-detail-deadline-pill-warning";
  }

  return "pill task-detail-deadline-pill task-detail-deadline-pill-success";
}

interface TaskQueueCardProps {
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  isNonRobotProject: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  taskQueueZoom: number;
  showProjectContextOnCards: boolean;
  showProjectOnCards: boolean;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  task: TaskRecord;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
  showPriorityBadge?: boolean;
}

export function TaskQueueCard({
  bootstrap,
  disciplinesById,
  isNonRobotProject,
  membersById,
  openEditTaskModal,
  projectsById,
  taskQueueZoom,
  showPriorityBadge = true,
  showProjectContextOnCards,
  showProjectOnCards,
  subsystemsById,
  task,
  workstreamsById,
}: TaskQueueCardProps) {
  const person = getTaskCardPerson(task, membersById);
  const disciplineAccentColor = task.disciplineId
    ? getTimelineTaskDisciplineColor(task.disciplineId, disciplinesById)
    : null;
  const cardStyle = disciplineAccentColor
    ? ({
        "--task-queue-board-card-discipline-accent": disciplineAccentColor,
      } as CSSProperties)
    : undefined;
  const boardState = getTaskQueueBoardState(task, bootstrap);
  const dueDateText = task.dueDate ? `Due ${formatDate(task.dueDate)}` : "Not set";
  const dueDatePillClassName = getTaskCardDueDatePillClassName(task);
  const taskContextLabel = getTaskQueueCardContextLabel(
    task,
    isNonRobotProject ? "operations" : "robot",
    subsystemsById,
    workstreamsById,
  );
  const taskContextAccentColor = getTaskQueueCardContextAccentColor(
    task,
    isNonRobotProject ? "operations" : "robot",
    subsystemsById,
    workstreamsById,
  );
  const discipline = task.disciplineId ? disciplinesById[task.disciplineId] ?? null : null;
  const taskContextStyle = {
    "--task-queue-board-card-context-accent": taskContextAccentColor,
    "--task-queue-board-card-context-bg": `color-mix(in srgb, ${taskContextAccentColor} 24%, transparent)`,
    "--task-queue-board-card-context-border": `color-mix(in srgb, ${taskContextAccentColor} 54%, transparent)`,
  } as CSSProperties;
  const hideSummary = shouldHideTaskQueueSummary(taskQueueZoom);
  const showDisciplineBadge = Boolean(!showProjectOnCards && showProjectContextOnCards && discipline);

  return (
    <button
      className={`task-queue-board-card editable-hover-target editable-hover-target-row${
        disciplineAccentColor ? " task-queue-board-card-discipline-accented" : ""
      }`}
      data-board-state={boardState}
      data-tutorial-target="edit-task-row"
      onClick={(milestone) => {
        milestone.stopPropagation();
        openEditTaskModal(task);
      }}
      style={cardStyle}
      type="button"
    >
      <div className="task-queue-board-card-header">
        <strong>{task.title}</strong>
        <span className={`task-queue-board-card-due ${dueDatePillClassName}`}>{dueDateText}</span>
      </div>
      {!hideSummary ? (
        <small className="task-queue-board-card-summary task-queue-board-card-summary-task">
          {task.summary}
        </small>
      ) : null}
      <div
        className={`task-queue-board-card-meta${showProjectOnCards ? "" : " task-queue-board-card-meta-person-only"}`}
      >
        {showProjectOnCards ? (
          <span>{projectsById[task.projectId]?.name ?? "Unknown project"}</span>
        ) : showProjectContextOnCards ? (
          <span
            className="task-queue-board-card-context-chip task-queue-board-card-context-chip-due-style"
            style={taskContextStyle}
            title={taskContextLabel}
          >
            {taskContextLabel}
          </span>
        ) : null}
        {showPriorityBadge || person ? (
          <div className="task-queue-board-card-meta-person-group">
            {showPriorityBadge ? <TaskPriorityBadge priority={task.priority} /> : null}
            {showDisciplineBadge && discipline ? (
              <TaskDisciplineBadge accentColor={disciplineAccentColor ?? "#7a8799"} discipline={discipline} />
            ) : null}
            {person ? (
              <span className="task-queue-board-card-person" title={person.name}>
                {person.photoUrl ? (
                  <img
                    alt={`${person.name} profile picture`}
                    className="profile-avatar"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={person.photoUrl}
                  />
                ) : (
                  <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                    {getMemberInitial(person)}
                  </span>
                )}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <EditableHoverIndicator className="task-queue-board-card-hover" />
    </button>
  );
}
