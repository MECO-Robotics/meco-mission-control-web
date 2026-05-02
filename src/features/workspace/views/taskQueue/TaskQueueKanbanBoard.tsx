import { useMemo } from "react";
import type { CSSProperties } from "react";

import type { BootstrapPayload, TaskRecord } from "@/types";
import { formatDate } from "@/lib/appUtils";
import { EditableHoverIndicator, getStatusPillClassName } from "@/features/workspace/shared";
import {
  TASK_QUEUE_BOARD_COLUMNS,
  formatTaskQueueBoardState,
  getTaskQueueBoardState,
  getMemberInitial,
  getTaskCardPerson,
  getTaskQueueCardContextLabel,
  groupTasksByBoardState,
  TaskPriorityBadge,
  type TaskQueueBoardState,
} from "./taskQueueKanban";
import { getTimelineTaskDisciplineColor } from "@/features/workspace/views/timeline/timelineTaskColors";
import { TimelineTaskStatusLogo } from "@/features/workspace/views/timeline/TimelineTaskStatusLogo";
import type { TimelineTaskStatusSignal } from "@/features/workspace/views/timeline/timelineGridBodyUtils";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";

const TASK_QUEUE_BOARD_STATE_LOGO_SPECS: Record<
  TaskQueueBoardState,
  { signal: TimelineTaskStatusSignal; status: TaskRecord["status"] }
> = {
  "not-started": {
    signal: "not-started",
    status: "not-started",
  },
  "in-progress": {
    signal: "in-progress",
    status: "in-progress",
  },
  blocked: {
    signal: "blocked",
    status: "not-started",
  },
  "waiting-for-qa": {
    signal: "waiting-for-qa",
    status: "waiting-for-qa",
  },
  complete: {
    signal: "complete",
    status: "complete",
  },
};

const PRIORITY_ORDER: TaskRecord["priority"][] = ["critical", "high", "medium", "low"];

interface TaskQueueKanbanBoardProps {
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  isNonRobotProject: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  showProjectContextOnCards: boolean;
  showProjectOnCards: boolean;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  tasks: TaskRecord[];
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
  focusedState: TaskQueueBoardState | null;
  onClearFocus: () => void;
  onFocusState: (state: TaskQueueBoardState) => void;
}

