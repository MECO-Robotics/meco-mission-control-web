import { useState } from "react";

import type { TaskRecord } from "@/types/recordsExecution";
import type { TaskStatus } from "@/types/common";
import { HOME_TASK_STATUSES } from "./overviewViewModel";

export function HomeTaskStatusDistribution({
  tasksByStatus,
  onOpenTask,
}: {
  tasksByStatus: Record<TaskStatus, TaskRecord[]>;
  onOpenTask: (taskId: string) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const total = HOME_TASK_STATUSES.reduce((sum, { id }) => sum + tasksByStatus[id].length, 0);
  const selected = selectedStatus ? tasksByStatus[selectedStatus] : [];
  const selectedLabel = HOME_TASK_STATUSES.find(({ id }) => id === selectedStatus)?.label;

  return (
    <section className="home-task-status" aria-labelledby="home-task-status-title">
      <div className="workspace-section-heading">
        <h2 id="home-task-status-title">Task status</h2>
        <span>{total} tasks</span>
      </div>
      {total ? (
        <div className="home-task-status-bar" role="img" aria-label={`${total} tasks distributed by status`}>
          {HOME_TASK_STATUSES.map(({ id, label, tone }) => {
            const count = tasksByStatus[id].length;
            if (!count) return null;
            return (
              <span
                className={`home-task-status-segment status-pill-${tone}`}
                key={id}
                style={{ flexGrow: count }}
                title={`${label}: ${count}`}
              />
            );
          })}
        </div>
      ) : (
        <p className="empty-state">No tasks in this scope.</p>
      )}
      <div className="home-task-status-legend" aria-label="Filter task list by status">
        {HOME_TASK_STATUSES.map(({ id, label, tone }) => {
          const count = tasksByStatus[id].length;
          return (
            <button
              aria-pressed={selectedStatus === id}
              className={`home-task-status-choice${selectedStatus === id ? " is-selected" : ""}`}
              key={id}
              onClick={() => setSelectedStatus(selectedStatus === id ? null : id)}
              type="button"
            >
              <span className={`home-task-status-swatch status-pill-${tone}`} aria-hidden="true" />
              <span>{label}</span>
              <strong>{count}</strong>
            </button>
          );
        })}
      </div>
      {selectedStatus ? (
        <div className="home-task-status-results">
          <h3>{selectedLabel} · {selected.length}</h3>
          {selected.length ? (
            <ul className="home-status-task-list">
              {selected.map((task) => (
                <li key={task.id}>
                  <button className="home-status-task" onClick={() => onOpenTask(task.id)} type="button">
                    {task.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No tasks have this status.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
