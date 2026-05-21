import { TaskDetailReveal } from "../TaskDetailReveal";

interface TaskDetailsAssignedListProps {
  assigneeNames: string[];
  emptyLabel?: string;
}

export function TaskDetailsAssignedList({ assigneeNames, emptyLabel = "Unassigned" }: TaskDetailsAssignedListProps) {
  if (assigneeNames.length === 0) {
    return <div className="task-details-assigned-empty">{emptyLabel}</div>;
  }

  return (
    <>
      {assigneeNames.map((assigneeName, index) => (
        <div className="task-details-assigned-item" key={`${assigneeName}-${index}`}>
          <TaskDetailReveal className="task-detail-ellipsis-reveal" text={assigneeName} />
        </div>
      ))}
    </>
  );
}
