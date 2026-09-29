import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { OpenEditTaskModalOptions } from "@/types/taskEditIntent";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatDate } from "@/lib/appUtils/common";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import { getTimelineTaskDisciplineColor } from "@/features/workspace/views/timeline/model/timelineTaskColors";

import {
  getMemberInitial,
  getTaskCardPerson,
  getTaskQueueCardContextAccentColor,
  getTaskQueueCardContextLabel,
  getTaskQueueCardPriorityPresentation,
  getTaskPriorityLabel,
} from "../taskQueueKanbanCardMeta";
import { TaskDisciplineBadge } from "../taskQueueDisciplineBadge";
import { getTaskQueueBoardState } from "../taskQueueKanbanBoardState";
import { shouldHideTaskQueueSummary } from "../taskQueueViewState";

function getTaskCardDateRelation(dateValue: string): "past" | "today" | "future" | "invalid" {
  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (!dateValue || Number.isNaN(parsedDate.getTime())) return "invalid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate < today ? "past" : parsedDate.getTime() === today.getTime() ? "today" : "future";
}

function getTaskCardDueDatePillClassName(task: TaskRecord): string {
  if (!task.dueDate) {
    return "pill status-pill status-pill-neutral";
  }

  if (task.status === "complete") {
    return "pill task-detail-deadline-pill task-detail-deadline-pill-success";
  }

  const dateRelation = getTaskCardDateRelation(task.dueDate);
  if (dateRelation === "past") {
    return "pill task-detail-deadline-pill task-detail-deadline-pill-danger";
  }

  if (dateRelation === "today") {
    return "pill task-detail-deadline-pill task-detail-deadline-pill-warning";
  }

  return "pill task-detail-deadline-pill task-detail-deadline-pill-success";
}

interface TaskQueueCardProps extends Omit<ComponentPropsWithoutRef<"button">, "children" | "onClick" | "type"> {
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  isNonRobotProject: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord, options?: OpenEditTaskModalOptions) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  taskQueueZoom: number;
  showProjectContextOnCards: boolean;
  showProjectOnCards: boolean;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  task: TaskRecord;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
}

export function TaskQueueCard({
  bootstrap,
  className,
  disciplinesById,
  isNonRobotProject,
  membersById,
  openEditTaskModal,
  projectsById,
  taskQueueZoom,
  showProjectContextOnCards,
  showProjectOnCards,
  style,
  subsystemsById,
  task,
  workstreamsById,
  ...buttonProps
}: TaskQueueCardProps) {
  const person = getTaskCardPerson(task, membersById);
  const taskLogs = bootstrap.workLogs.filter(log => log.taskId === task.id);
  const latestLog = [...taskLogs].sort((a, b) => b.date.localeCompare(a.date))[0];
  const needsHelp = taskLogs.some(log => /\b(needs?|needed)\s+help\b|\bhelp\s+needed\b|\brequest(?:ing|ed)?\s+help\b/i.test(log.notes));
  const loggedHours = taskLogs.reduce((sum, log) => sum + log.hours, 0);
  const disciplineAccentColor = task.disciplineId
    ? getTimelineTaskDisciplineColor(task.disciplineId, disciplinesById)
    : null;
  const priorityPresentation = getTaskQueueCardPriorityPresentation(task.priority);
  const cardStyle = { ...style, ...priorityPresentation.style } as CSSProperties;
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
  const taskPriorityLabel = `${getTaskPriorityLabel(task.priority)} priority`;

  return (
    <button
      {...buttonProps}
      className={`task-queue-board-card editable-hover-target editable-hover-target-row ${priorityPresentation.className}${className ? ` ${className}` : ""}`}
      data-board-state={boardState}
      data-priority={priorityPresentation.dataPriority}
      data-tutorial-target="edit-task-row"
      onClick={(milestone) => {
        milestone.stopPropagation();
        openEditTaskModal(task);
      }}
      style={cardStyle}
      type="button"
    >
      <span className="task-queue-board-card-priority-label">{taskPriorityLabel}</span>
      <div className="task-queue-board-card-header">
        <strong>{task.title}</strong>
        <span className="task-queue-board-card-header-side">
          <span className={`task-queue-board-card-due ${dueDatePillClassName}`}>{dueDateText}</span>
          {task.blockers.length ? (
            <small className="task-queue-board-card-blocker-count">
              {task.blockers.length} blocker{task.blockers.length === 1 ? "" : "s"}
            </small>
          ) : latestLog ? (
            <small className="task-queue-board-card-work-hours">{loggedHours.toFixed(1)}h logged</small>
          ) : null}
        </span>
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
        {discipline || person ? (
          <div className="task-queue-board-card-meta-person-group">
            {discipline ? (
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
      {needsHelp ? <small className="pill status-pill status-pill-warning">Help requested</small> : null}
      <EditableHoverIndicator className="task-queue-board-card-hover" />
    </button>
  );
}
