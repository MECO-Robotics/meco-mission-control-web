import { useState } from "react";

import { HomeView } from "@/features/workspace/views/overview";
import { RisksView } from "@/features/workspace/views/RisksView";
import { TaskCalendarView } from "@/features/workspace/views/taskCalendar/TaskCalendarView";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { TaskCalendarSortMode } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";
import { WorkspaceSectionPanel } from "../../WorkspaceContentPanelShells";
import type { WorkspaceContentPanelsViewProps } from "../workspaceContentPanelsViewTypes";

export function WorkspaceHomeSection(props: WorkspaceContentPanelsViewProps) {
  const [calendarEventFilter, setCalendarEventFilter] = useState<"all" | TaskCalendarEventType>("all");
  const [calendarSortMode, setCalendarSortMode] = useState<TaskCalendarSortMode>("date");
  const [calendarSortDirection, setCalendarSortDirection] = useState<"asc" | "desc">("asc");
  const [calendarSearchFilter, setCalendarSearchFilter] = useState("");
  const openTask = (id: string) => {
    const task = props.bootstrap.tasks.find(item => item.id === id);
    if (task) props.openTimelineTaskDetailsModal(task);
  };
  const openSource = (source: string, id: string) => {
    if (source === "manufacturing") {
      const item = props.bootstrap.manufacturingItems.find(item => item.id === id);
      if (item) props.openEditManufacturingModal(item);
    } else if (source === "purchase") {
      const item = props.bootstrap.purchaseItems.find(item => item.id === id);
      if (item) props.openEditPurchaseModal(item);
    } else props.onOpenDrilldownTarget({ tab: "worklogs", worklogsView: "qa" });
  };
  return <WorkspaceSectionPanel disableAnimations={props.disablePanelAnimations} isActive={props.activeTab === "home"} tabSwitchDirection={props.tabSwitchDirection}>
    <HomeView bootstrap={props.bootstrap} onOpenTask={openTask} onOpenSchedule={(milestoneId) => props.onOpenDrilldownTarget({ tab: "tasks", taskView: "milestones", milestoneId })} />
    <TaskCalendarView
      activePersonFilter={props.activePersonFilter}
      bootstrap={props.bootstrap}
      isAllProjectsView={props.isAllProjectsView}
      onSaveMeeting={props.handleMeetingSave}
      onDeleteTimelineMilestone={props.handleTimelineMilestoneDelete}
      onSaveTimelineMilestone={props.handleTimelineMilestoneSave}
      onTaskDetailOpen={props.openTimelineTaskDetailsModal}
      onCreateMilestoneReport={props.openCreateMilestoneReportModal}
      onTaskEditCanceled={props.onTaskEditCanceled}
      onTaskEditSaved={props.onTaskEditSaved}
      eventFilter={calendarEventFilter}
      onEventFilterChange={setCalendarEventFilter}
      sortMode={calendarSortMode}
      onSortModeChange={setCalendarSortMode}
      sortDirection={calendarSortDirection}
      onSortDirectionChange={setCalendarSortDirection}
      searchFilter={calendarSearchFilter}
      onSearchChange={setCalendarSearchFilter}
    />
    <RisksView activePersonFilter={props.activePersonFilter} bootstrap={props.bootstrap} onDeleteRisk={props.onDeleteRisk} onUpdateRisk={props.onUpdateRisk} openTaskDetailModal={props.openTimelineTaskDetailsModal} onOpenSource={openSource} />
  </WorkspaceSectionPanel>;
}
