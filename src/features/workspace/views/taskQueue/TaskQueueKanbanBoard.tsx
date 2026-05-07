import { useMemo } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";
import { TimelineTaskStatusLogo } from "@/features/workspace/views/timeline/TimelineTaskStatusLogo";
import type { TimelineTaskStatusSignal } from "@/features/workspace/views/timeline/timelineGridBodyUtils";
import {
  TASK_QUEUE_BOARD_COLUMNS,
  formatTaskQueueBoardState,
  groupTasksByBoardState,
  type TaskQueueBoardState,
} from "./taskQueueKanbanBoardState";
import { TaskQueueCard } from "./state/taskQueueKanbanCardView";
import { TaskPriorityBadge } from "./taskQueueKanbanCardMeta";

const TASK_QUEUE_BOARD_STATE_LOGO_SPECS: Record<
  TaskQueueBoardState,
  { signal: TimelineTaskStatusSignal; status: TaskRecord["status"] }
> = {
  "not-started": { signal: "not-started", status: "not-started" },
  "in-progress": { signal: "in-progress", status: "in-progress" },
  blocked: { signal: "blocked", status: "not-started" },
  "waiting-on-dependency": { signal: "waiting-on-dependency", status: "not-started" },
  "waiting-for-qa": { signal: "waiting-for-qa", status: "waiting-for-qa" },
  complete: { signal: "complete", status: "complete" },
};

const PRIORITY_ORDER: TaskRecord["priority"][] = ["critical", "high", "medium", "low"];

interface TaskQueueKanbanBoardProps {
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
  taskQueueZoom,
  showProjectContextOnCards,
  showProjectOnCards,
  subsystemsById,
  tasks,
  workstreamsById,
  focusedState,
  onClearFocus,
  onFocusState,
}: TaskQueueKanbanBoardProps) {
  const tasksByState = useMemo(
    () => groupTasksByBoardState(tasks, bootstrap),
    [bootstrap, tasks],
  );

  const focusedTasks = useMemo(
    () => (focusedState === null ? [] : tasksByState[focusedState]),
    [focusedState, tasksByState],
  );

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
                        bootstrap={bootstrap}
                        disciplinesById={disciplinesById}
                        isNonRobotProject={isNonRobotProject}
                        key={task.id}
                        membersById={membersById}
                        openEditTaskModal={openEditTaskModal}
                        projectsById={projectsById}
                        taskQueueZoom={taskQueueZoom}
                        showPriorityBadge={false}
                        showProjectContextOnCards={showProjectContextOnCards}
                        showProjectOnCards={showProjectOnCards}
                        subsystemsById={subsystemsById}
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
          bootstrap={bootstrap}
          disciplinesById={disciplinesById}
          isNonRobotProject={isNonRobotProject}
          key={task.id}
          membersById={membersById}
          openEditTaskModal={openEditTaskModal}
          projectsById={projectsById}
          taskQueueZoom={taskQueueZoom}
          showPriorityBadge
          showProjectContextOnCards={showProjectContextOnCards}
          showProjectOnCards={showProjectOnCards}
          subsystemsById={subsystemsById}
          task={task}
          workstreamsById={workstreamsById}
        />
      )}
    />
  );
}
