import React, { useEffect, useMemo, useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { IconCalendar, IconTasks } from "@/components/shared/Icons";
import { WorkspaceTopbarControls, buildSingleAddMenuAction, buildTopbarAddMenuActions, makeAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { TaskCalendarSortMode } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";
import { buildTimelineGridLayout } from "./model/timelineGridLayout";
import { TimelineGridBody } from "./TimelineGridBody";
import { TimelineMilestoneHoverLayer } from "./TimelineMilestoneHoverLayer";
import { TimelineMilestoneModal } from "./TimelineMilestoneModal";
import { TimelineMilestoneUnderlaysPortal } from "./portals/TimelineMilestoneUnderlaysPortal";
import { TimelineRowHighlightsPortal } from "./portals/TimelineRowHighlightsPortal";
import { TimelineTodayMarkerPortal } from "./portals/TimelineTodayMarkerPortal";
import { TimelineToolbar } from "./TimelineToolbar";
import { useTimelineViewActions } from "./hooks/useTimelineViewActions";
import { useTimelineViewData } from "./hooks/useTimelineViewData";
import { useTimelineViewFilters } from "./hooks/useTimelineViewFilters";
import { useTimelineViewState } from "./hooks/useTimelineViewState";
import { useTimelineShellSizing } from "./hooks/useTimelineShellSizing";
import { useTimelinePeriodNavigation } from "./hooks/useTimelinePeriodNavigation";
import { getTimelineMinimumZoomForWidth } from "@/features/workspace/shared/timeline/timelineZoom";

interface TimelineViewProps {
  onCreateMilestoneReport?: (milestoneId: string, onReturn?: () => void) => void;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  activePersonFilter: FilterSelection;
  setActivePersonFilter: (value: FilterSelection) => void;
  onTaskEditCanceled?: () => void;
  onTaskEditSaved?: () => void;
  openTaskDetailModal: (task: TaskRecord) => void;
  openCreateTaskModal: () => void;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  triggerCreateMilestoneToken: number;
  searchFilter?: string;
  onSearchChange?: (value: string) => void;
  calendarEventFilter?: "all" | TaskCalendarEventType;
  onCalendarEventFilterChange?: (value: "all" | TaskCalendarEventType) => void;
  calendarSortMode?: TaskCalendarSortMode;
  onCalendarSortModeChange?: (value: TaskCalendarSortMode) => void;
  showCalendarFilters?: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  onCreateMilestoneReport,
  bootstrap,
  isAllProjectsView,
  activePersonFilter,
  setActivePersonFilter,
  onTaskEditCanceled = () => {},
  onTaskEditSaved = () => {},
  openTaskDetailModal,
  openCreateTaskModal,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  triggerCreateMilestoneToken,
  searchFilter: controlledSearchFilter,
  onSearchChange,
  calendarEventFilter,
  onCalendarEventFilterChange,
  calendarSortMode,
  onCalendarSortModeChange,
  showCalendarFilters = false,
}) => {
  const state = useTimelineViewState();
  const { setTimelineZoomMin } = state;
  const [localCalendarEventFilter, setLocalCalendarEventFilter] = useState<"all" | TaskCalendarEventType>("all");
  const [localCalendarSortMode, setLocalCalendarSortMode] = useState<TaskCalendarSortMode>("date");
  const activeCalendarEventFilter = calendarEventFilter ?? localCalendarEventFilter;
  const updateCalendarEventFilter = onCalendarEventFilterChange ?? setLocalCalendarEventFilter;
  const activeCalendarSortMode = calendarSortMode ?? localCalendarSortMode;
  const updateCalendarSortMode = onCalendarSortModeChange ?? setLocalCalendarSortMode;
  const [localSearchFilter, setLocalSearchFilter] = useState("");
  const searchFilter = controlledSearchFilter ?? localSearchFilter;
  const setSearchFilter = onSearchChange ?? setLocalSearchFilter;
  const filterControls = useTimelineViewFilters({
    activePersonFilter,
    bootstrap,
    isAllProjectsView,
  });
  const data = useTimelineViewData({
    activePersonFilter,
    bootstrap,
    isAllProjectsView,
    openCreateTaskModal,
    onTaskEditCanceled,
    onTaskEditSaved,
    searchFilter,
    timelineFilters: filterControls.filters,
    timelineZoom: state.timelineZoom,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
    triggerCreateMilestoneToken,
    viewAnchorDate: state.viewAnchorDate,
    viewInterval: state.viewInterval,
  });
  const actions = useTimelineViewActions({
    openTaskDetailModal,
    openMilestoneModalForDay: data.milestoneModal.openMilestoneModalForDay,
    playTimelineGridAnimation: state.playTimelineGridAnimation,
    setSelectedSubsystemId: state.setSelectedSubsystemId,
    setSelectedTaskId: state.setSelectedTaskId,
    setViewAnchorDate: state.setViewAnchorDate,
    setViewInterval: state.setViewInterval,
    viewInterval: state.viewInterval,
  });
  const { setTimelineGridMotion } = state;
  const { handleTimelineIntervalChange, handleShiftPeriod } = useTimelinePeriodNavigation({
    days: data.timeline.days,
    onIntervalChange: state.handleTimelineIntervalChange,
    shiftTimelinePeriod: state.shiftTimelinePeriod,
    viewAnchorDate: state.viewAnchorDate,
    viewInterval: state.viewInterval,
  });

  const timelineShellWidth = useTimelineShellSizing(data.timelineShellRef);
  const layout = useMemo(
    () =>
      buildTimelineGridLayout({
        dayCount: data.timeline.days.length,
        isAllProjectsView,
        isProjectColumnVisible: state.isProjectColumnVisible,
        isSubsystemColumnVisible: state.isSubsystemColumnVisible,
        timelineShellWidth,
        timelineZoom: state.timelineZoom,
        viewInterval: state.viewInterval,
      }),
    [
      data.timeline.days.length,
      isAllProjectsView,
      state.isProjectColumnVisible,
      state.isSubsystemColumnVisible,
      timelineShellWidth,
      state.timelineZoom,
      state.viewInterval,
    ],
  );

  useEffect(() => {
    const shell = data.timelineShellRef.current;
    if (!shell) return;
    setTimelineZoomMin(getTimelineMinimumZoomForWidth({
      dayCount: data.timeline.days.length,
      fixedColumnWidth: layout.fixedTimelineColumnWidth,
      shellWidth: timelineShellWidth,
      viewInterval: state.viewInterval,
    }));
  }, [data.timeline.days.length, data.timelineShellRef, layout.fixedTimelineColumnWidth, setTimelineZoomMin, state.viewInterval, timelineShellWidth]);

  useEffect(() => {
    if (!state.timelineGridMotion.direction) {
      return undefined;
    }

    const clearMotion = window.setTimeout(() => {
      setTimelineGridMotion((current) =>
        current.direction ? { direction: null, token: current.token } : current,
      );
    }, 180);

    return () => {
      window.clearTimeout(clearMotion);
    };
  }, [state.timelineGridMotion.direction, setTimelineGridMotion]);

  return (
    <section className={`panel dense-panel timeline-layout ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls className="timeline-toolbar timeline-topbar-controls">
          <TimelineToolbar
            activeFilterCount={filterControls.activeFilterCount}
            calendarEventFilter={activeCalendarEventFilter}
            calendarSortMode={activeCalendarSortMode}
            showCalendarFilters={showCalendarFilters}
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            disciplineFilter={filterControls.filters.disciplineFilter}
            disciplineFilterOptions={filterControls.disciplineFilterOptions}
            isAllProjectsView={isAllProjectsView}
            onAdjustZoom={state.adjustTimelineZoom}
            onChangePersonFilter={setActivePersonFilter}
            onCalendarEventFilterChange={updateCalendarEventFilter}
            onCalendarSortModeChange={updateCalendarSortMode}
            onSearchChange={setSearchFilter}
            onIntervalChange={handleTimelineIntervalChange}
            onShiftPeriod={handleShiftPeriod}
            priorityFilter={filterControls.filters.priorityFilter}
            projectFilter={filterControls.filters.projectFilter}
            searchFilter={searchFilter}
            setDisciplineFilter={filterControls.setDisciplineFilter}
            setPriorityFilter={filterControls.setPriorityFilter}
            setProjectFilter={filterControls.setProjectFilter}
            setStatusFilter={filterControls.setStatusFilter}
            setSubsystemFilter={filterControls.setSubsystemFilter}
            statusFilter={filterControls.filters.statusFilter}
            subsystemFilter={filterControls.filters.subsystemFilter}
            subsystemFilterOptions={filterControls.subsystemFilterOptions}
            timelinePeriodLabel={data.timelinePeriodLabel}
            timelineZoom={state.timelineZoom}
            timelineZoomMin={state.timelineZoomMin}
            viewInterval={state.viewInterval}
          />
          <WorkspaceTopbarAddMenu
            actions={buildTopbarAddMenuActions(
              makeAddMenuAction("Add meeting", () => window.dispatchEvent(new Event("mission-control:open-meeting")), <IconCalendar />),
              makeAddMenuAction("Add milestone", () => window.dispatchEvent(new Event("mission-control:open-milestone")), <IconTasks />),
              buildSingleAddMenuAction({ label: "Add task", onSelect: openCreateTaskModal })[0],
            )}
            ariaLabel="Add calendar item"
            title="Add calendar item"
          />
        </WorkspaceTopbarControls>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Subsystem timeline</h2>
        </div>
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
        onHideMilestonePopup={data.clearHoveredMilestonePopup}
        onOpenMilestoneDetails={data.milestoneModal.openMilestoneDetailModalForMilestone}
        onShowMilestonePopup={data.showMilestoneUnderlayPopup}
        portalTarget={data.tooltipPortalTarget}
        underlays={data.timelineDayMilestoneUnderlays}
      />

      <TimelineTodayMarkerPortal
        portalTarget={data.timelineShellRef.current}
        showLabelAtTop={true}
        todayMarkerLabelTop={data.timelineTodayMarkerLabelTop}
        todayMarkerLineLeft={data.timelineTodayMarkerLineLeft}
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
        bootstrap={bootstrap}
        modal={data.milestoneModal}
        modalPortalTarget={data.modalPortalTarget}
        onCreateMilestoneReport={onCreateMilestoneReport}
        projectsById={data.projectsById}
      />

    </section>
  );
};
