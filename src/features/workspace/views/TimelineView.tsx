import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconEye, IconPerson, IconTasks } from "@/components/shared";
import { dateDiffInDays } from "@/lib/appUtils";
import type {
  BootstrapPayload,
  EventPayload,
  EventRecord,
  EventType,
  TaskRecord,
} from "@/types";
import { EditableHoverIndicator } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";

interface TimelineViewProps {
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  activePersonFilter: string;
  setActivePersonFilter: (value: string) => void;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord) => void;
  openCreateTaskModal: () => void;
  onDeleteTimelineEvent: (eventId: string) => Promise<void>;
  onSaveTimelineEvent: (
    mode: "create" | "edit",
    eventId: string | null,
    payload: EventPayload,
  ) => Promise<void>;
  triggerCreateMilestoneToken: number;
}

interface EventStyle {
  label: string;
  columnBackground: string;
  columnBorder: string;
  chipBackground: string;
  chipText: string;
}

interface TimelineEventDraft {
  title: string;
  type: EventType;
  isExternal: boolean;
  description: string;
  relatedSubsystemIds: string[];
}

interface HoveredMilestonePopup {
  anchorStartDay: string | null;
  anchorEndDay: string | null;
  rotationDeg: 45 | 90;
  lines: string[];
  background: string;
  color: string;
}

type TimelineDayMilestoneUnderlayLayout = Record<
  string,
  {
    left: number;
    width: number;
  }
>;

interface TimelineDayMilestoneUnderlay {
  id: string;
  lines: string[];
  color: string;
  rotationDeg: 45 | 90;
  geometry: MilestoneGeometry;
}

interface MilestoneGeometry {
  left: number;
  width: number;
  centerX: number;
  centerY: number;
}

const PROJECT_COLUMN_WIDTH = 112;
const SUBSYSTEM_COLUMN_WIDTH = 128;
const TASK_LABEL_COLUMN_WIDTH = 148;
const HIDDEN_COLUMN_PEEK_WIDTH = 34;
const DEFAULT_EVENT_TYPE: EventType = "internal-review";
const EVENT_TYPE_STYLES: Record<EventType, EventStyle> = {
  "drive-practice": {
    label: "Drive practice",
    columnBackground: "rgba(22, 71, 142, 0.1)",
    columnBorder: "rgba(22, 71, 142, 0.32)",
    chipBackground: "rgba(22, 71, 142, 0.18)",
    chipText: "#0d2e5c",
  },
  competition: {
    label: "Competition",
    columnBackground: "rgba(76, 121, 207, 0.12)",
    columnBorder: "rgba(76, 121, 207, 0.35)",
    chipBackground: "rgba(76, 121, 207, 0.2)",
    chipText: "#1f3f7a",
  },
  deadline: {
    label: "Deadline",
    columnBackground: "rgba(234, 28, 45, 0.11)",
    columnBorder: "rgba(234, 28, 45, 0.36)",
    chipBackground: "rgba(234, 28, 45, 0.18)",
    chipText: "#8e1120",
  },
  "internal-review": {
    label: "Internal review",
    columnBackground: "rgba(36, 104, 71, 0.11)",
    columnBorder: "rgba(36, 104, 71, 0.34)",
    chipBackground: "rgba(36, 104, 71, 0.18)",
    chipText: "#1d5338",
  },
  demo: {
    label: "Demo",
    columnBackground: "rgba(112, 128, 154, 0.13)",
    columnBorder: "rgba(84, 98, 123, 0.35)",
    chipBackground: "rgba(84, 98, 123, 0.22)",
    chipText: "#36475f",
  },
};
const EVENT_TYPE_OPTIONS = (
  Object.entries(EVENT_TYPE_STYLES) as [EventType, EventStyle][]
).map(([value, style]) => ({
  value,
  label: style.label,
}));

function datePortion(dateTime: string) {
  return dateTime.slice(0, 10);
}

function timePortion(dateTime: string) {
  return dateTime.length >= 16 ? dateTime.slice(11, 16) : "12:00";
}

function buildDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

function compareDateTimes(a: string, b: string) {
  const aMs = new Date(a).getTime();
  const bMs = new Date(b).getTime();
  return aMs - bMs;
}

