import { memo, useState } from "react";

import { MilestonesView } from "@/features/workspace/views/milestones/MilestonesView";
import { RobotMapView } from "@/features/workspace/views/robotMap/RobotMapView";
import { WorkQueueView } from "@/features/workspace/views/work/WorkQueueView";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { WorkspaceSectionPanel, WorkspaceSubPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

const MemoizedTimelineView = memo(TimelineView);

export function WorkspaceTaskSection(props: WorkspaceContentPanelsViewProps) {
  const disablePanelAnimations = props.disablePanelAnimations ?? false;
  const [scheduleSearchFilter, setScheduleSearchFilter] = useState("");
  const {
    activePersonFilter,
    bootstrap,
    handleTimelineMilestoneDelete,
    handleTimelineMilestoneSave,
    isAllProjectsView,
    openCreateTaskModal,
    openCreateTaskModalFromTimeline,
    openCreateMechanismModal,
    openCreatePartInstanceModal,
    openCreateSubsystemModal,
    handleDeleteMechanism,
    openEditMechanismModal,
    openEditPartInstanceModal,
    openEditSubsystemModal,
    onOpenDrilldownTarget,
    removePartInstanceFromMechanism,
    savePartImage,
    saveSubsystemLayout,
    updateSubsystemConfiguration,
    openTimelineTaskDetailsModal,
    setActivePersonFilter,
    taskSwipeDirection,
    taskView,
    timelineMilestoneCreateSignal,
  } = props;

  return (
    <WorkspaceSectionPanel
      disableAnimations={disablePanelAnimations}
      isActive={props.activeTab === "tasks"}
      tabSwitchDirection={props.tabSwitchDirection}
    >
      {["calendar", "timeline"].includes(taskView) ? (
        <div className="workspace-schedule-scroll" data-tutorial-target="schedule-view">
          <WorkspaceSubPanel disableAnimations={disablePanelAnimations} isActive swipeDirection={taskSwipeDirection}>
            <MemoizedTimelineView
              activePersonFilter={activePersonFilter}
              bootstrap={bootstrap}
              isAllProjectsView={isAllProjectsView}
              onTaskEditCanceled={props.onTaskEditCanceled}
              onTaskEditSaved={props.onTaskEditSaved}
              onCreateMilestoneReport={props.openCreateMilestoneReportModal}
              onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
              onSaveTimelineMilestone={handleTimelineMilestoneSave}
              searchFilter={scheduleSearchFilter}
              onSearchChange={setScheduleSearchFilter}
              openCreateTaskModal={openCreateTaskModalFromTimeline}
              openTaskDetailModal={openTimelineTaskDetailsModal}
              setActivePersonFilter={setActivePersonFilter}
              triggerCreateMilestoneToken={timelineMilestoneCreateSignal}
            />
          </WorkspaceSubPanel>
        </div>
      ) : null}
      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "robot-map"}
        swipeDirection={taskSwipeDirection}
      >
        <RobotMapView
          bootstrap={bootstrap}
          openCreateMechanismModal={openCreateMechanismModal}
          openCreatePartInstanceModal={openCreatePartInstanceModal}
          openCreateSubsystemModal={openCreateSubsystemModal}
          handleDeleteMechanism={handleDeleteMechanism}
          openEditMechanismModal={openEditMechanismModal}
          openEditPartInstanceModal={openEditPartInstanceModal}
          openEditSubsystemModal={openEditSubsystemModal}
          onOpenDrilldownTarget={onOpenDrilldownTarget}
          onOpenCadWorkspace={() => onOpenDrilldownTarget({ tab: "cad" })}
          removePartInstanceFromMechanism={removePartInstanceFromMechanism}
          onSavePartImage={savePartImage}
          saveSubsystemLayout={saveSubsystemLayout}
          updateSubsystemConfiguration={updateSubsystemConfiguration}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "queue"}
        swipeDirection={taskSwipeDirection}
      >
        <WorkQueueView
          bootstrap={bootstrap}
          onCreateTask={openCreateTaskModal}
          onCreateManufacturing={(process) => props.openCreateManufacturingModal(process)}
          onEditTask={openTimelineTaskDetailsModal}
          onEditManufacturing={props.openEditManufacturingModal}
          onManufacturingStatusChange={props.onCncQuickStatusChange}
          showMentorQuickActions={props.showCncMentorQuickActions}
        />
      </WorkspaceSubPanel>

      <WorkspaceSubPanel
        disableAnimations={disablePanelAnimations}
        isActive={taskView === "milestones"}
        swipeDirection={taskSwipeDirection}
      >
        <MilestonesView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          isAllProjectsView={isAllProjectsView}
          onTaskEditCanceled={props.onTaskEditCanceled}
          onTaskEditSaved={props.onTaskEditSaved}
          onCreateMilestoneReport={props.openCreateMilestoneReportModal}
          onDeleteTimelineMilestone={handleTimelineMilestoneDelete}
          onSaveTimelineMilestone={handleTimelineMilestoneSave}
        />
      </WorkspaceSubPanel>
    </WorkspaceSectionPanel>
  );
}
