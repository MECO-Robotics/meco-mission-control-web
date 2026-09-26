import { useEffect, useState } from "react";
import { TaskDetailsModal } from "../modals/TaskDetailsModalContent";
import { TaskEditorModal } from "../modals/TaskEditorModalContent";
import type { WorkspaceModalHostViewProps } from "./workspaceModalHostViewTypes";

export function WorkspaceTaskModalsSection(props: WorkspaceModalHostViewProps) {
  const editor = props.taskEditor;
  const [advancedSectionOpen, setAdvancedSectionOpen] = useState(false);
  const modalTaskId = editor.activeTimelineTaskDetail?.id ?? editor.activeTask?.id ?? null;

  useEffect(() => {
    setAdvancedSectionOpen(false);
  }, [modalTaskId]);

  if (!editor.activeTimelineTaskDetail && !editor.taskModalMode) {
    return null;
  }

  return (
    <>
      {editor.activeTimelineTaskDetail ? (
        <TaskDetailsModal
          activeTask={editor.activeTimelineTaskDetail}
          bootstrap={props.bootstrap}
          closeTaskDetailsModal={editor.closeTimelineTaskDetailsModal}
          advancedSectionOpen={advancedSectionOpen}
          onEditTask={editor.openEditTaskModal}
          onLogWork={props.openCreateWorkLogModal}
          onSubmitQa={props.openCreateQaReportModal}
          onResolveTaskBlocker={editor.handleResolveTaskBlocker}
          setAdvancedSectionOpen={setAdvancedSectionOpen}
        />
      ) : null}

      {editor.taskModalMode ? (
        <TaskEditorModal
          {...editor}
          taskModalMode={editor.taskModalMode}
          bootstrap={props.bootstrap}
          advancedSectionOpen={advancedSectionOpen}
          disciplinesById={props.disciplinesById}
          milestonesById={props.milestonesById}
          mechanismsById={props.mechanismsById}
          mentors={props.mentors}
          partDefinitionsById={props.partDefinitionsById}
          partInstancesById={props.partInstancesById}
          requestPhotoUpload={props.requestPhotoUpload}
          openTaskDetailsModal={editor.openTimelineTaskDetailsModal}
          onTaskEditCanceled={props.onTaskEditCanceled}
          setAdvancedSectionOpen={setAdvancedSectionOpen}
          showCreateTypeToggle={editor.showTimelineCreateToggleInTaskModal}
          onSwitchCreateTypeToMilestone={editor.switchTaskCreateToMilestone}
          students={props.students}
        />
      ) : null}
    </>
  );
}