function withColumnOverlayTint(color: string) {
  const rgbaMatch = color.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i,
  );
  if (!rgbaMatch) {
    return color;
  }

  const alpha = Number.parseFloat(rgbaMatch[4] ?? "0.1");
  const overlayAlpha = Math.min(0.62, alpha + 0.36);
  return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${overlayAlpha})`;
}

function localTodayDate() {
  const now = new Date();
  const offsetAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return offsetAdjusted.toISOString().slice(0, 10);
}

function emptyEventDraft(): TimelineEventDraft {
  return {
    title: "",
    type: DEFAULT_EVENT_TYPE,
    isExternal: false,
    description: "",
    relatedSubsystemIds: [],
  };
}

function eventDraftFromRecord(record: EventRecord): TimelineEventDraft {
  return {
    title: record.title,
    type: record.type,
    isExternal: record.isExternal,
    description: record.description,
    relatedSubsystemIds: record.relatedSubsystemIds,
  };
}

function sortEventsByStart(events: EventRecord[]) {
  return [...events].sort((left, right) =>
    left.startDateTime.localeCompare(right.startDateTime),
  );
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  bootstrap,
  isAllProjectsView,
  activePersonFilter,
  setActivePersonFilter,
  membersById,
  openEditTaskModal,
  openCreateTaskModal,
  onDeleteTimelineEvent,
  onSaveTimelineEvent,
  triggerCreateMilestoneToken,
}) => {
  const [viewInterval, setViewInterval] = useState<"all" | "week" | "month">("all");
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [collapsedSubsystems, setCollapsedSubsystems] = useState<Record<string, boolean>>({});
  const [eventModalMode, setEventModalMode] = useState<"create" | "edit" | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventDay, setActiveEventDay] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState<TimelineEventDraft>(emptyEventDraft);
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
  const [hoveredMilestonePopup, setHoveredMilestonePopup] =
    useState<HoveredMilestonePopup | null>(null);
  const [timelineDayMilestoneUnderlayLayouts, setTimelineDayMilestoneUnderlayLayouts] =
    useState<TimelineDayMilestoneUnderlayLayout>({});
  const [timelineGridHeight, setTimelineGridHeight] = useState(0);
  const timelineShellRef = useRef<HTMLDivElement | null>(null);
  const timelineGridRef = useRef<HTMLDivElement | null>(null);
  const timelineDayCellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timelineLayerGeometryFrameRef = useRef<number | null>(null);

  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
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
  const scopedTasks = bootstrap.tasks;
  const scopedSubsystems = bootstrap.subsystems;

  useEffect(() => {
    const validProjectIds = new Set(scopedSubsystems.map((subsystem) => subsystem.projectId));
    setCollapsedProjects((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([projectId]) => validProjectIds.has(projectId)),
      ),
    );
  }, [scopedSubsystems]);

  const timeline = useMemo(() => {
    let startDate: string;
    let endDate: string;

    if (viewInterval === "all") {
      const taskStartDates = scopedTasks.map((task) => task.startDate);
      const taskEndDates = scopedTasks.map((task) => task.dueDate);
      const eventStartDates = bootstrap.events.map((event) => datePortion(event.startDateTime));
      const eventEndDates = bootstrap.events.map((event) =>
        datePortion(event.endDateTime ?? event.startDateTime),
      );

      const startCandidates = [...taskStartDates, ...eventStartDates].sort();
      const endCandidates = [...taskEndDates, ...eventEndDates].sort();

      if (startCandidates.length === 0 || endCandidates.length === 0) {
        return {
          days: [] as string[],
          dayEvents: {} as Record<string, EventRecord[]>,
          subsystemRows: [] as Array<{
            id: string;
            name: string;
            projectId: string;
            projectName: string;
            index: number;
            taskCount: number;
            completeCount: number;
            tasks: Array<TaskRecord & { offset: number; span: number }>;
          }>,
        };
      }

      const startObj = new Date(`${startCandidates[0]}T12:00:00`);
      startObj.setDate(1);

      const endObj = new Date(`${endCandidates[endCandidates.length - 1]}T12:00:00`);
      endObj.setMonth(endObj.getMonth() + 1);
      endObj.setDate(0);

      startDate = startObj.toISOString().slice(0, 10);
      endDate = endObj.toISOString().slice(0, 10);
    } else {
      const now = new Date();
      now.setHours(12, 0, 0, 0);
      let s: Date;
      let e: Date;

      if (viewInterval === "week") {
        s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 12);
        e = new Date(s);
        e.setDate(s.getDate() + 6);
      } else {
        s = new Date(now.getFullYear(), now.getMonth(), 1, 12);
        e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 12);
      }

      startDate = s.toISOString().slice(0, 10);
      endDate = e.toISOString().slice(0, 10);
    }

    const totalDays = dateDiffInDays(startDate, endDate) + 1;
    const days = Array.from({ length: totalDays }, (_, index) => {
      const candidate = new Date(`${startDate}T12:00:00`);
      candidate.setDate(candidate.getDate() + index);
      return candidate.toISOString().slice(0, 10);
    });

    const dayEvents: Record<string, EventRecord[]> = {};
    bootstrap.events.forEach((event) => {
      const eventStart = datePortion(event.startDateTime);
      const eventEnd = datePortion(event.endDateTime ?? event.startDateTime);

      if (eventStart > endDate || eventEnd < startDate) {
        return;
      }

      const rangeStart = eventStart < startDate ? startDate : eventStart;
      const rangeEnd = eventEnd > endDate ? endDate : eventEnd;
      const cursor = new Date(`${rangeStart}T12:00:00`);
      const finalDay = new Date(`${rangeEnd}T12:00:00`);

      while (cursor <= finalDay) {
        const dayKey = cursor.toISOString().slice(0, 10);
        dayEvents[dayKey] = dayEvents[dayKey] ? [...dayEvents[dayKey], event] : [event];
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    const subsystemRows =
      scopedTasks.length === 0
        ? []
        : scopedSubsystems.map((subsystem, index) => {
            const subsystemTasks = scopedTasks
              .filter(
                (task) =>
                  task.subsystemId === subsystem.id &&
                  task.startDate <= endDate &&
                  task.dueDate >= startDate,
              )
              .map((task) => ({
                ...task,
                offset: dateDiffInDays(
                  startDate,
                  task.startDate < startDate ? startDate : task.startDate,
                ),
                span:
                  Math.max(
                    1,
                    dateDiffInDays(
                      task.startDate < startDate ? startDate : task.startDate,
                      task.dueDate > endDate ? endDate : task.dueDate,
                    ) + 1,
                  ),
              }));

            return {
              id: subsystem.id,
              name: subsystem.name,
              projectId: subsystem.projectId,
              projectName: projectsById[subsystem.projectId]?.name ?? "Unknown",
              index,
              taskCount: subsystemTasks.length,
              completeCount: subsystemTasks.filter((task) => task.status === "complete").length,
              tasks: subsystemTasks,
            };
          });

    return { days, dayEvents, subsystemRows };
  }, [bootstrap.events, projectsById, scopedSubsystems, scopedTasks, viewInterval]);

  const timelineGridTemplate = useMemo(() => {
    const dayWidth =
      viewInterval === "all"
        ? "44px"
        : viewInterval === "week"
          ? "minmax(44px, 1fr)"
          : "minmax(28px, 1fr)";
    return `${hasProjectColumn ? `${projectColumnWidth}px ` : ""}${subsystemColumnWidth}px ${taskColumnWidth}px repeat(${timeline.days.length}, ${dayWidth})`;
  }, [
    hasProjectColumn,
    projectColumnWidth,
    subsystemColumnWidth,
    taskColumnWidth,
    timeline.days.length,
    viewInterval,
  ]);

  const gridMinWidth = useMemo(() => {
    const minDayWidth = viewInterval === "month" ? 28 : 44;
    return (
      (hasProjectColumn ? projectColumnWidth : 0) +
      subsystemColumnWidth +
      taskColumnWidth +
      timeline.days.length * minDayWidth
    );
  }, [
    hasProjectColumn,
    projectColumnWidth,
    subsystemColumnWidth,
    taskColumnWidth,
    timeline.days.length,
    viewInterval,
  ]);

  const monthGroups = useMemo(() => {
    const groups: { month: string; span: number }[] = [];
    let lastMonth = "";
    let currentSpan = 0;

    timeline.days.forEach((day) => {
      const monthName = new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
        month: "long",
      });
      if (monthName !== lastMonth) {
        if (lastMonth !== "") {
          groups.push({ month: lastMonth, span: currentSpan });
        }
        lastMonth = monthName;
        currentSpan = 1;
      } else {
        currentSpan += 1;
      }
    });

    if (lastMonth) {
      groups.push({ month: lastMonth, span: currentSpan });
    }
    return groups;
  }, [timeline.days]);

  const dayEventsByDate = useMemo(() => {
    return Object.fromEntries(
      Object.entries(timeline.dayEvents).map(([day, events]) => [day, sortEventsByStart(events)]),
    );
  }, [timeline.dayEvents]);

  const projectRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        id: string;
        name: string;
        subsystems: typeof timeline.subsystemRows;
        taskCount: number;
        completeCount: number;
        tasks: Array<TaskRecord & { offset: number; span: number }>;
      }
    >();

    timeline.subsystemRows.forEach((subsystem) => {
      const existing = grouped.get(subsystem.projectId);
      if (existing) {
        existing.subsystems.push(subsystem);
        existing.taskCount += subsystem.taskCount;
        existing.completeCount += subsystem.completeCount;
        existing.tasks.push(...subsystem.tasks);
        return;
      }

      grouped.set(subsystem.projectId, {
        id: subsystem.projectId,
        name: subsystem.projectName,
        subsystems: [subsystem],
        taskCount: subsystem.taskCount,
        completeCount: subsystem.completeCount,
        tasks: [...subsystem.tasks],
      });
    });

    return Array.from(grouped.values());
  }, [timeline.subsystemRows]);

  const toggleProject = (id: string) => {
    setCollapsedProjects((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const toggleSubsystem = (id: string) => {
    setCollapsedSubsystems((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const closeEventModal = () => {
    setEventModalMode(null);
    setActiveEventId(null);
    setActiveEventDay(null);
    setEventError(null);
    setIsSavingEvent(false);
    setIsDeletingEvent(false);
  };

  const openCreateEventModalForDay = (day: string) => {
    setEventModalMode("create");
    setActiveEventId(null);
    setActiveEventDay(day);
    setEventDraft(emptyEventDraft());
    setEventStartDate(day);
    setEventStartTime("18:00");
    setEventEndDate("");
    setEventEndTime("");
    setEventError(null);
  };

  useEffect(() => {
    if (triggerCreateMilestoneToken <= 0) {
      return;
    }

    openCreateEventModalForDay(localTodayDate());
  }, [triggerCreateMilestoneToken]);

  const openEditEventModalForDay = (day: string, event: EventRecord) => {
    setEventModalMode("edit");
    setActiveEventId(event.id);
    setActiveEventDay(day);
    setEventDraft(eventDraftFromRecord(event));
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

  const getColumnStyle = (day: string) => {
    const events = dayEventsByDate[day];
    if (!events?.length) {
      return null;
    }

    return EVENT_TYPE_STYLES[events[0].type];
  };

  const queueTimelineLayerUpdate = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (timelineLayerGeometryFrameRef.current !== null) {
      return;
    }

    timelineLayerGeometryFrameRef.current = window.requestAnimationFrame(() => {
      timelineLayerGeometryFrameRef.current = null;
      const grid = timelineGridRef.current;
      if (!grid) {
        setTimelineDayMilestoneUnderlayLayouts({});
        setTimelineGridHeight(0);
        return;
      }

      const layouts: TimelineDayMilestoneUnderlayLayout = {};
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

      setTimelineDayMilestoneUnderlayLayouts(layouts);
      setTimelineGridHeight(timelineShellRef.current?.scrollHeight ?? grid.clientHeight);
    });
  };

  const resolveMilestonePopupGeometry = (
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

      const measured = timelineDayMilestoneUnderlayLayouts[day];
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
    const gridHeight =
      timelineShellRef.current.scrollHeight ||
      timelineShellRef.current.clientHeight ||
      timelineGridHeight;
    if (gridHeight <= 0) {
      return null;
    }

    return {
      left,
      width: right - left,
      centerX: (left + right) / 2,
      centerY: gridHeight / 2,
    };
  };

  const updateHoveredMilestonePopup = (
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

    setHoveredMilestonePopup({
      anchorStartDay: normalizedPopupStartDay,
      anchorEndDay: normalizedPopupEndDay,
      rotationDeg: isMultiDayEvent ? 45 : 90,
      lines,
      background,
      color,
    });
    queueTimelineLayerUpdate();
  };

  const showDateCellMilestonePopup = (
    anchor: HTMLElement,
    eventsOnDay: EventRecord[],
    eventStyle: EventStyle | null,
  ) => {
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

    updateHoveredMilestonePopup(
      anchor,
      lines,
      eventStyle?.columnBackground ?? "rgba(17, 33, 61, 0.16)",
      eventStyle?.chipText ?? "var(--text-title)",
    );
  };

  const clearHoveredMilestonePopup = () => {
    setHoveredMilestonePopup(null);
  };

  const getTimelineDayOverlayHoverProps = (day: string) => {
    const eventsOnDay = dayEventsByDate[day] ?? [];
    const primaryEvent = eventsOnDay[0];
    const dayStyle = primaryEvent ? EVENT_TYPE_STYLES[primaryEvent.type] : null;

    return {
      onMouseEnter: (event: React.MouseEvent<HTMLElement>) =>
        showDateCellMilestonePopup(event.currentTarget, eventsOnDay, dayStyle),
      onMouseLeave: clearHoveredMilestonePopup,
    };
  };

  useEffect(() => {
    queueTimelineLayerUpdate();
    return () => {
      if (timelineLayerGeometryFrameRef.current !== null) {
        window.cancelAnimationFrame(timelineLayerGeometryFrameRef.current);
        timelineLayerGeometryFrameRef.current = null;
      }
    };
  }, [
    timeline.days,
    dayEventsByDate,
    timelineGridTemplate,
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
  }, []);

  const timelineDayMilestoneUnderlays = bootstrap.events
    .map((event) => {
      if (!timeline.days.length) {
        return null;
      }

      const timelineStart = timeline.days[0];
      const timelineEnd = timeline.days[timeline.days.length - 1];
      const eventStartDay = datePortion(event.startDateTime);
      const eventEndDay = datePortion(event.endDateTime ?? event.startDateTime);
      const clampedStartDay = eventStartDay < timelineStart ? timelineStart : eventStartDay;
      const clampedEndDay = eventEndDay > timelineEnd ? timelineEnd : eventEndDay;

      if (clampedStartDay > timelineEnd || clampedEndDay < timelineStart) {
        return null;
      }

      const geometry = resolveMilestonePopupGeometry(clampedStartDay, clampedEndDay);
      if (!geometry) {
        return null;
      }

      const style = EVENT_TYPE_STYLES[event.type];
      const isMultiDayEvent = eventStartDay !== eventEndDay;

      return {
        id: event.id,
        lines: [event.title],
        color: style.chipText,
        rotationDeg: isMultiDayEvent ? 45 : 90,
        geometry,
      } satisfies TimelineDayMilestoneUnderlay;
    })
    .filter((entry): entry is TimelineDayMilestoneUnderlay => entry !== null);

  const activePersonFilterLabel =
    activePersonFilter === "all"
      ? "All roster"
      : membersById[activePersonFilter]?.name ?? "Selected person";

  const activeDayEvents = activeEventDay ? dayEventsByDate[activeEventDay] ?? [] : [];
  const hoveredMilestonePopupGeometry = hoveredMilestonePopup
    ? resolveMilestonePopupGeometry(
        hoveredMilestonePopup.anchorStartDay,
        hoveredMilestonePopup.anchorEndDay,
      )
    : null;
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
            {activePersonFilter === "all"
              ? "Showing all roster-linked tasks."
              : `Filtered to ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
          </p>
        </div>
        <div className="panel-actions filter-toolbar timeline-toolbar">
          <div className="timeline-toolbar-filters">
            <label
              aria-label="Filter person"
              className={`toolbar-filter toolbar-filter-compact timeline-roster-filter${activePersonFilter !== "all" ? " is-active" : ""}`}
            >
              <span aria-hidden="true" className="toolbar-filter-icon">
                <IconPerson />
              </span>
              <select
                onChange={(event) => setActivePersonFilter(event.target.value)}
                title={activePersonFilterLabel}
                value={activePersonFilter}
              >
                <option value="all">All roster</option>
                {bootstrap.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="toolbar-filter toolbar-filter-compact timeline-interval-filter">
              <span className="toolbar-filter-icon">
                <IconTasks />
              </span>
              <select
                aria-label="Timeline interval"
                onChange={(candidate) =>
                  setViewInterval(candidate.target.value as "all" | "week" | "month")
                }
                value={viewInterval}
              >
                <option value="all">All time</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </label>
          </div>
          <button
            className="primary-action queue-toolbar-action"
            onClick={openCreateTaskModal}
            title="Add to timeline"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      {timeline.days.length ? (
        <div
          className="timeline-shell"
          ref={timelineShellRef}
          style={{
            overflowX: "auto",
            padding: 0,
            background: "var(--bg-panel)",
            borderRadius: 0,
            border: "1px solid var(--border-base)",
            position: "relative",
          }}
        >
          <div
            ref={timelineGridRef}
            style={{
              display: "grid",
              width: "100%",
              minWidth: `${gridMinWidth}px`,
              gridTemplateColumns: timelineGridTemplate,
              position: "relative",
              boxSizing: "border-box",
            }}
          >
            <button
              aria-label={`${showSubsystemCol ? "Hide" : "Show"} subsystem column`}
              aria-pressed={showSubsystemCol}
              className={`sticky-label timeline-column-header timeline-column-header-button${showSubsystemCol ? "" : " is-hidden"}`}
              onClick={() => setIsSubsystemColumnVisible((previous) => !previous)}
              title={`${showSubsystemCol ? "Hide" : "Show"} subsystem column`}
              style={{
                gridRow: showSubsystemCol ? "1 / span 2" : "1",
                gridColumn: `${subsystemColumnIndex}`,
                width: `${subsystemColumnWidth}px`,
                minWidth: `${subsystemColumnWidth}px`,
                maxWidth: `${subsystemColumnWidth}px`,
                padding: showSubsystemCol ? "10px 12px" : "4px",
                fontWeight: "bold",
                borderRight: "1px solid var(--border-base)",
                borderBottom: "1px solid var(--border-base)",
                display: "flex",
                alignItems: "center",
                justifyContent: showSubsystemCol ? "space-between" : "center",
                gap: "0.3rem",
                boxSizing: "border-box",
                height: "100%",
                position: "sticky",
                left: `${subsystemStickyLeft}px`,
                zIndex: 15,
                background: "var(--bg-panel)",
              }}
              type="button"
            >
              {showSubsystemCol ? <span className="timeline-column-header-label">Subsystem</span> : null}
              <span
                aria-hidden="true"
                className={`timeline-column-visibility-icon${showSubsystemCol ? " is-active" : ""}`}
              >
                <IconEye />
              </span>
            </button>

            <button
              aria-label={`${showTaskCol ? "Hide" : "Show"} task column`}
              aria-pressed={showTaskCol}
              className={`sticky-label timeline-column-header timeline-column-header-button${showTaskCol ? "" : " is-hidden"}`}
              onClick={() => setIsTaskColumnVisible((previous) => !previous)}
              title={`${showTaskCol ? "Hide" : "Show"} task column`}
              style={{
                gridRow: showTaskCol ? "1 / span 2" : "1",
                gridColumn: `${taskLabelColumnIndex}`,
                width: `${taskColumnWidth}px`,
                minWidth: `${taskColumnWidth}px`,
                maxWidth: `${taskColumnWidth}px`,
                padding: showTaskCol ? "10px 12px" : "4px",
                fontWeight: "bold",
                borderRight: "1px solid var(--border-base)",
                borderBottom: "1px solid var(--border-base)",
                display: "flex",
                alignItems: "center",
                justifyContent: showTaskCol ? "space-between" : "center",
                gap: "0.3rem",
                boxSizing: "border-box",
                height: "100%",
                position: "sticky",
                left: `${taskLabelStickyLeft}px`,
                zIndex: 15,
                background: "var(--bg-panel)",
              }}
              type="button"
            >
              {showTaskCol ? <span className="timeline-column-header-label">Task</span> : null}
              <span
                aria-hidden="true"
                className={`timeline-column-visibility-icon${showTaskCol ? " is-active" : ""}`}
              >
                <IconEye />
              </span>
            </button>

            {hasProjectColumn ? (
              <button
                aria-label={`${showProjectCol ? "Hide" : "Show"} project column`}
                aria-pressed={showProjectCol}
                className={`sticky-label timeline-column-header timeline-column-header-button${showProjectCol ? "" : " is-hidden"}`}
                onClick={() => setIsProjectColumnVisible((previous) => !previous)}
                title={`${showProjectCol ? "Hide" : "Show"} project column`}
                style={{
                  gridRow: showProjectCol ? "1 / span 2" : "1",
                  gridColumn: "1",
                  width: `${projectColumnWidth}px`,
                  minWidth: `${projectColumnWidth}px`,
                  maxWidth: `${projectColumnWidth}px`,
                  padding: showProjectCol ? "10px 12px" : "4px",
                  fontWeight: "bold",
                  borderRight: "1px solid var(--border-base)",
                  borderBottom: "1px solid var(--border-base)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: showProjectCol ? "space-between" : "center",
                  gap: "0.3rem",
                  boxSizing: "border-box",
                  height: "100%",
                  position: "sticky",
                  left: 0,
                  zIndex: 16,
                  background: "var(--bg-panel)",
                }}
                type="button"
              >
                {showProjectCol ? <span className="timeline-column-header-label">Project</span> : null}
                <span
                  aria-hidden="true"
                  className={`timeline-column-visibility-icon${showProjectCol ? " is-active" : ""}`}
                >
                  <IconEye />
                </span>
              </button>
            ) : null}

            {(() => {
              let currentColumn = firstDayGridColumn;
              return monthGroups.map((group, index) => {
                const start = currentColumn;
                currentColumn += group.span;
                return (
                  <div
                    key={`month-${index}`}
                    style={{
                      gridRow: "1",
                      gridColumn: `${start} / span ${group.span}`,
                      textAlign: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--border-base)",
                      borderRight: "1px solid var(--border-base)",
                      textTransform: "uppercase",
                      color: "var(--meco-blue)",
                      background: "var(--bg-row-alt)",
                      position: "sticky",
                      top: 0,
                      zIndex: 12,
                      boxSizing: "border-box",
                    }}
                  >
                    {group.month}
                  </div>
                );
              });
            })()}

            {timeline.days.map((day, dayIndex) => {
              const dateObject = new Date(`${day}T00:00:00`);
              const eventsOnDay = dayEventsByDate[day] ?? [];
              const primaryEvent = eventsOnDay[0];
              const dayStyle = primaryEvent ? EVENT_TYPE_STYLES[primaryEvent.type] : null;
              const primaryEventStartDay = primaryEvent ? datePortion(primaryEvent.startDateTime) : day;
              const primaryEventEndDay = primaryEvent?.endDateTime
                ? datePortion(primaryEvent.endDateTime)
                : primaryEventStartDay;

              return (
                <div
                  className="timeline-day"
                  data-timeline-day={day}
                  ref={(node) => {
                    timelineDayCellRefs.current[day] = node;
                  }}
                  {...getTimelineDayOverlayHoverProps(day)}
                  key={day}
                  style={{
                    gridRow: "2",
                    gridColumn: dayIndex + firstDayGridColumn,
                    textAlign: "center",
                    fontSize: "9px",
                    padding: "6px 0",
                    borderRight: `1px solid ${dayStyle?.columnBorder ?? "var(--border-base)"}`,
                    borderBottom: "2px solid var(--border-base)",
                    color: "var(--text-copy)",
                    textTransform: "uppercase",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    lineHeight: "1.1",
                    minWidth: 0,
                    overflow: "visible",
                    boxSizing: "border-box",
                    position: "sticky",
                    top: "27px",
                    zIndex: 12,
                    background: dayStyle?.columnBackground ?? "var(--bg-panel)",
                  }}
                  data-popup-start-day={primaryEventStartDay}
                  data-popup-end-day={primaryEventEndDay}
                >
                  <span style={{ whiteSpace: "nowrap", fontSize: "8px" }}>
                    {dateObject.toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                  <button
                    className={`timeline-day-number-button${eventsOnDay.length ? " has-event" : ""}`}
                    onClick={() => openEventModalForDay(day)}
                    title={
                      eventsOnDay.length
                        ? `Edit milestone on ${day}`
                        : `Add milestone on ${day}`
                    }
                    type="button"
                  >
                    <strong
                      style={{
                        fontSize: "11px",
                        color: dayStyle ? dayStyle.chipText : "var(--text-title)",
                      }}
                    >
                      {dateObject.toLocaleDateString(undefined, { day: "numeric" })}
                    </strong>
                  </button>
                </div>
              );
            })}
          </div>

          {hasProjectColumn ? (
            projectRows.map((project, projectIndex) => {
              const projectCollapsed = collapsedProjects[project.id] ?? false;
              const projectRowCount = projectCollapsed
                ? 1
                : project.subsystems.reduce((total, subsystem) => {
                    const subsystemCollapsed = collapsedSubsystems[subsystem.id] ?? false;
                    return (
                      total +
                      (subsystemCollapsed ? 1 : Math.max(1, subsystem.tasks.length))
                    );
                  }, 0);
              const collapsedSummarySpan =
                (showSubsystemCol ? 1 : 0) + (showTaskCol ? 1 : 0);
              const collapsedSummaryStart = showSubsystemCol
                ? subsystemColumnIndex
                : taskLabelColumnIndex;
              const collapsedSummaryStickyLeft = showSubsystemCol
                ? subsystemStickyLeft
                : taskLabelStickyLeft;
              const projectBackground =
                projectIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";

              return (
                <div
                  className="subsystem-group"
                  key={project.id}
                  style={{
                    display: "grid",
                    width: "100%",
                    minWidth: `${gridMinWidth}px`,
                    gridTemplateColumns: timelineGridTemplate,
                    background: projectBackground,
                    borderBottom: "1px solid var(--border-base)",
                  }}
                >
                  {showProjectCol ? (
                  <div
                    className="timeline-merged-cell-column"
                    style={{
                      gridRow: `1 / span ${Math.max(1, projectRowCount)}`,
                      gridColumn: "1",
                        position: "sticky",
                        left: 0,
                        zIndex: 10,
                        background: projectBackground,
                        borderRight: "1px solid var(--border-base)",
                        display: "flex",
                        flexDirection: projectCollapsed ? "row" : "column",
                        justifyContent: projectCollapsed ? "flex-start" : "center",
                        alignItems: "center",
                        minHeight: "44px",
                        padding: projectCollapsed ? "0 12px" : "8px 6px",
                        overflow: projectCollapsed ? "hidden" : "visible",
                        boxSizing: "border-box",
                      }}
                    >
                    <button
                      className="subsystem-toggle"
                      onClick={() => toggleProject(project.id)}
                      type="button"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          fontSize: "12px",
                          color: "var(--text-copy)",
                          marginRight: projectCollapsed ? "6px" : 0,
                          marginBottom: projectCollapsed ? 0 : 0,
                          position: projectCollapsed ? "static" : "absolute",
                          top: projectCollapsed ? undefined : "4px",
                          right: projectCollapsed ? undefined : "4px",
                          zIndex: 1,
                          flexShrink: 0,
                        }}
                      >
                        {projectCollapsed ? "\u25B6" : "\u25BC"}
                      </button>
                    <div className={`timeline-merged-cell-text${projectCollapsed ? "" : " is-rotated"}`}>
                      <span
                        className="timeline-merged-cell-title timeline-ellipsis-reveal"
                        data-full-text={project.name}
                      >
                        {project.name}
                      </span>
                        <span className="timeline-merged-cell-meta">
                          {project.completeCount}/{project.taskCount}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {projectCollapsed ? (
                    <>
                      {collapsedSummarySpan > 0 ? (
                        <div
                          style={{
                            gridRow: "1",
                            gridColumn: `${collapsedSummaryStart} / span ${collapsedSummarySpan}`,
                            position: "sticky",
                            left: `${collapsedSummaryStickyLeft}px`,
                            zIndex: 8,
                            background: projectBackground,
                            borderRight: "1px solid var(--border-base)",
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 12px",
                            minHeight: "44px",
                            color: "var(--text-copy)",
                            fontSize: "0.75rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {project.subsystems.length} subsystems
                        </div>
                      ) : null}

                      {timeline.days.map((day, dayIndex) => {
                        const dayStyle = getColumnStyle(day);
                        const dayHoverProps = getTimelineDayOverlayHoverProps(day);
                        return (
                          <div
                            key={`${project.id}-${day}`}
                            {...dayHoverProps}
                            style={{
                              gridRow: "1",
                              gridColumn: dayIndex + firstDayGridColumn,
                              borderRight: `1px solid ${
                                dayStyle?.columnBorder ?? "var(--border-base)"
                              }`,
                              background: dayStyle?.columnBackground,
                              minHeight: "44px",
                            }}
                          />
                        );
                      })}

                      {project.tasks.map((task) => (
                        <button
                          key={task.id}
                          className={`timeline-bar timeline-${task.status} editable-hover-target`}
                          onClick={() => openEditTaskModal(task)}
                          onMouseEnter={clearHoveredMilestonePopup}
                          style={{
                            gridRow: "1",
                            gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                            height: "8px",
                            margin: "0 2px",
                            zIndex: 5,
                            borderRadius: "2px",
                            border: "none",
                            cursor: "pointer",
                            alignSelf: "center",
                            minWidth: 0,
                            padding: 0,
                            opacity: 0.7,
                          }}
                          title={`${task.title} (${task.status})`}
                          type="button"
                        >
                          <EditableHoverIndicator className="editable-hover-indicator-compact" />
                        </button>
                      ))}
                    </>
                  ) : (
                    (() => {
                      let rowCursor = 1;

                    return project.subsystems.map((subsystem) => {
                        const canToggleSubsystem = subsystem.tasks.length > 1;
                        const collapsed = canToggleSubsystem ? collapsedSubsystems[subsystem.id] ?? false : false;
                        const taskCount = Math.max(1, subsystem.tasks.length);
                        const subsystemRowStart = rowCursor;
                        const subsystemRowCount = collapsed ? 1 : taskCount;
                        rowCursor += subsystemRowCount;
                        const groupBackground =
                          subsystem.index % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";

                        return (
                          <React.Fragment key={subsystem.id}>
                            {showSubsystemCol ? (
                              <div
                                className="timeline-merged-cell-column"
                                style={{
                                  gridRow: collapsed
                                    ? `${subsystemRowStart}`
                                    : `${subsystemRowStart} / span ${taskCount}`,
                                  gridColumn: `${subsystemColumnIndex}`,
                                  position: "sticky",
                                  left: `${subsystemStickyLeft}px`,
                                  zIndex: 8,
                                  background: groupBackground,
                                  borderRight: "1px solid var(--border-base)",
                                  display: "flex",
                                  flexDirection: collapsed ? "row" : "column",
                                  justifyContent: collapsed ? "flex-start" : "center",
                                  alignItems: "center",
                                  minHeight: "44px",
                                  padding: collapsed ? "0 12px" : "8px 6px",
                                  overflow: collapsed ? "hidden" : "visible",
                                  boxSizing: "border-box",
                                }}
                              >
                                {canToggleSubsystem ? (
                                  <button
                                    className="subsystem-toggle"
                                    onClick={() => toggleSubsystem(subsystem.id)}
                                    type="button"
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "4px",
                                      fontSize: "12px",
                                      color: "var(--text-copy)",
                                      marginRight: collapsed ? "6px" : 0,
                                      marginBottom: collapsed ? 0 : 0,
                                      position: collapsed ? "static" : "absolute",
                                      top: collapsed ? undefined : "4px",
                                      right: collapsed ? undefined : "4px",
                                      zIndex: 1,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {collapsed ? "\u25B6" : "\u25BC"}
                                  </button>
                                ) : null}
                                <div className={`timeline-merged-cell-text${collapsed ? "" : " is-rotated"}`}>
                                  <span
                                    className="timeline-merged-cell-title timeline-ellipsis-reveal"
                                    data-full-text={subsystem.name}
                                  >
                                    {subsystem.name}
                                  </span>
                                </div>
                                {!collapsed ? (
                                  <span className="timeline-subsystem-counter-corner">
                                    {subsystem.completeCount}/{subsystem.taskCount}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}

                            {collapsed && showTaskCol ? (
                              <div
                                style={{
                                  gridRow: `${subsystemRowStart}`,
                                  gridColumn: `${taskLabelColumnIndex}`,
                                  position: "sticky",
                                  left: `${taskLabelStickyLeft}px`,
                                  zIndex: 7,
                                  background: groupBackground,
                                  borderRight: "1px solid var(--border-base)",
                                  boxSizing: "border-box",
                                  minHeight: "44px",
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "0 12px",
                                  fontSize: "0.72rem",
                                  color: "var(--text-copy)",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {subsystem.tasks.length} task{subsystem.tasks.length === 1 ? "" : "s"}
                              </div>
                            ) : null}

                            {!collapsed && showTaskCol ? (
                              <div
                                style={{
                                  gridRow: `${subsystemRowStart} / span ${taskCount}`,
                                  gridColumn: `${taskLabelColumnIndex}`,
                                  position: "sticky",
                                  left: `${taskLabelStickyLeft}px`,
                                  zIndex: 7,
                                  background: groupBackground,
                                  borderRight: "1px solid var(--border-base)",
                                  boxSizing: "border-box",
                                }}
                              />
                            ) : null}

                            {collapsed
                              ? timeline.days.map((day, dayIndex) => {
                                  const dayStyle = getColumnStyle(day);
                                  const dayHoverProps = getTimelineDayOverlayHoverProps(day);
                                  return (
                                    <div
                                      key={`${subsystem.id}-${day}`}
                                      {...dayHoverProps}
                                      style={{
                                        gridRow: subsystemRowStart,
                                        gridColumn: dayIndex + firstDayGridColumn,
                                        borderRight: `1px solid ${
                                          dayStyle?.columnBorder ?? "var(--border-base)"
                                        }`,
                                        background: dayStyle?.columnBackground,
                                        minHeight: "44px",
                                      }}
                                    />
                                  );
                                })
                              : null}

                            {collapsed &&
                              subsystem.tasks.map((task) => (
                                <button
                                  key={task.id}
                                  className={`timeline-bar timeline-${task.status} editable-hover-target`}
                                  onClick={() => openEditTaskModal(task)}
                                  onMouseEnter={clearHoveredMilestonePopup}
                                  style={{
                                    gridRow: subsystemRowStart,
                                    gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                                    height: "8px",
                                    margin: "0 2px",
                                    zIndex: 5,
                                    borderRadius: "2px",
                                    border: "none",
                                    cursor: "pointer",
                                    alignSelf: "center",
                                    minWidth: 0,
                                    padding: 0,
                                    opacity: 0.7,
                                  }}
                                  title={`${task.title} (${task.status})`}
                                  type="button"
                                >
                                  <EditableHoverIndicator className="editable-hover-indicator-compact" />
                                </button>
                              ))}

                            {!collapsed
                              ? subsystem.tasks.map((task, taskIndex) => (
                                  <React.Fragment key={task.id}>
                                    {showTaskCol ? (
                                      <button
                                        className="task-label"
                                        onClick={() => openEditTaskModal(task)}
                                        style={{
                                          gridRow: subsystemRowStart + taskIndex,
                                          gridColumn: `${taskLabelColumnIndex}`,
                                          minHeight: "44px",
                                          padding: "0 12px",
                                          fontSize: "0.8rem",
                                          border: "none",
                                          borderRight: "1px solid var(--border-base)",
                                          boxSizing: "border-box",
                                          display: "flex",
                                          flexDirection: "column",
                                          justifyContent: "center",
                                          alignItems: "flex-start",
                                          position: "sticky",
                                          left: `${taskLabelStickyLeft}px`,
                                          zIndex: 7,
                                          background: groupBackground,
                                          overflow: "visible",
                                          borderTop:
                                            taskIndex === 0 ? "none" : "1px solid var(--border-base)",
                                          borderRadius: 0,
                                          textAlign: "left",
                                          cursor: "pointer",
                                        }}
                                        type="button"
                                      >
                                        <strong
                                          className="timeline-task-label-title timeline-ellipsis-reveal"
                                          data-full-text={task.title}
                                          style={{
                                            display: "block",
                                            color: "var(--text-title)",
                                            lineHeight: "1.2",
                                          }}
                                        >
                                          {task.title}
                                        </strong>
                                        <span
                                          className="timeline-task-label-owner timeline-ellipsis-reveal"
                                          data-full-text={
                                            (task.ownerId ? membersById[task.ownerId]?.name : null) ??
                                            "Unassigned"
                                          }
                                          style={{ fontSize: "0.7rem", color: "var(--text-copy)" }}
                                        >
                                          {(task.ownerId ? membersById[task.ownerId]?.name : null) ??
                                            "Unassigned"}
                                        </span>
                                      </button>
                                    ) : null}
                                    {timeline.days.map((day, dayIndex) => {
                                      const dayStyle = getColumnStyle(day);
                                      const dayHoverProps = getTimelineDayOverlayHoverProps(day);
                                      return (
                                    <div
                                      key={`${task.id}-${day}`}
                                      {...dayHoverProps}
                                      style={{
                                            gridRow: subsystemRowStart + taskIndex,
                                            gridColumn: dayIndex + firstDayGridColumn,
                                            borderRight: `1px solid ${
                                              dayStyle?.columnBorder ?? "var(--border-base)"
                                            }`,
                                            borderTop:
                                              taskIndex === 0
                                                ? "none"
                                                : "1px solid var(--border-base)",
                                            background: dayStyle?.columnBackground,
                                            minHeight: "44px",
                                          }}
                                        />
                                      );
                                    })}
                                    <button
                                      className={`timeline-bar timeline-${task.status} editable-hover-target`}
                                      onClick={() => openEditTaskModal(task)}
                                      onMouseEnter={clearHoveredMilestonePopup}
                                      style={{
                                        gridRow: subsystemRowStart + taskIndex,
                                        gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                                        margin: "6px 4px",
                                        zIndex: 5,
                                        borderRadius: "4px",
                                        border: "none",
                                        color: "#fff",
                                        fontSize: "0.7rem",
                                        textAlign: "left",
                                        padding: "0 8px",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                        alignSelf: "center",
                                        minWidth: 0,
                                      }}
                                      title={`Edit ${task.title}`}
                                      type="button"
                                    >
                                      {task.title}
                                      <EditableHoverIndicator className="editable-hover-indicator-compact" />
                                    </button>
                                  </React.Fragment>
                                ))
                              : null}
                          </React.Fragment>
                        );
                      });
                    })()
                  )}
                </div>
              );
            })
          ) : (
            timeline.subsystemRows.map((subsystem, subsystemIndex) => {
            const canToggleSubsystem = subsystem.tasks.length > 1;
            const collapsed = canToggleSubsystem ? collapsedSubsystems[subsystem.id] ?? false : false;
            const taskCount = Math.max(1, subsystem.tasks.length);
            const groupBackground =
              subsystemIndex % 2 === 0 ? "var(--bg-panel)" : "var(--bg-row-alt)";

            return (
              <div
                className="subsystem-group"
                key={subsystem.id}
                style={{
                  display: "grid",
                  width: "100%",
                  minWidth: `${gridMinWidth}px`,
                  gridTemplateColumns: timelineGridTemplate,
                  background: groupBackground,
                  borderBottom: "1px solid var(--border-base)",
                }}
              >
                {showSubsystemCol ? (
                  <div
                    className="timeline-merged-cell-column"
                    style={{
                      gridRow: collapsed ? "1" : `1 / span ${taskCount}`,
                      gridColumn: `${subsystemColumnIndex}`,
                      position: "sticky",
                      left: `${subsystemStickyLeft}px`,
                      zIndex: 8,
                      background: groupBackground,
                      borderRight: "1px solid var(--border-base)",
                      display: "flex",
                      flexDirection: collapsed ? "row" : "column",
                      justifyContent: collapsed ? "flex-start" : "center",
                      alignItems: "center",
                      minHeight: "44px",
                      padding: collapsed ? "0 12px" : "8px 6px",
                      overflow: collapsed ? "hidden" : "visible",
                      boxSizing: "border-box",
                    }}
                  >
                    {canToggleSubsystem ? (
                      <button
                        className="subsystem-toggle"
                        onClick={() => toggleSubsystem(subsystem.id)}
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px",
                          fontSize: "12px",
                          color: "var(--text-copy)",
                          marginRight: collapsed ? "6px" : 0,
                          marginBottom: collapsed ? 0 : 0,
                          position: collapsed ? "static" : "absolute",
                          top: collapsed ? undefined : "4px",
                          right: collapsed ? undefined : "4px",
                          zIndex: 1,
                          flexShrink: 0,
                        }}
                      >
                        {collapsed ? "\u25B6" : "\u25BC"}
                      </button>
                    ) : null}
                    <div className={`timeline-merged-cell-text${collapsed ? "" : " is-rotated"}`}>
                      <span
                        className="timeline-merged-cell-title timeline-ellipsis-reveal"
                        data-full-text={subsystem.name}
                      >
                        {subsystem.name}
                      </span>
                    </div>
                    {!collapsed ? (
                      <span className="timeline-subsystem-counter-corner">
                        {subsystem.completeCount}/{subsystem.taskCount}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {showProjectCol ? (
                  <div
                    className="timeline-merged-cell-column"
                    style={{
                      gridRow: `1 / span ${taskCount}`,
                      gridColumn: "1",
                      minHeight: "44px",
                      padding: "10px 12px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-title)",
                      borderRight: "1px solid var(--border-base)",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      position: "sticky",
                      left: 0,
                      zIndex: 9,
                      background: groupBackground,
                      overflow: "visible",
                      whiteSpace: "nowrap",
                    }}
                    title={subsystem.projectName}
                  >
                    <span
                      className="timeline-merged-cell-title timeline-ellipsis-reveal"
                      data-full-text={subsystem.projectName}
                    >
                      {subsystem.projectName}
                    </span>
                  </div>
                ) : null}

                {collapsed && showTaskCol ? (
                  <div
                    style={{
                      gridRow: "1",
                      gridColumn: `${taskLabelColumnIndex}`,
                      position: "sticky",
                      left: `${taskLabelStickyLeft}px`,
                      zIndex: 7,
                      background: groupBackground,
                      borderRight: "1px solid var(--border-base)",
                      boxSizing: "border-box",
                      minHeight: "44px",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 12px",
                      fontSize: "0.72rem",
                      color: "var(--text-copy)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {subsystem.tasks.length} task{subsystem.tasks.length === 1 ? "" : "s"}
                  </div>
                ) : null}

                {!collapsed && showTaskCol ? (
                  <div
                    style={{
                      gridRow: `1 / span ${taskCount}`,
                      gridColumn: `${taskLabelColumnIndex}`,
                      position: "sticky",
                      left: `${taskLabelStickyLeft}px`,
                      zIndex: 7,
                      background: groupBackground,
                      borderRight: "1px solid var(--border-base)",
                      boxSizing: "border-box",
                    }}
                  />
                ) : null}

                {collapsed
                  ? timeline.days.map((day, dayIndex) => {
                      const dayStyle = getColumnStyle(day);
                      const dayHoverProps = getTimelineDayOverlayHoverProps(day);
                      return (
                        <div
                          key={day}
                          {...dayHoverProps}
                          style={{
                            gridRow: "1",
                            gridColumn: dayIndex + firstDayGridColumn,
                            borderRight: `1px solid ${
                              dayStyle?.columnBorder ?? "var(--border-base)"
                            }`,
                            background: dayStyle?.columnBackground,
                            minHeight: "44px",
                          }}
                        />
                      );
                    })
                  : null}

                {collapsed &&
                  subsystem.tasks.map((task) => (
                    <button
                      key={task.id}
                      className={`timeline-bar timeline-${task.status} editable-hover-target`}
                      onClick={() => openEditTaskModal(task)}
                      onMouseEnter={clearHoveredMilestonePopup}
                      style={{
                        gridRow: "1",
                        gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                        height: "8px",
                        margin: "0 2px",
                        zIndex: 5,
                        borderRadius: "2px",
                        border: "none",
                        cursor: "pointer",
                        alignSelf: "center",
                        minWidth: 0,
                        padding: 0,
                        opacity: 0.7,
                      }}
                      title={`${task.title} (${task.status})`}
                      type="button"
                    >
                      <EditableHoverIndicator className="editable-hover-indicator-compact" />
                    </button>
                  ))}

                {!collapsed
                  ? subsystem.tasks.map((task, taskIndex) => (
                      <React.Fragment key={task.id}>
                        {showTaskCol ? (
                          <button
                            className="task-label"
                            onClick={() => openEditTaskModal(task)}
                            style={{
                              gridRow: taskIndex + 1,
                              gridColumn: `${taskLabelColumnIndex}`,
                              minHeight: "44px",
                              padding: "0 12px",
                              fontSize: "0.8rem",
                              border: "none",
                              borderRight: "1px solid var(--border-base)",
                              boxSizing: "border-box",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "flex-start",
                              position: "sticky",
                              left: `${taskLabelStickyLeft}px`,
                              zIndex: 7,
                              background: groupBackground,
                              overflow: "visible",
                              borderTop:
                                taskIndex === 0 ? "none" : "1px solid var(--border-base)",
                              borderRadius: 0,
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                            type="button"
                          >
                            <strong
                              className="timeline-task-label-title timeline-ellipsis-reveal"
                              data-full-text={task.title}
                              style={{
                                display: "block",
                                color: "var(--text-title)",
                                lineHeight: "1.2",
                              }}
                            >
                              {task.title}
                            </strong>
                            <span
                              className="timeline-task-label-owner timeline-ellipsis-reveal"
                              data-full-text={
                                (task.ownerId ? membersById[task.ownerId]?.name : null) ??
                                "Unassigned"
                              }
                              style={{ fontSize: "0.7rem", color: "var(--text-copy)" }}
                            >
                              {(task.ownerId ? membersById[task.ownerId]?.name : null) ??
                                "Unassigned"}
                            </span>
                          </button>
                        ) : null}
                        {timeline.days.map((day, dayIndex) => {
                          const dayStyle = getColumnStyle(day);
                          const dayHoverProps = getTimelineDayOverlayHoverProps(day);
                          return (
                            <div
                              key={day}
                              {...dayHoverProps}
                              style={{
                                gridRow: taskIndex + 1,
                                gridColumn: dayIndex + firstDayGridColumn,
                                borderRight: `1px solid ${
                                  dayStyle?.columnBorder ?? "var(--border-base)"
                                }`,
                                borderTop:
                                  taskIndex === 0 ? "none" : "1px solid var(--border-base)",
                                background: dayStyle?.columnBackground,
                                minHeight: "44px",
                              }}
                            />
                          );
                        })}
                        <button
                          className={`timeline-bar timeline-${task.status} editable-hover-target`}
                          onClick={() => openEditTaskModal(task)}
                          onMouseEnter={clearHoveredMilestonePopup}
                          style={{
                            gridRow: taskIndex + 1,
                            gridColumn: `${task.offset + firstDayGridColumn} / span ${task.span}`,
                            margin: "6px 4px",
                            zIndex: 5,
                            borderRadius: "4px",
                            border: "none",
                            color: "#fff",
                            fontSize: "0.7rem",
                            textAlign: "left",
                            padding: "0 8px",
                            cursor: "pointer",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            alignSelf: "center",
                            minWidth: 0,
                          }}
                          title={`Edit ${task.title}`}
                          type="button"
                        >
                          {task.title}
                          <EditableHoverIndicator className="editable-hover-indicator-compact" />
                        </button>
                      </React.Fragment>
                    ))
                  : null}
              </div>
            );
          })
          )}
        </div>
      ) : (
        <p className="section-copy">
          Add a milestone or create a task to populate the subsystem timeline.
        </p>
      )}

      {tooltipPortalTarget
        ? createPortal(
            <>
              {timelineDayMilestoneUnderlays.map((underlay) => (
                <div
                  aria-hidden="true"
                  key={`timeline-underlay-${underlay.id}`}
                  className="timeline-day-event-underlay"
                  title={underlay.lines.join(", ")}
                  style={{
                    transform: `translate(-50%, -50%) rotate(${underlay.rotationDeg}deg)`,
                    left: `${underlay.geometry.centerX}px`,
                    top: `${underlay.geometry.centerY}px`,
                    color: underlay.color,
                    zIndex: 4,
                  }}
                >
                  {underlay.lines.map((line, index) => (
                    <span
                      className="timeline-day-event-overlay-tooltip-item"
                      key={`${underlay.id}-${line}-${index}`}
                    >
                      {line}
                    </span>
                  ))}
                </div>
              ))}
            </>,
            tooltipPortalTarget,
          )
        : null}

      {hoveredMilestonePopup && hoveredMilestonePopupGeometry && tooltipPortalTarget
        ? createPortal(
            <>
              <div
                aria-hidden="true"
                className="timeline-day-event-overlay-column"
                style={{
                  background: withColumnOverlayTint(hoveredMilestonePopup.background),
                  height: `${hoveredMilestonePopupGeometry.centerY * 2}px`,
                  left: `${hoveredMilestonePopupGeometry.left}px`,
                  top: "0px",
                  width: `${hoveredMilestonePopupGeometry.width}px`,
                }}
              />
              <div
                className="timeline-day-event-overlay-tooltip"
                role="presentation"
                style={{
                  transform: `translate(-50%, -50%) rotate(${hoveredMilestonePopup.rotationDeg}deg)`,
                  left: `${hoveredMilestonePopupGeometry.centerX}px`,
                  top: `${hoveredMilestonePopupGeometry.centerY}px`,
                  color: "#ffffff",
                }}
              >
                {hoveredMilestonePopup.lines.map((line, index) => (
                  <span className="timeline-day-event-overlay-tooltip-item" key={`${line}-${index}`}>
                    {line}
                  </span>
                ))}
              </div>
            </>,
            tooltipPortalTarget,
          )
        : null}

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
                      {bootstrap.subsystems.map((subsystem) => (
                        <option key={subsystem.id} value={subsystem.id}>
                          {subsystem.name}
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




