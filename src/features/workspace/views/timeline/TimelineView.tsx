import React, { useMemo } from "react";
import type { BootstrapPayload, EventPayload, TaskRecord } from "@/types";
import { type FilterSelection } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { buildTimelineGridLayout } from "./model/timelineGridLayout";
import { TimelineGridBody } from "./TimelineGridBody";
import { TimelineMilestoneHoverLayer } from "./TimelineMilestoneHoverLayer";
import { TimelineMilestoneModal } from "./TimelineMilestoneModal";
import {
  TimelineMilestoneUnderlaysPortal,
  TimelineRowHighlightsPortal,
  TimelineTodayMarkerPortal,
} from "./portals";
import { TimelineToolbar } from "./TimelineToolbar";
import { useTimelineViewActions } from "./hooks/useTimelineViewActions";
import { useTimelineViewData } from "./hooks/useTimelineViewData";
import { useTimelineViewState } from "./hooks/useTimelineViewState";

interface TimelineViewProps {
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  activePersonFilter: FilterSelection;
  setActivePersonFilter: (value: FilterSelection) => void;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openTaskDetailModal: (task: TaskRecord) => void;
  openCreateTaskModal: () => void;
  onDeleteTimelineEvent: (eventId: string) => Promise<void>;
  onSaveTimelineEvent: (
    mode: "create" | "edit",
    eventId: string | null,
    payload: EventPayload,
  ) => Promise<void>;
  triggerCreateMilestoneToken: number;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  bootstrap,
  isAllProjectsView,
  activePersonFilter,
  setActivePersonFilter,
  membersById: _membersById,
  openTaskDetailModal,
  openCreateTaskModal,
  onDeleteTimelineEvent,
  onSaveTimelineEvent,
  triggerCreateMilestoneToken,
}) => {
  const state = useTimelineViewState();
  const data = useTimelineViewData({
    activePersonFilter,
    bootstrap,
    openCreateTaskModal,
    onDeleteTimelineEvent,
    onSaveTimelineEvent,
    triggerCreateMilestoneToken,
    viewAnchorDate: state.viewAnchorDate,
    viewInterval: state.viewInterval,
  });
  const actions = useTimelineViewActions({
    openTaskDetailModal,
    openEventModalForDay: data.eventModal.openEventModalForDay,
    playTimelineGridAnimation: state.playTimelineGridAnimation,
    setSelectedSubsystemId: state.setSelectedSubsystemId,
    setSelectedTaskId: state.setSelectedTaskId,
    setViewAnchorDate: state.setViewAnchorDate,
    setViewInterval: state.setViewInterval,
    viewInterval: state.viewInterval,
  });

  const layout = useMemo(
    () =>
      buildTimelineGridLayout({
        dayCount: data.timeline.days.length,
        isAllProjectsView,
        isProjectColumnVisible: state.isProjectColumnVisible,
        isSubsystemColumnVisible: state.isSubsystemColumnVisible,
        timelineZoom: state.timelineZoom,
        viewInterval: state.viewInterval,
      }),
    [
      data.timeline.days.length,
      isAllProjectsView,
      state.isProjectColumnVisible,
      state.isSubsystemColumnVisible,
      state.timelineZoom,
      state.viewInterval,
    ],
  );

  return (
    <section className={`panel dense-panel timeline-layout ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Subsystem timeline</h2>
          <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
            {activePersonFilter.length === 0
              ? "Showing all roster-linked tasks."
              : `Filtered to ${data.activePersonFilterLabel}.`}
          </p>
        </div>
        <TimelineToolbar
          activePersonFilter={activePersonFilter}
          bootstrapMembers={bootstrap.members}
          onAdjustZoom={state.adjustTimelineZoom}
          onChangePersonFilter={setActivePersonFilter}
          onCreateTask={openCreateTaskModal}
          onIntervalChange={state.handleTimelineIntervalChange}
          onShiftPeriod={state.shiftTimelinePeriod}
          timelinePeriodLabel={data.timelinePeriodLabel}
          timelineZoom={state.timelineZoom}
          viewInterval={state.viewInterval}
        />
      </div>

      <TimelineGridBody
        bootstrap={bootstrap}
        clearHoveredMilestonePopup={data.clearHoveredMilestonePopup}
        collapsedProjects={state.collapsedProjects}
        collapsedSubsystems={state.collapsedSubsystems}
        disciplinesById={data.disciplinesById}
        firstDayGridColumn={layout.firstDayGridColumn}
        gridMinWidth={layout.gridMinWidth}
        handleTimelineDayMouseEnter={data.handleTimelineDayMouseEnter}
        handleTimelineZoomWheel={state.handleTimelineZoomWheel}
        hasProjectColumn={layout.hasProjectColumn}
        isScrolling={data.isTimelineShellScrolling}
        isWeekView={state.viewInterval === "week"}
        monthGroups={data.monthGroups}
        handleTimelineHeaderDayClick={actions.handleTimelineHeaderDayClick}
        projectColumnWidth={layout.projectColumnWidth}
        projectRows={data.projectRows}
        hoveredSubsystemId={state.hoveredSubsystemId}
        hoveredTaskId={state.hoveredTaskId}
        selectedSubsystemId={state.selectedSubsystemId}
        selectedTaskId={state.selectedTaskId}
        statusIconColumnIndex={layout.statusIconColumnIndex}
        statusIconColumnWidth={layout.statusIconColumnWidth}
        statusIconStickyRight={layout.statusIconStickyRight}
        showProjectCol={layout.showProjectCol}
        showSubsystemCol={layout.showSubsystemCol}
        subsystemColumnIndex={layout.subsystemColumnIndex}
        subsystemColumnWidth={layout.subsystemColumnWidth}
        subsystemRows={data.timeline.subsystemRows}
        subsystemStickyLeft={layout.subsystemStickyLeft}
        timelineDayCellRefs={data.timelineDayCellRefs}
        timelineDayHeaderCells={data.timelineDayHeaderCells}
        timelineFilterMotionClass={data.timelineFilterMotionClass}
        timelineGridMotion={state.timelineGridMotion}
        timelineGridRef={data.timelineGridRef}
        timelineGridTemplate={layout.timelineGridTemplate}
        timelineZoom={state.timelineZoom}
        timelineShellRef={data.timelineShellRef}
        clearHoveredSubsystemRow={state.clearHoveredSubsystemRow}
        clearHoveredTaskRow={state.clearHoveredTaskRow}
        hoverTaskRow={state.hoverTaskRow}
        hoverSubsystemRow={state.hoverSubsystemRow}
        selectSubsystemRow={state.selectSubsystemRow}
        selectTaskRow={state.selectTaskRow}
        toggleProject={state.toggleProject}
        toggleProjectColumn={state.toggleProjectColumn}
        toggleSubsystem={state.toggleSubsystem}
        toggleSubsystemColumn={state.toggleSubsystemColumn}
        openTaskDetailModal={actions.openTaskDetailAndSelectTask}
      />

      <TimelineMilestoneUnderlaysPortal
        portalTarget={data.tooltipPortalTarget}
        underlays={data.timelineDayMilestoneUnderlays}
      />

      <TimelineTodayMarkerPortal
        portalTarget={data.timelineShellRef.current}
        showLabelAtTop={state.viewInterval === "month"}
        todayMarkerLeft={data.timelineTodayMarkerLeft}
      />

      <TimelineRowHighlightsPortal
        hoveredSubsystemId={state.hoveredSubsystemId}
        hoveredTaskId={state.hoveredTaskId}
        portalTarget={data.tooltipPortalTarget}
        resolveRowHighlightGeometry={data.resolveRowHighlightGeometry}
        resolveTaskRowHighlightStyle={data.resolveTaskRowHighlightStyle}
        selectedSubsystemId={state.selectedSubsystemId}
        selectedTaskId={state.selectedTaskId}
      />

      <TimelineMilestoneHoverLayer
        controllerRef={data.setHoveredMilestonePopupLayerRef}
        portalTarget={data.tooltipPortalTarget}
        resolveGeometry={data.resolveMilestonePopupGeometry}
      />

      <TimelineMilestoneModal
        activeDayEvents={data.eventModal.activeDayEvents}
        activeEventDay={data.eventModal.activeEventDay}
        bootstrap={bootstrap}
        eventDraft={data.eventModal.eventDraft}
        eventEndDate={data.eventModal.eventEndDate}
        eventEndTime={data.eventModal.eventEndTime}
        eventError={data.eventModal.eventError}
        eventStartDate={data.eventModal.eventStartDate}
        eventStartTime={data.eventModal.eventStartTime}
        isDeletingEvent={data.eventModal.isDeletingEvent}
        isSavingEvent={data.eventModal.isSavingEvent}
        mode={data.eventModal.eventModalMode}
        onClose={data.eventModal.closeEventModal}
        onDelete={data.eventModal.handleEventDelete}
        onSubmit={data.eventModal.handleEventSubmit}
        onSwitchToTask={data.eventModal.switchMilestoneCreateToTask}
        portalTarget={data.modalPortalTarget}
        projectsById={data.projectsById}
        selectableSubsystems={data.selectableSubsystems}
        setEventDraft={data.eventModal.setEventDraft}
        setEventEndDate={data.eventModal.setEventEndDate}
        setEventEndTime={data.eventModal.setEventEndTime}
        setEventStartDate={data.eventModal.setEventStartDate}
        setEventStartTime={data.eventModal.setEventStartTime}
        subsystemsById={data.subsystemsById}
      />
    </section>
  );
};
