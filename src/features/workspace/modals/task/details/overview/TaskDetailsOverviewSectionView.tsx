import type { TaskDetailsOverviewSectionProps } from "./TaskDetailsOverviewTypes";
import { TaskDetailsOverviewAssignedField } from "./TaskDetailsOverviewAssignedField";
import { TaskDetailsOverviewPersonField } from "./TaskDetailsOverviewPersonField";
import { TaskDetailsOverviewPriorityField } from "./TaskDetailsOverviewPriorityField";
import { TaskDetailsOverviewSubsystemField } from "./TaskDetailsOverviewSubsystemField";
import { TaskDetailsOverviewSummaryField } from "./TaskDetailsOverviewSummaryField";
import { useTaskDetailsOverviewModel } from "./useTaskDetailsOverviewModel";

export function TaskDetailsOverviewSectionView(props: TaskDetailsOverviewSectionProps) {
  const {
    activeTask,
    canInlineEdit,
    editingField,
    openTaskEditModal,
    setEditingField,
  } = props;
  const model = useTaskDetailsOverviewModel(props);
  const fieldProps = {
    canInlineEdit,
    editingField,
    model,
    openTaskEditModal,
    setEditingField,
  };

  return (
    <>
      <TaskDetailsOverviewSummaryField activeSummary={activeTask.summary} {...fieldProps} />
      <div className="task-details-section-grid task-details-overview-grid modal-wide">
        <TaskDetailsOverviewPriorityField {...fieldProps} />
        <TaskDetailsOverviewSubsystemField {...fieldProps} />
        <TaskDetailsOverviewPersonField kind="owner" {...fieldProps} />
        <TaskDetailsOverviewAssignedField {...fieldProps} />
        <TaskDetailsOverviewPersonField kind="mentor" {...fieldProps} />
      </div>
    </>
  );
}
