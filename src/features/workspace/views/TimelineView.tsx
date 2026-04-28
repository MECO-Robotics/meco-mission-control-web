import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPerson,
  IconTasks,
} from "@/components/shared";
import type {
  BootstrapPayload,
  EventPayload,
  EventRecord,
  EventType,
  TaskRecord,
} from "@/types";
import {
  type FilterSelection,
  CompactFilterMenu,
  FilterDropdown,
  filterSelectionMatchesTaskPeople,
  formatFilterSelectionLabel,
  useFilterChangeMotionClass,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import {
  getEventProjectIds,
  getMilestoneSubsystemOptions,
  reconcileMilestoneSubsystemIds,
} from "@/features/workspace/shared/eventProjectUtils";
import {
  DEFAULT_EVENT_TYPE,
  EVENT_TYPE_OPTIONS,
  getEventTypeStyle,
} from "@/features/workspace/shared/eventStyles";
import {
  addDaysToDay,
  addMonthsToDay,
  buildDateTime,
  compareDateTimes,
  datePortion,
  formatTimelinePeriodLabel,
  localTodayDate,
  type TimelineViewInterval,
  timePortion,
} from "@/features/workspace/shared/timelineDateUtils";
import {
  clampTimelineZoom,
  formatTimelineZoomLabel,
  getTimelineDayTrackSize,
  getTimelineGridMinWidth,
  TIMELINE_ZOOM_MAX,
  TIMELINE_ZOOM_MIN,
  TIMELINE_ZOOM_STEP,
} from "@/features/workspace/shared/timelineZoom";
import {
  emptyTimelineEventDraft,
  isSameHoveredMilestonePopup,
  timelineEventDraftFromRecord,
  type HoveredMilestonePopup,
  type TimelineEventDraft,
} from "@/features/workspace/shared/timelineEventHelpers";
import {
  buildTimelineData,
  buildTimelineDayHeaderCells,
  buildTimelineDayMilestoneUnderlays,
  buildTimelineMonthGroups,
  buildTimelineProjectRows,
  type MilestoneGeometry,
  type TimelineDayCellLayouts,
} from "@/features/workspace/views/timelineViewModel";
import { TimelineMilestoneHoverLayer } from "@/features/workspace/views/TimelineMilestoneHoverLayer";
import { TimelineMilestoneUnderlaysPortal } from "@/features/workspace/views/TimelineMilestoneUnderlaysPortal";
import { TimelineGridBody } from "@/features/workspace/views/TimelineGridBody";

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
const TASK_LABEL_COLUMN_WIDTH = 148;
const HIDDEN_COLUMN_PEEK_WIDTH = 34;

export const TimelineView: React.FC<TimelineViewProps> = ({
  bootstrap,
  isAllProjectsView,
  activePersonFilter,
  setActivePersonFilter,
  membersById,
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
  const [eventModalMode, setEventModalMode] = useState<"create" | "edit" | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventDay, setActiveEventDay] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState<TimelineEventDraft>(
    emptyTimelineEventDraft(DEFAULT_EVENT_TYPE),
  );
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("18:00");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventError, setEventError] = useState<string | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [isProjectColumnVisible, setIsProjectColumnVisible] = useState(true);
  const [isSubsystemColumnVisible, setIsSubsystemColumnVisible] = useState(true);
  const [isTaskColumnVisible, setIsTaskColumnVisible] = useState(true);
  const [timelineDayCellLayouts, setTimelineDayCellLayouts] = useState<TimelineDayCellLayouts>({});
  const [timelineGridHeight, setTimelineGridHeight] = useState(0);
  const [timelineHeaderHeight, setTimelineHeaderHeight] = useState(0);
  const timelineShellRef = useRef<HTMLDivElement | null>(null);
  const timelineGridRef = useRef<HTMLDivElement | null>(null);
  const timelineDayCellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timelineLayerGeometryFrameRef = useRef<number | null>(null);
  const hoveredMilestonePopupRef = useRef<HoveredMilestonePopup | null>(null);
  const setHoveredMilestonePopupLayerRef = useRef<
    (popup: HoveredMilestonePopup | null) => void
  >(() => undefined);

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
  const selectableSubsystems = useMemo(
    () => getMilestoneSubsystemOptions(bootstrap.subsystems, eventDraft.projectIds),
    [bootstrap.subsystems, eventDraft.projectIds],
  );

  const hasProjectColumn = isAllProjectsView;
  const showProjectCol = hasProjectColumn && isProjectColumnVisible;
  const showSubsystemCol = isSubsystemColumnVisible;
  const showTaskCol = isTaskColumnVisible;
  const projectColumnWidth = hasProjectColumn
    ? showProjectCol
      ? PROJECT_COLUMN_WIDTH
      : HIDDEN_COLUMN_PEEK_WIDTH
    : 0;
  const subsystemColumnWidth = showSubsystemCol
    ? SUBSYSTEM_COLUMN_WIDTH
    : HIDDEN_COLUMN_PEEK_WIDTH;
  const taskColumnWidth = showTaskCol ? TASK_LABEL_COLUMN_WIDTH : HIDDEN_COLUMN_PEEK_WIDTH;
  const subsystemColumnIndex = hasProjectColumn ? 2 : 1;
  const taskLabelColumnIndex = hasProjectColumn ? 3 : 2;
  const firstDayGridColumn = hasProjectColumn ? 4 : 3;
  const subsystemStickyLeft = hasProjectColumn ? projectColumnWidth : 0;
  const taskLabelStickyLeft = subsystemStickyLeft + subsystemColumnWidth;
  const scopedTasks = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task))
        : bootstrap.tasks,
    [activePersonFilter, bootstrap.tasks],
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
        events: bootstrap.events,
        projectsById,
        scopedSubsystems,
        scopedTasks,
        viewAnchorDate,
        viewInterval,
      }),
    [bootstrap.events, projectsById, scopedSubsystems, scopedTasks, viewAnchorDate, viewInterval],
  );

  const timelinePeriodLabel = useMemo(
    () => formatTimelinePeriodLabel(viewInterval, timeline.days),
    [timeline.days, viewInterval],
  );

  const timelineGridTemplate = useMemo(() => {
    const dayWidth = getTimelineDayTrackSize(viewInterval, timelineZoom);
    return `${hasProjectColumn ? `${projectColumnWidth}px ` : ""}${subsystemColumnWidth}px ${taskColumnWidth}px repeat(${timeline.days.length}, ${dayWidth})`;
  }, [
    hasProjectColumn,
    projectColumnWidth,
    subsystemColumnWidth,
    taskColumnWidth,
    timeline.days.length,
    timelineZoom,
    viewInterval,
  ]);

  const gridMinWidth = useMemo(() => {
    return getTimelineGridMinWidth({
      dayCount: timeline.days.length,
      hasProjectColumn,
      projectColumnWidth,
      subsystemColumnWidth,
      taskColumnWidth,
      viewInterval,
      zoom: timelineZoom,
    });
  }, [
    hasProjectColumn,
    projectColumnWidth,
    subsystemColumnWidth,
    taskColumnWidth,
    timeline.days.length,
    timelineZoom,
    viewInterval,
  ]);

  const monthGroups = useMemo(() => buildTimelineMonthGroups(timeline.days), [timeline.days]);
  const dayEventsByDate = timeline.dayEvents;
  const timelineDayHeaderCells = useMemo(
    () => buildTimelineDayHeaderCells(timeline.days, dayEventsByDate),
    [dayEventsByDate, timeline.days],
  );
  const subsystemRows = timeline.subsystemRows;
  const projectRows = useMemo(() => buildTimelineProjectRows(subsystemRows), [subsystemRows]);

  const toggleProject = useCallback(
    (id: string) => {
      setCollapsedProjects((previous) => {
        const nextCollapsed = !(previous[id] ?? false);
        return { ...previous, [id]: nextCollapsed };
      });
    },
    [],
  );

  const toggleSubsystem = useCallback(
    (id: string) => {
      setCollapsedSubsystems((previous) => {
        const nextCollapsed = !(previous[id] ?? false);
        return { ...previous, [id]: nextCollapsed };
      });
    },
    [],
  );

  const toggleProjectColumn = useCallback(() => {
    setIsProjectColumnVisible((previous) => {
      return !previous;
    });
  }, []);

  const toggleSubsystemColumn = useCallback(() => {
    setIsSubsystemColumnVisible((previous) => {
      return !previous;
    });
  }, []);

  const toggleTaskColumn = useCallback(() => {
    setIsTaskColumnVisible((previous) => {
      return !previous;
    });
  }, []);

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

  const handleTimelineIntervalChange = useCallback(
    (candidate: React.ChangeEvent<HTMLSelectElement>) => {
      const nextInterval = candidate.target.value as TimelineViewInterval;
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

  const closeEventModal = () => {
    setEventModalMode(null);
    setActiveEventId(null);
    setActiveEventDay(null);
    setEventError(null);
    setIsSavingEvent(false);
    setIsDeletingEvent(false);
  };

  const openCreateEventModalForDay = useCallback((day: string) => {
    setEventModalMode("create");
    setActiveEventId(null);
    setActiveEventDay(day);
    setEventDraft({
      ...emptyTimelineEventDraft(DEFAULT_EVENT_TYPE),
      projectIds: scopedProjectIds,
    });
    setEventStartDate(day);
    setEventStartTime("18:00");
    setEventEndDate("");
    setEventEndTime("");
    setEventError(null);
  }, [scopedProjectIds]);

  useEffect(() => {
    if (triggerCreateMilestoneToken <= 0) {
      return;
    }

    openCreateEventModalForDay(localTodayDate());
  }, [openCreateEventModalForDay, triggerCreateMilestoneToken]);

  const openEditEventModalForDay = (day: string, event: EventRecord) => {
    const eventProjectIds = getEventProjectIds(event, subsystemsById);
    setEventModalMode("edit");
    setActiveEventId(event.id);
    setActiveEventDay(day);
    setEventDraft({
      ...timelineEventDraftFromRecord(event),
      projectIds: eventProjectIds.length > 0 ? eventProjectIds : scopedProjectIds,
    });
    setEventStartDate(datePortion(event.startDateTime));
    setEventStartTime(timePortion(event.startDateTime));
    setEventEndDate(event.endDateTime ? datePortion(event.endDateTime) : "");
    setEventEndTime(event.endDateTime ? timePortion(event.endDateTime) : "");
    setEventError(null);
  };

  const switchMilestoneCreateToTask = () => {
    closeEventModal();
    openCreateTaskModal();
  };

  const openEventModalForDay = (day: string) => {
    const eventsOnDay = dayEventsByDate[day] ?? [];
    if (eventsOnDay.length === 0) {
      openCreateEventModalForDay(day);
      return;
    }

    openEditEventModalForDay(day, eventsOnDay[0]);
  };

  const queueTimelineLayerUpdate = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (timelineLayerGeometryFrameRef.current !== null) {
      return;
    }

    timelineLayerGeometryFrameRef.current = window.requestAnimationFrame(() => {
      timelineLayerGeometryFrameRef.current = null;
      const grid = timelineGridRef.current;
      const shell = timelineShellRef.current;
      if (!grid || !shell) {
        setTimelineDayCellLayouts((previous) =>
          Object.keys(previous).length ? {} : previous,
        );
        setTimelineGridHeight((previous) => (previous === 0 ? previous : 0));
        setTimelineHeaderHeight((previous) => (previous === 0 ? previous : 0));
        return;
      }

      const layouts: TimelineDayCellLayouts = {};
      timeline.days.forEach((day) => {
        const dayCell = timelineDayCellRefs.current[day];
        if (!dayCell) {
          return;
        }

        layouts[day] = {
          left: dayCell.offsetLeft,
          width: dayCell.offsetWidth,
        };
      });

      setTimelineDayCellLayouts((previous) => {
        const previousKeys = Object.keys(previous);
        const nextKeys = Object.keys(layouts);
        if (previousKeys.length !== nextKeys.length) {
          return layouts;
        }

        for (let index = 0; index < nextKeys.length; index += 1) {
          const key = nextKeys[index];
          if (!key) {
            continue;
          }
          const before = previous[key];
          const after = layouts[key];
          if (!before || !after || before.left !== after.left || before.width !== after.width) {
            return layouts;
          }
        }

        return previous;
      });
      const firstDay = timeline.days[0];
      const firstDayCell = firstDay ? timelineDayCellRefs.current[firstDay] : null;
      const shellRect = shell.getBoundingClientRect();
      const nextHeaderHeight = firstDayCell
        ? firstDayCell.getBoundingClientRect().bottom - shellRect.top + shell.scrollTop
        : 0;
      const timelineDayCells = Array.from(
        shell.querySelectorAll<HTMLElement>("[data-timeline-grid-cell='true']"),
      );
      const contentBottom = timelineDayCells.reduce((maxBottom, cell) => {
        const cellBottom = cell.getBoundingClientRect().bottom - shellRect.top + shell.scrollTop;
        return cellBottom > maxBottom ? cellBottom : maxBottom;
      }, 0);
      const nextGridHeight = Math.max(nextHeaderHeight, contentBottom, grid.clientHeight);
      setTimelineGridHeight((previous) => (previous === nextGridHeight ? previous : nextGridHeight));
      setTimelineHeaderHeight((previous) =>
        previous === nextHeaderHeight ? previous : nextHeaderHeight,
      );
    });
  }, [timeline.days]);

  const resolveMilestonePopupGeometry = useCallback((
    popupStartDay: string | null,
    popupEndDay: string | null,
  ): MilestoneGeometry | null => {
    if (!popupStartDay) {
      return null;
    }

    const isMultiDayEvent =
      Boolean(popupStartDay) && Boolean(popupEndDay) && popupStartDay !== popupEndDay;
    const fallbackLayout = (day: string | null) => {
      if (!day) {
        return null;
      }

      const measured = timelineDayCellLayouts[day];
      if (measured) {
        return measured;
      }

      const dayCell = timelineDayCellRefs.current[day];
      if (!dayCell) {
        return null;
      }

      return {
        left: dayCell.offsetLeft,
        width: dayCell.offsetWidth,
      };
    };

    const start = fallbackLayout(popupStartDay);
    const end = isMultiDayEvent ? fallbackLayout(popupEndDay) : start;

    if (!start || !end || !timelineShellRef.current) {
      return null;
    }

    const left = Math.min(start.left, end.left);
    const right = Math.max(start.left + start.width, end.left + end.width);
    const centerX = (left + right) / 2;
    const gridHeight = timelineGridHeight || timelineGridRef.current?.clientHeight || 0;
    const bodyTop = Math.max(0, timelineHeaderHeight);
    const bodyHeight = gridHeight - bodyTop;
    if (bodyHeight <= 0) {
      return null;
    }

    return {
      left,
      width: right - left,
      centerX,
      centerY: bodyTop + bodyHeight / 2,
      bodyTop,
      bodyHeight,
    };
  }, [timelineDayCellLayouts, timelineGridHeight, timelineHeaderHeight]);

  const updateHoveredMilestonePopup = useCallback((
    target: HTMLElement,
    lines: string[],
    background: string,
    color: string,
  ) => {
    if (typeof document === "undefined") {
      return;
    }

    const popupStartDay = target.dataset.popupStartDay;
    const popupEndDay = target.dataset.popupEndDay;
    const isMultiDayEvent =
      Boolean(popupStartDay) && Boolean(popupEndDay) && popupStartDay !== popupEndDay;
    const normalizedPopupStartDay = popupStartDay ?? null;
    const normalizedPopupEndDay = popupEndDay ?? null;

    if (!normalizedPopupStartDay) {
      return;
    }

    const nextPopup: HoveredMilestonePopup = {
      anchorStartDay: normalizedPopupStartDay,
      anchorEndDay: normalizedPopupEndDay,
      rotationDeg: isMultiDayEvent ? 45 : 90,
      lines,
      background,
      color,
    };
    if (isSameHoveredMilestonePopup(hoveredMilestonePopupRef.current, nextPopup)) {
      return;
    }

    hoveredMilestonePopupRef.current = nextPopup;
    setHoveredMilestonePopupLayerRef.current(nextPopup);
  }, []);

  const showDateCellMilestonePopup = useCallback((anchor: HTMLElement, day: string) => {
    const eventsOnDay = dayEventsByDate[day] ?? [];
    if (!eventsOnDay.length) {
      return;
    }

    const primaryEvent = eventsOnDay[0];
    if (!primaryEvent) {
      return;
    }

    const lines = eventsOnDay.length === 1
      ? [primaryEvent.title]
      : eventsOnDay.map((event) => event.title);
    const timelineStart = timeline.days[0] ?? null;
    const timelineEnd = timeline.days[timeline.days.length - 1] ?? null;
    const eventStartDay = datePortion(primaryEvent.startDateTime);
    const eventEndDay = primaryEvent.endDateTime
      ? datePortion(primaryEvent.endDateTime)
      : eventStartDay;
    const anchorStartDay =
      timelineStart && eventStartDay < timelineStart ? timelineStart : eventStartDay;
    const anchorEndDay =
      timelineEnd && eventEndDay > timelineEnd ? timelineEnd : eventEndDay;

    anchor.dataset.popupStartDay = anchorStartDay;
    anchor.dataset.popupEndDay = anchorEndDay;

    const dayStyle = getEventTypeStyle(primaryEvent.type);
    updateHoveredMilestonePopup(
      anchor,
      lines,
      dayStyle.columnBackground,
      dayStyle.chipText,
    );
  }, [dayEventsByDate, timeline.days, updateHoveredMilestonePopup]);

  const clearHoveredMilestonePopup = useCallback(() => {
    if (!hoveredMilestonePopupRef.current) {
      return;
    }
    hoveredMilestonePopupRef.current = null;
    setHoveredMilestonePopupLayerRef.current(null);
  }, []);

  const handleTimelineDayMouseEnter = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const day = event.currentTarget.dataset.timelineDay;
    if (!day) {
      return;
    }
    showDateCellMilestonePopup(event.currentTarget, day);
  }, [showDateCellMilestonePopup]);

  useEffect(() => {
    queueTimelineLayerUpdate();
    return () => {
      if (timelineLayerGeometryFrameRef.current !== null) {
        window.cancelAnimationFrame(timelineLayerGeometryFrameRef.current);
        timelineLayerGeometryFrameRef.current = null;
      }
    };
  }, [
    queueTimelineLayerUpdate,
    timelineGridTemplate,
    timeline.subsystemRows,
    projectRows,
    collapsedProjects,
    collapsedSubsystems,
    showProjectCol,
    showSubsystemCol,
    showTaskCol,
    isProjectColumnVisible,
    isSubsystemColumnVisible,
    isTaskColumnVisible,
  ]);

  useEffect(() => {
    window.addEventListener("resize", queueTimelineLayerUpdate);
    return () => {
      if (timelineLayerGeometryFrameRef.current !== null) {
        window.cancelAnimationFrame(timelineLayerGeometryFrameRef.current);
        timelineLayerGeometryFrameRef.current = null;
      }
      window.removeEventListener("resize", queueTimelineLayerUpdate);
    };
  }, [queueTimelineLayerUpdate]);

  const timelineDayMilestoneUnderlays = useMemo(
    () =>
      buildTimelineDayMilestoneUnderlays({
        events: bootstrap.events,
        resolveGeometry: resolveMilestonePopupGeometry,
        timelineDays: timeline.days,
      }),
    [bootstrap.events, resolveMilestonePopupGeometry, timeline.days],
  );

  const activePersonFilterLabel =
    formatFilterSelectionLabel("All roster", bootstrap.members, activePersonFilter);

  const activeDayEvents = activeEventDay ? dayEventsByDate[activeEventDay] ?? [] : [];
  const tooltipPortalTarget =
    typeof document === "undefined" ? null : timelineShellRef.current;
  const modalPortalTarget =
    typeof document !== "undefined"
      ? ((document.querySelector(".page-shell") as HTMLElement | null) ?? document.body)
      : null;

  const handleEventSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventModalMode) {
      return;
    }

    if (!eventStartDate) {
      setEventError("Start date is required.");
      return;
    }

    const normalizedTitle = eventDraft.title.trim();
    if (!normalizedTitle) {
      setEventError("Title is required.");
      return;
    }

    const startDateTime = buildDateTime(eventStartDate, eventStartTime || "12:00");
    const includeEndDate = eventEndDate.trim().length > 0 || eventEndTime.trim().length > 0;
    const endDateTime = includeEndDate
      ? buildDateTime(
          eventEndDate.trim().length > 0 ? eventEndDate : eventStartDate,
          eventEndTime.trim().length > 0 ? eventEndTime : eventStartTime,
        )
      : null;

    if (endDateTime && compareDateTimes(endDateTime, startDateTime) < 0) {
      setEventError("End date/time must be after the start date/time.");
      return;
    }

    setIsSavingEvent(true);
    setEventError(null);

    try {
      const payload: EventPayload = {
        title: normalizedTitle,
        type: eventDraft.type,
        startDateTime,
        endDateTime,
        isExternal: eventDraft.isExternal,
        description: eventDraft.description.trim(),
        projectIds: Array.from(new Set(eventDraft.projectIds)),
        relatedSubsystemIds: Array.from(new Set(eventDraft.relatedSubsystemIds)),
      };

      await onSaveTimelineEvent(eventModalMode, activeEventId, payload);
      closeEventModal();
    } catch (error) {
      setEventError(
        error instanceof Error
          ? error.message
          : "Could not save the milestone. Please try again.",
      );
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleEventDelete = async () => {
    if (eventModalMode !== "edit" || !activeEventId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this milestone event? Any tasks targeting this event will be unlinked.",
    );
    if (!shouldDelete) {
      return;
    }

    setIsDeletingEvent(true);
    setEventError(null);

    try {
      await onDeleteTimelineEvent(activeEventId);
      closeEventModal();
    } catch (error) {
      setEventError(
        error instanceof Error
          ? error.message
          : "Could not delete the milestone. Please try again.",
      );
      setIsDeletingEvent(false);
    }
  };

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
        <div className="panel-actions filter-toolbar timeline-toolbar">
          <div className="timeline-toolbar-filters">
            <CompactFilterMenu
              activeCount={activePersonFilter.length}
              ariaLabel="Timeline filters"
              buttonLabel="Filters"
              className="materials-filter-menu"
              items={[
                {
                  label: "Roster",
                  content: (
                    <FilterDropdown
                      allLabel="All roster"
                      ariaLabel="Filter person"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconPerson />}
                      onChange={setActivePersonFilter}
                      options={bootstrap.members}
                      value={activePersonFilter}
                    />
                  ),
                },
              ]}
            />
            <label className="toolbar-filter toolbar-filter-compact timeline-interval-filter">
              <span className="toolbar-filter-icon">
                <IconTasks />
              </span>
              <select
                aria-label="Timeline interval"
                data-tutorial-target="timeline-interval-select"
                onChange={handleTimelineIntervalChange}
                value={viewInterval}
              >
                <option value="all">All (recent window)</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </label>
            {viewInterval !== "all" ? (
              <div aria-label="Timeline period controls" className="timeline-period-controls">
                <button
                  aria-label={`Previous ${viewInterval}`}
                  className="icon-button timeline-period-button"
                  data-tutorial-target="timeline-period-prev-button"
                  onClick={() => shiftTimelinePeriod(-1)}
                  title={`Previous ${viewInterval}`}
                  type="button"
                >
                  <IconChevronLeft />
                </button>
                <span className="timeline-period-label">{timelinePeriodLabel}</span>
                <button
                  aria-label={`Next ${viewInterval}`}
                  className="icon-button timeline-period-button"
                  data-tutorial-target="timeline-period-next-button"
                  onClick={() => shiftTimelinePeriod(1)}
                  title={`Next ${viewInterval}`}
                  type="button"
                >
                  <IconChevronRight />
                </button>
              </div>
            ) : null}
            <div aria-label="Timeline zoom" className="timeline-zoom-controls" role="group">
              <button
                aria-label="Zoom out timeline"
                className="icon-button timeline-zoom-button"
                disabled={timelineZoom <= TIMELINE_ZOOM_MIN}
                onClick={() => adjustTimelineZoom(-1)}
                title="Zoom out timeline"
                type="button"
              >
                -
              </button>
              <span className="timeline-zoom-label">{formatTimelineZoomLabel(timelineZoom)}</span>
              <button
                aria-label="Zoom in timeline"
                className="icon-button timeline-zoom-button"
                disabled={timelineZoom >= TIMELINE_ZOOM_MAX}
                onClick={() => adjustTimelineZoom(1)}
                title="Zoom in timeline"
                type="button"
              >
                +
              </button>
            </div>
          </div>
          <button
            className="primary-action queue-toolbar-action"
            data-tutorial-target="timeline-create-task-button"
            onClick={openCreateTaskModal}
            title="Add to timeline"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <TimelineGridBody
        bootstrap={bootstrap}
        clearHoveredMilestonePopup={clearHoveredMilestonePopup}
        collapsedProjects={collapsedProjects}
        collapsedSubsystems={collapsedSubsystems}
        firstDayGridColumn={firstDayGridColumn}
        gridMinWidth={gridMinWidth}
        hasProjectColumn={hasProjectColumn}
        handleTimelineDayMouseEnter={handleTimelineDayMouseEnter}
        membersById={membersById}
        monthGroups={monthGroups}
        openEventModalForDay={openEventModalForDay}
        openTaskDetailModal={openTaskDetailModal}
        projectColumnWidth={projectColumnWidth}
        projectRows={projectRows}
        showProjectCol={showProjectCol}
        showSubsystemCol={showSubsystemCol}
        showTaskCol={showTaskCol}
        subsystemColumnIndex={subsystemColumnIndex}
        subsystemColumnWidth={subsystemColumnWidth}
        subsystemStickyLeft={subsystemStickyLeft}
        taskColumnWidth={taskColumnWidth}
        taskLabelColumnIndex={taskLabelColumnIndex}
        taskLabelStickyLeft={taskLabelStickyLeft}
        timelineDayCellRefs={timelineDayCellRefs}
        timelineDayHeaderCells={timelineDayHeaderCells}
        timelineDays={timeline.days}
        timelineFilterMotionClass={timelineFilterMotionClass}
        timelineGridMotion={timelineGridMotion}
        timelineGridRef={timelineGridRef}
        timelineGridTemplate={timelineGridTemplate}
        handleTimelineZoomWheel={handleTimelineZoomWheel}
        timelineShellRef={timelineShellRef}
        subsystemRows={subsystemRows}
        toggleProject={toggleProject}
        toggleProjectColumn={toggleProjectColumn}
        toggleSubsystem={toggleSubsystem}
        toggleSubsystemColumn={toggleSubsystemColumn}
        toggleTaskColumn={toggleTaskColumn}
      />

      <TimelineMilestoneUnderlaysPortal
        portalTarget={tooltipPortalTarget}
        underlays={timelineDayMilestoneUnderlays}
      />

      <TimelineMilestoneHoverLayer
        controllerRef={setHoveredMilestonePopupLayerRef}
        portalTarget={tooltipPortalTarget}
        resolveGeometry={resolveMilestonePopupGeometry}
      />

      {eventModalMode && modalPortalTarget
        ? createPortal(
            <div
              className="modal-scrim"
              onClick={closeEventModal}
              role="presentation"
              style={{ zIndex: 2050 }}
            >
              <section
                aria-modal="true"
                className="modal-card"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                style={{
                  background: "var(--bg-panel)",
                  border: "1px solid var(--border-base)",
                  ...(eventModalMode === "create" ? { paddingTop: "0.65rem" } : null),
                }}
              >
                <div
                  className="panel-header compact-header"
                  style={eventModalMode === "create" ? { marginBottom: "0.65rem" } : undefined}
                >
                  <div>
                    <p
                      className="eyebrow"
                      style={{
                        color: "var(--meco-blue)",
                        ...(eventModalMode === "create" ? { marginBottom: "0.2rem" } : null),
                      }}
                    >
                      Timeline milestone
                    </p>
                    {eventModalMode === "create" ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                          marginTop: 0,
                        }}
                      >
                        <h2 style={{ color: "var(--text-title)", margin: 0 }}>Create</h2>
                        <button
                          className="secondary-action"
                          onClick={switchMilestoneCreateToTask}
                          type="button"
                        >
                          Task
                        </button>
                        <button className="primary-action" type="button">
                          Milestone
                        </button>
                      </div>
                    ) : (
                      <h2 style={{ color: "var(--text-title)" }}>Edit milestone</h2>
                    )}
                    {activeEventDay ? (
                      <p className="section-copy" style={{ marginTop: "0.25rem" }}>
                        Date: {activeEventDay}
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="icon-button"
                    onClick={closeEventModal}
                    style={{ color: "var(--text-copy)", background: "transparent" }}
                    type="button"
                  >
                    Close
                  </button>
                </div>

                <form className="modal-form" onSubmit={handleEventSubmit}>
                  <label className="field modal-wide">
                    <span style={{ color: "var(--text-title)" }}>Title</span>
                    <input
                      onChange={(event) =>
                        setEventDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      required
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      value={eventDraft.title}
                    />
                  </label>

                  <label className="field">
                    <span style={{ color: "var(--text-title)" }}>Type</span>
                    <select
                      onChange={(event) =>
                        setEventDraft((current) => ({
                          ...current,
                          type: event.target.value as EventType,
                        }))
                      }
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      value={eventDraft.type}
                    >
                      {EVENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span style={{ color: "var(--text-title)" }}>Start date</span>
                    <input
                      onChange={(event) => setEventStartDate(event.target.value)}
                      required
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      type="date"
                      value={eventStartDate}
                    />
                  </label>

                  <label className="field">
                    <span style={{ color: "var(--text-title)" }}>Start time</span>
                    <input
                      onChange={(event) => setEventStartTime(event.target.value)}
                      required
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      type="time"
                      value={eventStartTime}
                    />
                  </label>

                  <label className="field">
                    <span style={{ color: "var(--text-title)" }}>End date (optional)</span>
                    <input
                      onChange={(event) => setEventEndDate(event.target.value)}
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      type="date"
                      value={eventEndDate}
                    />
                  </label>

                  <label className="field">
                    <span style={{ color: "var(--text-title)" }}>End time (optional)</span>
                    <input
                      onChange={(event) => setEventEndTime(event.target.value)}
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      type="time"
                      value={eventEndTime}
                    />
                  </label>

                  <label className="field modal-wide">
                    <span style={{ color: "var(--text-title)" }}>Description</span>
                    <textarea
                      onChange={(event) =>
                        setEventDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      value={eventDraft.description}
                    />
                  </label>

                  <label className="field modal-wide">
                    <span style={{ color: "var(--text-title)" }}>Related projects</span>
                    <select
                      multiple
                      onChange={(event) =>
                        setEventDraft((current) => {
                          const projectIds = Array.from(
                            event.currentTarget.selectedOptions,
                            (option) => option.value,
                          );

                          return {
                            ...current,
                            projectIds,
                            relatedSubsystemIds: reconcileMilestoneSubsystemIds(
                              current.relatedSubsystemIds,
                              projectIds,
                              subsystemsById,
                            ),
                          };
                        })
                      }
                      size={Math.min(bootstrap.projects.length || 1, 6)}
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      value={eventDraft.projectIds}
                    >
                      {bootstrap.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field modal-wide">
                    <span style={{ color: "var(--text-title)" }}>Related subsystems</span>
                    <select
                      multiple
                      onChange={(event) =>
                        setEventDraft((current) => ({
                          ...current,
                          relatedSubsystemIds: Array.from(
                            event.currentTarget.selectedOptions,
                            (option) => option.value,
                          ),
                        }))
                      }
                      size={Math.min(bootstrap.subsystems.length || 1, 6)}
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      value={eventDraft.relatedSubsystemIds}
                    >
                      {selectableSubsystems.map((subsystem) => (
                        <option key={subsystem.id} value={subsystem.id}>
                          {projectsById[subsystem.projectId]?.name
                            ? `${projectsById[subsystem.projectId].name} - ${subsystem.name}`
                            : subsystem.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="checkbox-row modal-wide">
                    <label className="checkbox-field">
                      <input
                        checked={eventDraft.isExternal}
                        onChange={(event) =>
                          setEventDraft((current) => ({
                            ...current,
                            isExternal: event.target.checked,
                          }))
                        }
                        type="checkbox"
                      />
                      <span style={{ color: "var(--text-title)" }}>External milestone/event</span>
                    </label>
                  </div>

                  {eventError ? (
                    <p className="section-copy modal-wide" style={{ color: "var(--official-red)" }}>
                      {eventError}
                    </p>
                  ) : null}

                  {eventModalMode === "edit" && activeDayEvents.length > 1 ? (
                    <p className="section-copy modal-wide">
                      {activeDayEvents.length} milestones are scheduled on this day. This editor
                      opened the earliest one.
                    </p>
                  ) : null}

                  <div className="modal-actions modal-wide">
                    {eventModalMode === "edit" ? (
                      <button
                        className="danger-action"
                        disabled={isDeletingEvent || isSavingEvent}
                        onClick={handleEventDelete}
                        type="button"
                      >
                        {isDeletingEvent ? "Deleting..." : "Delete milestone"}
                      </button>
                    ) : null}
                    <button
                      className="secondary-action"
                      disabled={isDeletingEvent || isSavingEvent}
                      onClick={closeEventModal}
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="primary-action"
                      disabled={isDeletingEvent || isSavingEvent}
                      type="submit"
                    >
                      {isSavingEvent
                        ? "Saving..."
                        : eventModalMode === "create"
                          ? "Add milestone"
                          : "Save changes"}
                    </button>
                  </div>
                </form>
              </section>
            </div>,
            modalPortalTarget,
          )
        : null}
    </section>
  );
};
