import { Link2 } from "lucide-react";
import type { TaskRecord } from "@/types/recordsExecution";
import type { TimelineTaskPresentation } from "./model/timelineTaskPresentation";
import { TimelineTaskStatusLogo } from "./TimelineTaskStatusLogo";
import { WorkspacePopover } from "@/features/workspace/shared/ui/WorkspacePopover";

export function TimelineTaskNameCell({ task, presentation, gridRow, taskColumnIndex,
  taskColumnWidth, taskStickyLeft, isHighlighted, onOpenTask, onMouseEnter, onMouseLeave,
}: {
  task: TaskRecord;
  presentation: TimelineTaskPresentation;
  gridRow: string | number;
  taskColumnIndex: number;
  taskColumnWidth: number;
  taskStickyLeft: number;
  isHighlighted: boolean;
  onOpenTask: (task: TaskRecord) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return <div className={`timeline-task-name-cell${isHighlighted ? " is-row-highlighted" : ""}`}
    style={{ gridRow, gridColumn: taskColumnIndex, width: taskColumnWidth, left: taskStickyLeft }}
    onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
    <button type="button" className="timeline-task-name-button" onClick={() => onOpenTask(task)}
      aria-label={`Open task: ${presentation.description}`} title={presentation.description}>
      <TimelineTaskStatusLogo signal={presentation.signal} status={task.status} />
      <span className="timeline-task-name-copy"><strong>{task.title}</strong>
        <span className="timeline-task-name-meta"><span>{presentation.statusLabel}</span>
          <span className="timeline-task-discipline"> · {presentation.discipline}</span></span>
        {presentation.overdueLabel && <span className="timeline-task-overdue">{presentation.overdueLabel}</span>}
      </span>
    </button>
    {presentation.dependencies.length > 0 && <WorkspacePopover className="timeline-task-dependencies"
      label={`Dependencies for ${task.title}`}
      trigger={<><Link2 size={14} aria-hidden="true" /><span>{presentation.dependencies.length}</span></>}>
      {(close) => <ul className="timeline-reference-list">{presentation.dependencies.map((item) => <li key={`${item.direction}-${item.id}`}>
        <span>{item.direction} · {item.state}</span>
        {item.task ? <button className="text-link" type="button" onClick={() => { close(); onOpenTask(item.task!); }}>{item.label}</button> : <span>{item.label}</span>}
      </li>)}</ul>}
    </WorkspacePopover>}
  </div>;
}
