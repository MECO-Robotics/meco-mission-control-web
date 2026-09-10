import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { WorkspaceTopbarControls, buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { getTimelineMinimumZoomForWidth } from "@/features/workspace/shared/timeline/timelineZoom";
import { midpointOfTimelineDays } from "@/features/workspace/shared/timeline/timelineDateUtils";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { buildTimelineGridLayout } from "./model/timelineGridLayout";
import { TimelineGridBody } from "./TimelineGridBody";
import { TimelineMilestoneHoverLayer } from "./TimelineMilestoneHoverLayer";
import { MilestonesMilestoneModal } from "../milestones/MilestonesEventModal";
import { TimelineMilestoneUnderlaysPortal } from "./portals/TimelineMilestoneUnderlaysPortal";
import { TimelineRowHighlightsPortal } from "./portals/TimelineRowHighlightsPortal";
import { TimelineTodayMarkerPortal } from "./portals/TimelineTodayMarkerPortal";
import { TimelineToolbar } from "./TimelineToolbar";
import { useTimelineViewActions } from "./hooks/useTimelineViewActions";
import { useTimelineViewData } from "./hooks/useTimelineViewData";
import { useTimelineViewFilters } from "./hooks/useTimelineViewFilters";
import { useTimelineViewState } from "./hooks/useTimelineViewState";

interface TimelineViewProps {
  onCreateMilestoneReport?: (milestoneId: string, onReturn?: () => void) => void;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  activePersonFilter: FilterSelection;
  setActivePersonFilter: (value: FilterSelection) => void;
  membersById: Record<string, BootstrapPayload["members"][number]>;
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
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  onCreateMilestoneReport,
  bootstrap,
  isAllProjectsView,
  activePersonFilter,
  setActivePersonFilter,
  membersById: _membersById,
  onTaskEditCanceled = () => {},
  onTaskEditSaved = () => {},
  openTaskDetailModal,
  openCreateTaskModal,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  triggerCreateMilestoneToken,
}) => {
  void _membersById;

  const state = useTimelineViewState();
  const {
    handleTimelineIntervalChange: applyTimelineIntervalChange,
    setTimelineZoomMin,
    viewAnchorDate,
  } = state;
  const [timelineShellWidth, setTimelineShellWidth] = useState(0);
  const [searchFilter, setSearchFilter] = useState("");
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
  const handleTimelineIntervalChange = useCallback(
    (nextInterval: TimelineViewInterval) => {
      const nextAnchorDate = midpointOfTimelineDays(data.timeline.days) ?? viewAnchorDate;
      applyTimelineIntervalChange(nextInterval, nextAnchorDate);
    },
    [applyTimelineIntervalChange, data.timeline.days, viewAnchorDate],
  );
  const { setTimelineGridMotion } = state;

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

  useEffect(() => {
    const shell = data.timelineShellRef.current;
    if (!shell) {
      return undefined;
    }

    const updateZoomFloor = () => {
      const shellWidth = shell.getBoundingClientRect().width;
      setTimelineShellWidth((previous) => (previous === shellWidth ? previous : shellWidth));
      setTimelineZoomMin(
        getTimelineMinimumZoomForWidth({
          dayCount: data.timeline.days.length,
          fixedColumnWidth: layout.fixedTimelineColumnWidth,
          shellWidth,
          viewInterval: state.viewInterval,
        }),
      );
    };

    updateZoomFloor();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(updateZoomFloor);
    resizeObserver.observe(shell);

    return () => {
      resizeObserver.disconnect();
    };
  }, [
    data.timeline.days.length,
    data.timelineShellRef,
    layout.fixedTimelineColumnWidth,
    setTimelineZoomMin,
    state.viewInterval,
  ]);

  return (
    <section className={`panel dense-panel timeline-layout ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls className="timeline-toolbar timeline-topbar-controls">
          <TimelineToolbar
            activeFilterCount={filterControls.activeFilterCount}
            activePersonFilter={activePersonFilter}
            bootstrap={bootstrap}
            disciplineFilter={filterControls.filters.disciplineFilter}
            disciplineFilterOptions={filterControls.disciplineFilterOptions}
            isAllProjectsView={isAllProjectsView}
            onAdjustZoom={state.adjustTimelineZoom}
            onChangePersonFilter={setActivePersonFilter}
            onSearchChange={setSearchFilter}
            onIntervalChange={handleTimelineIntervalChange}
            onShiftPeriod={state.shiftTimelinePeriod}
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
            actions={buildSingleAddMenuAction({
              label: "Add task",
              onSelect: openCreateTaskModal,
            })}
            ariaLabel="Add to timeline"
            title="Add to timeline"
            tutorialTarget="timeline-create-task-button"
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

      <MilestonesMilestoneModal
        activeMilestone={bootstrap.milestones.find((milestone) => milestone.id === (data.milestoneModal.activeMilestoneDetail?.id ?? data.milestoneModal.activeMilestoneId)) ?? null}
        projectsById={Object.fromEntries(bootstrap.projects.map((project) => [project.id, project]))}
        onEditMilestone={data.milestoneModal.openEditMilestoneModalForMilestone}
        onRecordResult={onCreateMilestoneReport ? (milestone) => { data.milestoneModal.closeMilestoneDetailModal(); onCreateMilestoneReport(milestone.id, () => data.milestoneModal.openMilestoneDetailModalForMilestone(milestone)); } : undefined}
        bootstrap={bootstrap}
        milestoneDraft={data.milestoneModal.milestoneDraft}
        milestoneEndDate={data.milestoneModal.milestoneEndDate}
        milestoneEndTime={data.milestoneModal.milestoneEndTime}
        milestoneError={data.milestoneModal.milestoneError}
        milestoneStartDate={data.milestoneModal.milestoneStartDate}
        milestoneStartTime={data.milestoneModal.milestoneStartTime}
        isDeletingMilestone={data.milestoneModal.isDeletingMilestone}
        isSavingMilestone={data.milestoneModal.isSavingMilestone}
        milestoneModalMode={data.milestoneModal.activeMilestoneDetail ? "detail" : data.milestoneModal.milestoneModalMode}
        onClose={() => { data.milestoneModal.closeMilestoneModal(); data.milestoneModal.closeMilestoneDetailModal(); }}
        onCancelEdit={data.milestoneModal.cancelMilestoneEdit}
        onDelete={data.milestoneModal.handleMilestoneDelete}
        onSubmit={data.milestoneModal.handleMilestoneSubmit}
        onSwitchToTask={data.milestoneModal.milestoneModalMode === "create" ? data.milestoneModal.switchMilestoneCreateToTask : undefined}
        modalPortalTarget={data.modalPortalTarget}
        setMilestoneDraft={data.milestoneModal.setMilestoneDraft}
        setMilestoneEndDate={data.milestoneModal.setMilestoneEndDate}
        setMilestoneEndTime={data.milestoneModal.setMilestoneEndTime}
        setMilestoneStartDate={data.milestoneModal.setMilestoneStartDate}
        setMilestoneStartTime={data.milestoneModal.setMilestoneStartTime}
      />

    </section>
  );
};
