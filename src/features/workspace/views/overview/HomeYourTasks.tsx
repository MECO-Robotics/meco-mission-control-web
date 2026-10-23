import { formatDate } from "@/lib/appUtils/common";
import { TASK_PRIORITY_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { TaskRecord } from "@/types/recordsExecution";
import { HOME_TASK_STATUSES } from "./overviewViewModel";
import { parseHomeTaskDueDate } from "./homeYourTasksModel";

function TaskList({ tasks, label, onOpenTask }: {
  tasks: readonly TaskRecord[];
  label: string;
  onOpenTask: (id: string) => void;
}) {
  return !tasks.length ? <p className="empty-state">No unfinished tasks in this scope.</p>
    : <div className="home-your-tasks-scroll" role="region" aria-label={label} tabIndex={0}>
      <ul className="workspace-record-list">{tasks.map(task => <li key={task.id}>
        <button className="home-record-button home-your-task-button" type="button" onClick={() => onOpenTask(task.id)}>
          <strong>{task.title}</strong>
          <span className="home-your-task-meta">{TASK_PRIORITY_OPTIONS.find(option => option.id === task.priority)?.name}
            {" · "}{HOME_TASK_STATUSES.find(status => status.id === task.status)?.label}</span>
          <span className="home-your-task-date">{task.dueDate && parseHomeTaskDueDate(task.dueDate)
            ? <>Due <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time></> : "Due date unknown"}</span>
        </button>
      </li>)}</ul>
    </div>;
}

export function HomeYourTasks({ tasks, unassignedTasks = [], signedInMemberId, onOpenTask }: {
  tasks: readonly TaskRecord[];
  unassignedTasks?: readonly TaskRecord[];
  signedInMemberId: string | null;
  onOpenTask: (id: string) => void;
}) {
  return <aside className="home-your-tasks" aria-labelledby="home-your-tasks-title">
    <div className="workspace-section-heading">
      <h2 id="home-your-tasks-title">Your tasks</h2><span>{tasks.length}</span>
    </div>
    {!signedInMemberId ? <p className="empty-state">Sign in with a linked member account to see your tasks.</p>
      : <TaskList tasks={tasks} label="Your unfinished tasks" onOpenTask={onOpenTask} />}
    <section className="home-unassigned-tasks" aria-labelledby="home-unassigned-tasks-title">
      <div className="workspace-section-heading">
        <h2 id="home-unassigned-tasks-title">Unassigned tasks</h2><span>{unassignedTasks.length}</span>
      </div>
      <TaskList tasks={unassignedTasks} label="Unassigned unfinished tasks" onOpenTask={onOpenTask} />
    </section>
  </aside>;
}
