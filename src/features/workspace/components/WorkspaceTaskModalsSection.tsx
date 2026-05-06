import { useEffect, useState } from "react";
import { TaskDetailsModal } from "../modals/TaskDetailsModalContent";
import { TaskEditorModal } from "../modals/TaskEditorModalContent";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceTaskModalsSection(props: WorkspaceModalHostViewProps) {
  const [advancedSectionOpen, setAdvancedSectionOpen] = useState(false);
  const modalTaskId = props.activeTimelineTaskDetail?.id ?? props.activeTask?.id ?? null;

  useEffect(() => {
    setAdvancedSectionOpen(false);
  }, [modalTaskId]);

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
          advancedSectionOpen={advancedSectionOpen}
          onEditTask={props.onOpenTaskEditFromTimelineDetails}
          onResolveTaskBlocker={props.handleResolveTaskBlocker}
          setAdvancedSectionOpen={setAdvancedSectionOpen}
        />
      ) : null}

      {props.taskModalMode ? (
        <TaskEditorModal
          activeTask={props.activeTask}
          bootstrap={props.bootstrap}
          closeTaskModal={props.closeTaskModal}
          advancedSectionOpen={advancedSectionOpen}
          disciplinesById={props.disciplinesById}
          milestonesById={props.milestonesById}
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
          setAdvancedSectionOpen={setAdvancedSectionOpen}
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
