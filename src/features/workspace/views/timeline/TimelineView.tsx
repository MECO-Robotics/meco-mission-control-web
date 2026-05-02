import React, { useCallback, useEffect, useMemo, useState } from "react";
import type {
  BootstrapPayload,
  EventPayload,
  TaskRecord,
} from "@/types";
import {
  type FilterSelection,
  filterSelectionMatchesTaskPeople,
  formatFilterSelectionLabel,
  useFilterChangeMotionClass,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { getMilestoneSubsystemOptions } from "@/features/workspace/shared/eventProjectUtils";
import {
  addDaysToDay,
  addMonthsToDay,
  formatTimelinePeriodLabel,
  localTodayDate,
  type TimelineViewInterval,
} from "@/features/workspace/shared/timelineDateUtils";
import {
  clampTimelineZoom,
  getTimelineDayTrackSize,
  getTimelineGridMinWidth,
  TIMELINE_ZOOM_STEP,
} from "@/features/workspace/shared/timelineZoom";
import {
  buildTimelineData,
  buildTimelineDayHeaderCells,
  buildTimelineMonthGroups,
  buildTimelineProjectRows,
  filterTimelineEventsByPersonSelection,
} from "./timelineViewModel";
import { TimelineGridBody } from "./TimelineGridBody";
import { TimelineMilestoneHoverLayer } from "./TimelineMilestoneHoverLayer";
import { TimelineMilestoneModal } from "./TimelineMilestoneModal";
import { TimelineMilestoneUnderlaysPortal } from "./TimelineMilestoneUnderlaysPortal";
import { TimelineTodayMarkerPortal } from "./TimelineTodayMarkerPortal";
import { TimelineRowHighlightsPortal } from "./TimelineRowHighlightsPortal";
import { TimelineToolbar } from "./TimelineToolbar";
import { resolveTimelineRowHighlightStyle } from "./timelineTaskColors";
import { useTimelineEventModal } from "./useTimelineEventModal";
import { useTimelineMilestoneOverlay } from "./useTimelineMilestoneOverlay";

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

type TimelineGridMotion = "left" | "right" | "neutral";
const PROJECT_COLUMN_WIDTH = 112;
const SUBSYSTEM_COLUMN_WIDTH = 128;
const STATUS_ICON_COLUMN_WIDTH = 36;

export const TimelineView: React.FC<TimelineViewProps> = ({
  bootstrap,
  isAllProjectsView,
  activePersonFilter,
  setActivePersonFilter,
  openTaskDetailModal,
  openCreateTaskModal,
  onDeleteTimelineEvent,
  onSaveTimelineEvent,
  triggerCreateMilestoneToken,
}) => {
  const [viewInterval, setViewInterval] = useState<TimelineViewInterval>("month");
  const [viewAnchorDate, setViewAnchorDate] = useState(localTodayDate);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timelineGridMotion, setTimelineGridMotion] = useState<{
    direction: TimelineGridMotion | null;
    token: number;
  }>({
    direction: null,
    token: 0,
  });
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [collapsedSubsystems, setCollapsedSubsystems] = useState<Record<string, boolean>>({});
  const [isProjectColumnVisible, setIsProjectColumnVisible] = useState(true);
  const [isSubsystemColumnVisible, setIsSubsystemColumnVisible] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [hoveredSubsystemId, setHoveredSubsystemId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
  );
  const scopedProjectIds = useMemo(
    () => bootstrap.projects.map((project) => project.id),
    [bootstrap.projects],
  );
  const subsystemsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
      ) as Record<string, BootstrapPayload["subsystems"][number]>,
    [bootstrap.subsystems],
  );
  const disciplinesById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.disciplines.map((discipline) => [discipline.id, discipline]),
      ) as Record<string, BootstrapPayload["disciplines"][number]>,
    [bootstrap.disciplines],
  );

  const scopedTasks = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task))
        : bootstrap.tasks,
    [activePersonFilter, bootstrap.tasks],
  );
  const scopedEvents = useMemo(
    () =>
      filterTimelineEventsByPersonSelection({
        activePersonFilter,
        events: bootstrap.events,
        tasks: bootstrap.tasks,
      }),
    [activePersonFilter, bootstrap.events, bootstrap.tasks],
  );
  const tasksById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.tasks.map((task) => [task.id, task]),
      ) as Record<string, BootstrapPayload["tasks"][number]>,
    [bootstrap.tasks],
  );
  const timelineFilterMotionClass = useFilterChangeMotionClass([activePersonFilter]);
  const scopedSubsystems = bootstrap.subsystems;

  useEffect(() => {
    const validProjectIds = new Set(scopedSubsystems.map((subsystem) => subsystem.projectId));
    setCollapsedProjects((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([projectId]) => validProjectIds.has(projectId)),
      ),
    );
  }, [scopedSubsystems]);

  const timeline = useMemo(
    () =>
      buildTimelineData({
        events: scopedEvents,
        projectsById,
        scopedSubsystems,
        scopedTasks,
        viewAnchorDate,
        viewInterval,
      }),
    [projectsById, scopedEvents, scopedSubsystems, scopedTasks, viewAnchorDate, viewInterval],
  );

  const timelinePeriodLabel = useMemo(
    () => formatTimelinePeriodLabel(viewInterval, timeline.days),
    [timeline.days, viewInterval],
  );
  const monthGroups = useMemo(() => buildTimelineMonthGroups(timeline.days), [timeline.days]);
  const dayEventsByDate = timeline.dayEvents;
  const {
    activeDayEvents,
    activeEventDay,
    closeEventModal,
    eventDraft,
    eventEndDate,
    eventEndTime,
    eventError,
    eventModalMode,
    eventStartDate,
    eventStartTime,
    handleEventDelete,
    handleEventSubmit,
    isDeletingEvent,
    isSavingEvent,
    openEventModalForDay,
    setEventDraft,
    setEventEndDate,
    setEventEndTime,
    setEventStartDate,
    setEventStartTime,
    switchMilestoneCreateToTask,
  } = useTimelineEventModal({
    dayEventsByDate,
    openCreateTaskModal,
    onDeleteTimelineEvent,
    onSaveTimelineEvent,
    scopedProjectIds,
    subsystemsById,
    triggerCreateMilestoneToken,
  });
  const selectableSubsystems = useMemo(
    () => getMilestoneSubsystemOptions(bootstrap.subsystems, eventDraft.projectIds),
    [bootstrap.subsystems, eventDraft.projectIds],
  );
  const timelineDayHeaderCells = useMemo(
    () => buildTimelineDayHeaderCells(timeline.days, dayEventsByDate),
    [dayEventsByDate, timeline.days],
  );
  const subsystemRows = timeline.subsystemRows;
  const projectRows = useMemo(() => buildTimelineProjectRows(subsystemRows), [subsystemRows]);

  const hasProjectColumn = isAllProjectsView;
  const showProjectCol = hasProjectColumn && isProjectColumnVisible;
  const showSubsystemCol = isSubsystemColumnVisible;
  const projectColumnWidth = hasProjectColumn && showProjectCol ? PROJECT_COLUMN_WIDTH : 0;
  const subsystemColumnWidth = showSubsystemCol ? SUBSYSTEM_COLUMN_WIDTH : 0;
  const subsystemColumnIndex = hasProjectColumn ? 2 : 1;
  const firstDayGridColumn = hasProjectColumn ? 3 : 2;
  const statusIconColumnIndex = firstDayGridColumn + timeline.days.length;
  const fixedTimelineColumnWidth = projectColumnWidth + subsystemColumnWidth + STATUS_ICON_COLUMN_WIDTH;
  const statusIconStickyRight = 0;
  const subsystemStickyLeft = hasProjectColumn ? projectColumnWidth : 0;
  const dayTrackSize = useMemo(
    () => getTimelineDayTrackSize(viewInterval, timelineZoom, fixedTimelineColumnWidth),
    [fixedTimelineColumnWidth, timelineZoom, viewInterval],
  );

  const timelineGridTemplate = useMemo(() => {
    return `${hasProjectColumn ? `${projectColumnWidth}px ` : ""}${subsystemColumnWidth}px repeat(${timeline.days.length}, ${dayTrackSize}) ${STATUS_ICON_COLUMN_WIDTH}px`;
  }, [
    hasProjectColumn,
    dayTrackSize,
    projectColumnWidth,
    subsystemColumnWidth,
    timeline.days.length,
  ]);

  const gridMinWidth = useMemo(() => {
    return getTimelineGridMinWidth({
      dayCount: timeline.days.length,
      hasProjectColumn,
      projectColumnWidth,
      subsystemColumnWidth,
      taskColumnWidth: STATUS_ICON_COLUMN_WIDTH,
      viewInterval,
      zoom: timelineZoom,
    });
  }, [
    hasProjectColumn,
    projectColumnWidth,
    subsystemColumnWidth,
    timeline.days.length,
    timelineZoom,
    viewInterval,
  ]);

  const toggleProject = useCallback((id: string) => {
    setCollapsedProjects((previous) => {
      const nextCollapsed = !(previous[id] ?? false);
      return { ...previous, [id]: nextCollapsed };
    });
  }, []);

  const toggleSubsystem = useCallback((id: string) => {
    setCollapsedSubsystems((previous) => {
      const nextCollapsed = !(previous[id] ?? false);
      return { ...previous, [id]: nextCollapsed };
    });
  }, []);

  const toggleProjectColumn = useCallback(() => {
    setIsProjectColumnVisible((previous) => !previous);
  }, []);

  const toggleSubsystemColumn = useCallback(() => {
    setIsSubsystemColumnVisible((previous) => !previous);
  }, []);

  const selectSubsystemRow = useCallback((id: string) => {
    setSelectedTaskId(null);
    setSelectedSubsystemId((previous) => (previous === id ? null : id));
  }, []);

  const hoverSubsystemRow = useCallback((id: string) => {
    setHoveredTaskId(null);
    setHoveredSubsystemId(id);
  }, []);

  const clearHoveredSubsystemRow = useCallback(() => {
    setHoveredSubsystemId(null);
  }, []);

  const hoverTaskRow = useCallback((id: string) => {
    setHoveredSubsystemId(null);
    setHoveredTaskId(id);
  }, []);

  const clearHoveredTaskRow = useCallback(() => {
    setHoveredTaskId(null);
  }, []);

  const selectTaskRow = useCallback((task: TaskRecord) => {
    setSelectedSubsystemId(null);
    setSelectedTaskId((previous) => (previous === task.id ? null : task.id));
  }, []);

  const openTaskDetailAndSelectTask = useCallback(
    (task: TaskRecord) => {
      setSelectedSubsystemId(null);
      setSelectedTaskId(task.id);
      openTaskDetailModal(task);
    },
    [openTaskDetailModal],
  );

  const adjustTimelineZoom = useCallback((direction: 1 | -1) => {
    setTimelineZoom((previous) => clampTimelineZoom(previous + direction * TIMELINE_ZOOM_STEP));
  }, []);

  const handleTimelineZoomWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.deltaY === 0) {
      return;
    }

    event.preventDefault();
    setTimelineZoom((previous) =>
      clampTimelineZoom(previous + (event.deltaY > 0 ? -TIMELINE_ZOOM_STEP : TIMELINE_ZOOM_STEP)),
    );
  }, []);

  const playTimelineGridAnimation = useCallback((direction: TimelineGridMotion) => {
    setTimelineGridMotion((current) => ({
      direction,
      token: current.token + 1,
    }));
  }, []);

  useEffect(() => {
    if (!timelineGridMotion.direction) {
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
  }, [timelineGridMotion.direction]);

  useEffect(() => {
    if (selectedTaskId && !bootstrap.tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [bootstrap.tasks, selectedTaskId]);

  useEffect(() => {
    if (
      selectedSubsystemId &&
      !bootstrap.subsystems.some((subsystem) => subsystem.id === selectedSubsystemId)
    ) {
      setSelectedSubsystemId(null);
    }
  }, [bootstrap.subsystems, selectedSubsystemId]);

  useEffect(() => {
    if (
      hoveredSubsystemId &&
      !bootstrap.subsystems.some((subsystem) => subsystem.id === hoveredSubsystemId)
    ) {
      setHoveredSubsystemId(null);
    }
  }, [bootstrap.subsystems, hoveredSubsystemId]);

  useEffect(() => {
    if (hoveredTaskId && !bootstrap.tasks.some((task) => task.id === hoveredTaskId)) {
      setHoveredTaskId(null);
    }
  }, [bootstrap.tasks, hoveredTaskId]);

  const handleTimelineIntervalChange = useCallback(
    (nextInterval: TimelineViewInterval) => {
      if (nextInterval === viewInterval) {
        return;
      }

      playTimelineGridAnimation("neutral");
      setViewInterval(nextInterval);
    },
    [playTimelineGridAnimation, viewInterval],
  );

  const shiftTimelinePeriod = useCallback(
    (direction: -1 | 1) => {
      if (viewInterval === "all") {
        return;
      }

      playTimelineGridAnimation(direction > 0 ? "left" : "right");
      setViewAnchorDate((current) => {
        if (viewInterval === "week") {
          return addDaysToDay(current, direction * 7);
        }

        return addMonthsToDay(current, direction);
      });
    },
    [playTimelineGridAnimation, viewInterval],
  );

  const handleTimelineHeaderDayClick = useCallback(
    (day: string) => {
      if (viewInterval !== "week") {
        playTimelineGridAnimation("neutral");
        setViewInterval("week");
        setViewAnchorDate(day);
        return;
      }

      openEventModalForDay(day);
    },
    [openEventModalForDay, playTimelineGridAnimation, viewInterval],
  );

  const {
    clearHoveredMilestonePopup,
    handleTimelineDayMouseEnter,
    queueTimelineLayerUpdate,
    resolveMilestonePopupGeometry,
    setHoveredMilestonePopupLayerRef,
    timelineDayCellRefs,
    timelineDayMilestoneUnderlays,
    timelineGridRef,
    timelineShellRef,
    timelineTodayMarkerLeft,
    isTimelineShellScrolling,
    tooltipPortalTarget,
  } = useTimelineMilestoneOverlay({
    days: timeline.days,
    dayEventsByDate,
    events: scopedEvents,
  });

  const resolveRowHighlightGeometry = useCallback(
    (
      anchorKey: string,
    ): { height: number; left: number; top: number; width: number } | null => {
      const shell = timelineShellRef.current;
      if (!shell) {
        return null;
      }

      const anchor = shell.querySelector<HTMLElement>(
        `[data-timeline-row-anchor="${anchorKey}"]`,
      );
      if (!anchor) {
        return null;
      }

      const shellRect = shell.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();

      return {
        height: anchorRect.height,
        left: anchorRect.left - shellRect.left + shell.scrollLeft,
        top: anchorRect.top - shellRect.top + shell.scrollTop,
        width: anchorRect.width,
      };
    },
    [timelineShellRef],
  );

  const resolveTaskRowHighlightStyle = useCallback(
    (anchorKey: string) =>
      resolveTimelineRowHighlightStyle(anchorKey, tasksById, subsystemsById, disciplinesById),
    [disciplinesById, subsystemsById, tasksById],
  );

  useEffect(() => {
    queueTimelineLayerUpdate();
  }, [
    queueTimelineLayerUpdate,
    timelineGridTemplate,
    timeline.subsystemRows,
    projectRows,
    collapsedProjects,
    collapsedSubsystems,
    showProjectCol,
    showSubsystemCol,
    isProjectColumnVisible,
    isSubsystemColumnVisible,
  ]);

  useEffect(() => {
    window.addEventListener("resize", queueTimelineLayerUpdate);
    return () => {
      window.removeEventListener("resize", queueTimelineLayerUpdate);
    };
  }, [queueTimelineLayerUpdate]);

  const activePersonFilterLabel =
    formatFilterSelectionLabel("All roster", bootstrap.members, activePersonFilter);
  const modalPortalTarget =
    typeof document !== "undefined"
      ? ((document.querySelector(".page-shell") as HTMLElement | null) ?? document.body)
      : null;

  return (
    <section className={`panel dense-panel timeline-layout ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Subsystem timeline</h2>
          <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
            {activePersonFilter.length === 0
              ? "Showing all roster-linked tasks."
              : `Filtered to ${activePersonFilterLabel}.`}
          </p>
        </div>
        <TimelineToolbar
          activePersonFilter={activePersonFilter}
          bootstrapMembers={bootstrap.members}
          onAdjustZoom={adjustTimelineZoom}
          onChangePersonFilter={setActivePersonFilter}
          onCreateTask={openCreateTaskModal}
          onIntervalChange={handleTimelineIntervalChange}
          onShiftPeriod={shiftTimelinePeriod}
          timelinePeriodLabel={timelinePeriodLabel}
          timelineZoom={timelineZoom}
          viewInterval={viewInterval}
        />
      </div>

      <TimelineGridBody
        bootstrap={bootstrap}
        clearHoveredMilestonePopup={clearHoveredMilestonePopup}
        collapsedProjects={collapsedProjects}
        collapsedSubsystems={collapsedSubsystems}
        disciplinesById={disciplinesById}
        firstDayGridColumn={firstDayGridColumn}
        gridMinWidth={gridMinWidth}
        handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
        handleTimelineZoomWheel={handleTimelineZoomWheel}
        hasProjectColumn={hasProjectColumn}
        isWeekView={viewInterval === "week"}
        monthGroups={monthGroups}
        handleTimelineHeaderDayClick={handleTimelineHeaderDayClick}
        projectColumnWidth={projectColumnWidth}
        projectRows={projectRows}
        hoveredSubsystemId={hoveredSubsystemId}
        hoveredTaskId={hoveredTaskId}
        selectedSubsystemId={selectedSubsystemId}
        selectedTaskId={selectedTaskId}
        statusIconColumnIndex={statusIconColumnIndex}
        statusIconColumnWidth={STATUS_ICON_COLUMN_WIDTH}
        statusIconStickyRight={statusIconStickyRight}
        showProjectCol={showProjectCol}
        showSubsystemCol={showSubsystemCol}
        isScrolling={isTimelineShellScrolling}
        subsystemColumnIndex={subsystemColumnIndex}
        subsystemColumnWidth={subsystemColumnWidth}
        subsystemRows={subsystemRows}
        subsystemStickyLeft={subsystemStickyLeft}
        timelineDayCellRefs={timelineDayCellRefs}
        timelineDayHeaderCells={timelineDayHeaderCells}
        timelineFilterMotionClass={timelineFilterMotionClass}
        timelineGridMotion={timelineGridMotion}
        timelineGridRef={timelineGridRef}
        timelineGridTemplate={timelineGridTemplate}
        timelineZoom={timelineZoom}
        timelineShellRef={timelineShellRef}
        openTaskDetailModal={openTaskDetailAndSelectTask}
        clearHoveredSubsystemRow={clearHoveredSubsystemRow}
        clearHoveredTaskRow={clearHoveredTaskRow}
        hoverTaskRow={hoverTaskRow}
        hoverSubsystemRow={hoverSubsystemRow}
        selectSubsystemRow={selectSubsystemRow}
        selectTaskRow={selectTaskRow}
        toggleProject={toggleProject}
        toggleProjectColumn={toggleProjectColumn}
        toggleSubsystem={toggleSubsystem}
        toggleSubsystemColumn={toggleSubsystemColumn}
      />

      <TimelineMilestoneUnderlaysPortal
        portalTarget={tooltipPortalTarget}
        underlays={timelineDayMilestoneUnderlays}
      />

      <TimelineTodayMarkerPortal
        portalTarget={timelineShellRef.current}
        todayMarkerLeft={timelineTodayMarkerLeft}
      />

      <TimelineRowHighlightsPortal
        hoveredSubsystemId={hoveredSubsystemId}
        hoveredTaskId={hoveredTaskId}
        portalTarget={tooltipPortalTarget}
        resolveRowHighlightGeometry={resolveRowHighlightGeometry}
        resolveTaskRowHighlightStyle={resolveTaskRowHighlightStyle}
        selectedSubsystemId={selectedSubsystemId}
        selectedTaskId={selectedTaskId}
      />

      <TimelineMilestoneHoverLayer
        controllerRef={setHoveredMilestonePopupLayerRef}
        portalTarget={tooltipPortalTarget}
        resolveGeometry={resolveMilestonePopupGeometry}
      />

      <TimelineMilestoneModal
        activeDayEvents={activeDayEvents}
        activeEventDay={activeEventDay}
        bootstrap={bootstrap}
        eventDraft={eventDraft}
        eventEndDate={eventEndDate}
        eventEndTime={eventEndTime}
        eventError={eventError}
        eventStartDate={eventStartDate}
        eventStartTime={eventStartTime}
        isDeletingEvent={isDeletingEvent}
        isSavingEvent={isSavingEvent}
        mode={eventModalMode}
        onClose={closeEventModal}
        onDelete={handleEventDelete}
        onSubmit={handleEventSubmit}
        onSwitchToTask={switchMilestoneCreateToTask}
        portalTarget={modalPortalTarget}
        projectsById={projectsById}
        selectableSubsystems={selectableSubsystems}
        setEventDraft={setEventDraft}
        setEventEndDate={setEventEndDate}
        setEventEndTime={setEventEndTime}
        setEventStartDate={setEventStartDate}
        setEventStartTime={setEventStartTime}
        subsystemsById={subsystemsById}
      />
    </section>
  );
};
