import { TaskDetailsModal, TaskEditorModal } from "../WorkspaceModals";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceTaskModalsSection(props: WorkspaceModalHostViewProps) {
  if (!props.activeTimelineTaskDetail && !props.taskModalMode) {
    return null;
  }

  return (
    <>
      {props.activeTimelineTaskDetail ? (
        <TaskDetailsModal
          activeTask={props.activeTimelineTaskDetail}
          bootstrap={props.bootstrap}
          closeTaskDetailsModal={props.closeTimelineTaskDetailsModal}
          onEditTask={props.onOpenTaskEditFromTimelineDetails}
          onResolveTaskBlocker={props.handleResolveTaskBlocker}
        />
      ) : null}

      {props.taskModalMode ? (
        <TaskEditorModal
          activeTask={props.activeTask}
          bootstrap={props.bootstrap}
          closeTaskModal={props.closeTaskModal}
          disciplinesById={props.disciplinesById}
          eventsById={props.eventsById}
          handleDeleteTask={props.handleDeleteTask}
          handleResolveTaskBlocker={props.handleResolveTaskBlocker}
          handleTaskSubmit={props.handleTaskSubmit}
          isDeletingTask={props.isDeletingTask}
          isSavingTask={props.isSavingTask}
          mechanismsById={props.mechanismsById}
          mentors={props.mentors}
          partDefinitionsById={props.partDefinitionsById}
          partInstancesById={props.partInstancesById}
          requestPhotoUpload={props.requestPhotoUpload}
          openTaskDetailsModal={props.openTaskDetailsModal}
          onTaskEditCanceled={props.onTaskEditCanceled}
          setTaskDraft={props.setTaskDraft}
          showCreateTypeToggle={props.showTimelineCreateToggleInTaskModal}
          onSwitchCreateTypeToMilestone={props.onSwitchTaskCreateToMilestone}
          students={props.students}
          taskDraft={props.taskDraft}
          taskModalMode={props.taskModalMode}
        />
      ) : null}
    </>
  );
}