export function TaskQueueKanbanBoard({
  bootstrap,
  disciplinesById,
  isNonRobotProject,
  membersById,
  openEditTaskModal,
  projectsById,
  showProjectContextOnCards,
  showProjectOnCards,
  subsystemsById,
  tasks,
  workstreamsById,
  focusedState,
  onClearFocus,
  onFocusState,
}: TaskQueueKanbanBoardProps) {
  const tasksByState = useMemo(() => groupTasksByBoardState(tasks, bootstrap), [bootstrap, tasks]);

  const focusedTasks = useMemo(() => (focusedState === null ? [] : tasksByState[focusedState]), [
    focusedState,
    tasksByState,
  ]);

  const groupedFocusedTasks = useMemo(() => {
    if (focusedState === null) {
      return [];
    }

    return PRIORITY_ORDER.map((priority) => ({
      label: priority[0].toUpperCase() + priority.slice(1),
      tasks: focusedTasks.filter((task) => task.priority === priority),
      priority,
    })).filter((group) => group.tasks.length > 0);
  }, [focusedState, focusedTasks]);

  if (focusedState !== null) {
    return (
      <section className="task-queue-board-focused" data-board-state={focusedState}>
        <div className="task-queue-board-focused-shell">
          <header className="task-queue-board-focused-header">
            <div className="task-queue-board-focused-title-stack">
              <h3 className="task-queue-board-focused-title">
                <span className={getStatusPillClassName(focusedState)}>
                  <span aria-hidden="true" className="task-queue-board-focused-title-icon">
                    <TimelineTaskStatusLogo
                      compact
                      signal={TASK_QUEUE_BOARD_STATE_LOGO_SPECS[focusedState].signal}
                      status={TASK_QUEUE_BOARD_STATE_LOGO_SPECS[focusedState].status}
                    />
                  </span>
                  <span className="task-queue-board-focused-title-label">
                    {formatTaskQueueBoardState(focusedState)}
                  </span>
                </span>
              </h3>
              <span className="task-queue-board-focused-count">{focusedTasks.length}</span>
            </div>
            <button
              aria-label="Exit focused column view"
              className="task-queue-board-focused-exit"
              onClick={onClearFocus}
              type="button"
            >
              {"\u00d7"}
            </button>
          </header>

          <div className="task-queue-board-focused-groups">
            {groupedFocusedTasks.length > 0 ? (
              groupedFocusedTasks.map((group) => (
                <section className="task-queue-board-priority-group" key={group.priority}>
                  <header
                    className={`task-queue-board-priority-label task-queue-board-priority-label-${group.priority}`}
                  >
                    <span aria-hidden="true" className="task-queue-board-priority-label-icon">
                      <TaskPriorityBadge priority={group.priority} />
                    </span>
                    <span className="task-queue-board-priority-label-text">{group.label}</span>
                    <span className="task-queue-board-priority-label-count">
                      {group.tasks.length}
                    </span>
                  </header>
                  <div className="task-queue-board-priority-grid">
                    {group.tasks.map((task) => (
                      <TaskQueueCard
                        disciplinesById={disciplinesById}
                        bootstrap={bootstrap}
                        isNonRobotProject={isNonRobotProject}
                        key={task.id}
                        membersById={membersById}
                        openEditTaskModal={openEditTaskModal}
                        projectsById={projectsById}
                        showProjectContextOnCards={showProjectContextOnCards}
                        showProjectOnCards={showProjectOnCards}
                        subsystemsById={subsystemsById}
                        showPriorityBadge={false}
                        task={task}
                        workstreamsById={workstreamsById}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <p className="empty-state">No tasks match the current filters.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <KanbanColumns
      boardClassName="task-queue-board"
      columnBodyClassName="task-queue-board-column-body"
      columnClassName="task-queue-board-column"
      columnEmptyClassName="task-queue-board-column-empty"
      columnCountClassName="task-queue-board-column-count"
      columnHeaderClassName="task-queue-board-column-header"
      columns={TASK_QUEUE_BOARD_COLUMNS.map(({ state }) => ({
        state,
        count: tasksByState[state].length,
        header: (
          <span className={getStatusPillClassName(state)}>
            <span aria-hidden="true" className="task-queue-board-column-header-icon">
              <TimelineTaskStatusLogo
                compact
                signal={TASK_QUEUE_BOARD_STATE_LOGO_SPECS[state].signal}
                status={TASK_QUEUE_BOARD_STATE_LOGO_SPECS[state].status}
              />
            </span>
            <span className="task-queue-board-column-header-label">
              {formatTaskQueueBoardState(state)}
            </span>
          </span>
        ),
      }))}
      emptyLabel="No tasks"
      itemsByState={tasksByState}
      onColumnBodyClick={onFocusState}
      renderItem={(task) => (
        <TaskQueueCard
          disciplinesById={disciplinesById}
          bootstrap={bootstrap}
          isNonRobotProject={isNonRobotProject}
          key={task.id}
          membersById={membersById}
          openEditTaskModal={openEditTaskModal}
          projectsById={projectsById}
          showProjectContextOnCards={showProjectContextOnCards}
          showProjectOnCards={showProjectOnCards}
          subsystemsById={subsystemsById}
          showPriorityBadge
          task={task}
          workstreamsById={workstreamsById}
        />
      )}
    />
  );
}

function TaskQueueCard({
  disciplinesById,
  bootstrap,
  isNonRobotProject,
  membersById,
  openEditTaskModal,
  projectsById,
  showProjectContextOnCards,
  showProjectOnCards,
  showPriorityBadge = true,
  subsystemsById,
  task,
  workstreamsById,
}: {
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  bootstrap: BootstrapPayload;
  isNonRobotProject: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  showProjectContextOnCards: boolean;
  showProjectOnCards: boolean;
  showPriorityBadge?: boolean;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  task: TaskRecord;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
}) {
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
  const taskContextLabel = getTaskQueueCardContextLabel(
    task,
    isNonRobotProject ? "operations" : "robot",
    subsystemsById,
    workstreamsById,
  );

  return (
    <button
      className={`task-queue-board-card editable-hover-target editable-hover-target-row${
        disciplineAccentColor ? " task-queue-board-card-discipline-accented" : ""
      }`}
      data-board-state={boardState}
      data-tutorial-target="edit-task-row"
      onClick={(event) => {
        event.stopPropagation();
        openEditTaskModal(task);
      }}
      style={cardStyle}
      type="button"
    >
      <div className="task-queue-board-card-header">
        <strong>{task.title}</strong>
        <span className="task-queue-board-card-due">Due {formatDate(task.dueDate)}</span>
      </div>
      <small className="task-queue-board-card-summary">{task.summary}</small>
      <div
        className={`task-queue-board-card-meta${showProjectOnCards ? "" : " task-queue-board-card-meta-person-only"}`}
      >
        {showProjectOnCards ? (
          <span>{projectsById[task.projectId]?.name ?? "Unknown project"}</span>
        ) : showProjectContextOnCards ? (
          <span className="task-queue-board-card-context-chip" title={taskContextLabel}>
            {taskContextLabel}
          </span>
        ) : null}
        {showPriorityBadge || person ? (
          <div className="task-queue-board-card-meta-person-group">
            {showPriorityBadge ? <TaskPriorityBadge priority={task.priority} /> : null}
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
