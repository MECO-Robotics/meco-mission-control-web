import React, { useEffect, useMemo, useState } from "react";
import { IconParts, IconPerson, IconTasks } from "../../../components/shared/Icons";
import { dateDiffInDays } from "../../../lib/appUtils";
import type {
  BootstrapPayload,
  EventPayload,
  EventRecord,
  EventType,
  TaskRecord,
} from "../../../types";
import { EditableHoverIndicator, FilterDropdown } from "../shared/WorkspaceViewShared";
import { WORKSPACE_PANEL_CLASS } from "../shared/workspaceTypes";

interface TimelineViewProps {
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  activePersonFilter: string;
  setActivePersonFilter: (value: string) => void;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord) => void;
  openCreateTaskModal: () => void;
  onSaveTimelineEvent: (
    mode: "create" | "edit",
    eventId: string | null,
    payload: EventPayload,
  ) => Promise<void>;
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

const PROJECT_COLUMN_WIDTH = 112;
const SUBSYSTEM_COLUMN_WIDTH = 104;
const TASK_LABEL_COLUMN_WIDTH = 148;
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
  onSaveTimelineEvent,
}) => {
  const [viewInterval, setViewInterval] = useState<"all" | "week" | "month">("all");
  const [projectFilter, setProjectFilter] = useState("all");
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

  useEffect(() => {
    if (!isAllProjectsView && projectFilter !== "all") {
      setProjectFilter("all");
    }
  }, [isAllProjectsView, projectFilter]);

  useEffect(() => {
    if (
      projectFilter !== "all" &&
      !bootstrap.projects.some((project) => project.id === projectFilter)
    ) {
      setProjectFilter("all");
    }
  }, [bootstrap.projects, projectFilter]);

  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
  );

  const showProjectCol = isAllProjectsView && projectFilter === "all";
  const subsystemColumnIndex = showProjectCol ? 2 : 1;
  const taskLabelColumnIndex = showProjectCol ? 3 : 2;
  const firstDayGridColumn = showProjectCol ? 4 : 3;
  const subsystemStickyLeft = showProjectCol ? PROJECT_COLUMN_WIDTH : 0;
  const taskLabelStickyLeft = showProjectCol
    ? PROJECT_COLUMN_WIDTH + SUBSYSTEM_COLUMN_WIDTH
    : SUBSYSTEM_COLUMN_WIDTH;
  const frozenHeaderWidth = SUBSYSTEM_COLUMN_WIDTH + TASK_LABEL_COLUMN_WIDTH;

  const scopedTasks = useMemo(() => {
    if (isAllProjectsView && projectFilter !== "all") {
      return bootstrap.tasks.filter((task) => task.projectId === projectFilter);
    }

    return bootstrap.tasks;
  }, [bootstrap.tasks, isAllProjectsView, projectFilter]);

  const scopedSubsystems = useMemo(() => {
    if (isAllProjectsView && projectFilter !== "all") {
      return bootstrap.subsystems.filter((subsystem) => subsystem.projectId === projectFilter);
    }

    return bootstrap.subsystems;
  }, [bootstrap.subsystems, isAllProjectsView, projectFilter]);

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
            projectName: string;
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
        : scopedSubsystems.map((subsystem) => {
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
              projectName: projectsById[subsystem.projectId]?.name ?? "Unknown",
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
    return `${showProjectCol ? `${PROJECT_COLUMN_WIDTH}px ` : ""}${SUBSYSTEM_COLUMN_WIDTH}px ${TASK_LABEL_COLUMN_WIDTH}px repeat(${timeline.days.length}, ${dayWidth})`;
  }, [showProjectCol, timeline.days.length, viewInterval]);

  const gridMinWidth = useMemo(() => {
    const minDayWidth = viewInterval === "month" ? 28 : 44;
    return (
      (showProjectCol ? PROJECT_COLUMN_WIDTH : 0) +
      SUBSYSTEM_COLUMN_WIDTH +
      TASK_LABEL_COLUMN_WIDTH +
      timeline.days.length * minDayWidth
    );
  }, [showProjectCol, timeline.days.length, viewInterval]);

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

  const toggleSubsystem = (id: string) => {
    setCollapsedSubsystems((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const closeEventModal = () => {
    setEventModalMode(null);
    setActiveEventId(null);
    setActiveEventDay(null);
    setEventError(null);
    setIsSavingEvent(false);
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

  const activePersonFilterLabel =
    activePersonFilter === "all"
      ? "All roster"
      : membersById[activePersonFilter]?.name ?? "Selected person";

  const activeDayEvents = activeEventDay ? dayEventsByDate[activeEventDay] ?? [] : [];

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
            {isAllProjectsView ? (
              <FilterDropdown
                allLabel="All projects"
                ariaLabel="Filter timeline by project"
                icon={<IconParts />}
                onChange={setProjectFilter}
                options={bootstrap.projects}
                value={projectFilter}
              />
            ) : null}
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
            className="secondary-action queue-toolbar-action"
            onClick={() => openCreateEventModalForDay(localTodayDate())}
            title="Add milestone"
            type="button"
          >
            Add milestone
          </button>
          <button
            className="primary-action queue-toolbar-action"
            onClick={openCreateTaskModal}
            title="Add task"
            type="button"
          >
            Add task
          </button>
        </div>
      </div>

      {timeline.days.length ? (
        <div
          className="timeline-shell"
          style={{
            overflowX: "auto",
            padding: 0,
            background: "var(--bg-panel)",
            borderRadius: 0,
            border: "1px solid var(--border-base)",
          }}
        >
          <div
            style={{
              display: "grid",
              width: "100%",
              minWidth: `${gridMinWidth}px`,
              gridTemplateColumns: timelineGridTemplate,
              boxSizing: "border-box",
            }}
          >
            <div
              className="sticky-label"
              style={{
                gridRow: "1 / span 2",
                gridColumn: `${subsystemColumnIndex} / span 2`,
                width: `${frozenHeaderWidth}px`,
                minWidth: `${frozenHeaderWidth}px`,
                maxWidth: `${frozenHeaderWidth}px`,
                padding: "10px 12px",
                fontWeight: "bold",
                borderRight: "1px solid var(--border-base)",
                borderBottom: "1px solid var(--border-base)",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
                position: "sticky",
                left: `${subsystemStickyLeft}px`,
                zIndex: 15,
                background: "var(--bg-panel)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Subsystem / Task
            </div>

            {showProjectCol ? (
              <div
                className="sticky-label"
                style={{
                  gridRow: "1 / span 2",
                  gridColumn: "1",
                  width: `${PROJECT_COLUMN_WIDTH}px`,
                  minWidth: `${PROJECT_COLUMN_WIDTH}px`,
                  maxWidth: `${PROJECT_COLUMN_WIDTH}px`,
                  padding: "10px 12px",
                  fontWeight: "bold",
                  borderRight: "1px solid var(--border-base)",
                  borderBottom: "1px solid var(--border-base)",
                  display: "flex",
                  alignItems: "center",
                  boxSizing: "border-box",
                  position: "sticky",
                  left: 0,
                  zIndex: 16,
                  background: "var(--bg-panel)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Project
              </div>
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
              const eventsOnDayLabel = eventsOnDay.map((milestone) => milestone.title).join(", ");
              const dayStyle = primaryEvent ? EVENT_TYPE_STYLES[primaryEvent.type] : null;

              return (
                <div
                  className="timeline-day"
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
                  {eventsOnDay.length ? (
                    <span
                      className={`timeline-day-event-chip${eventsOnDay.length > 1 ? " has-multiple" : ""}`}
                      style={{
                        background: dayStyle?.chipBackground,
                        color: dayStyle?.chipText,
                      }}
                      title={eventsOnDayLabel}
                      data-full-text={eventsOnDayLabel}
                    >
                      {eventsOnDay.length === 1
                        ? primaryEvent.title
                        : `${eventsOnDay.length} milestones`}
                      {eventsOnDay.length > 1 ? (
                        <span className="timeline-day-event-tooltip" role="presentation">
                          {eventsOnDay.map((milestone, eventIndex) => (
                            <span
                              className="timeline-day-event-tooltip-item"
                              key={`${milestone.id}-${eventIndex}`}
                            >
                              {milestone.title}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {timeline.subsystemRows.map((subsystem, subsystemIndex) => {
            const collapsed = collapsedSubsystems[subsystem.id] ?? false;
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
                <div
                  style={{
                    gridRow: collapsed ? "1" : `1 / span ${taskCount}`,
                    gridColumn: collapsed
                      ? `${subsystemColumnIndex} / span 2`
                      : `${subsystemColumnIndex}`,
                    position: "sticky",
                    left: `${subsystemStickyLeft}px`,
                    zIndex: 8,
                    background: groupBackground,
                    borderRight: "1px solid var(--border-base)",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: collapsed ? "center" : "flex-start",
                    minHeight: "44px",
                    padding: collapsed ? "0 12px" : "10px 10px",
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}
                >
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
                      marginRight: "6px",
                      flexShrink: 0,
                    }}
                  >
                    {collapsed ? "\u25B6" : "\u25BC"}
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        color: "var(--text-title)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {subsystem.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: "normal",
                        color: "var(--text-copy)",
                      }}
                    >
                      {subsystem.completeCount}/{subsystem.taskCount}
                    </div>
                  </div>
                </div>

                {showProjectCol ? (
                  <div
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
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                    title={subsystem.projectName}
                  >
                    {subsystem.projectName}
                  </div>
                ) : null}

                {!collapsed ? (
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
                      return (
                        <div
                          key={day}
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

                {!collapsed &&
                  subsystem.tasks.map((task, taskIndex) => (
                    <React.Fragment key={task.id}>
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
                          overflow: "hidden",
                          borderTop:
                            taskIndex === 0 ? "none" : "1px solid var(--border-base)",
                          borderRadius: 0,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                        type="button"
                      >
                        <strong
                          style={{
                            display: "block",
                            color: "var(--text-title)",
                            lineHeight: "1.2",
                          }}
                        >
                          {task.title}
                        </strong>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-copy)" }}>
                          {(task.ownerId ? membersById[task.ownerId]?.name : null) ??
                            "Unassigned"}
                        </span>
                      </button>
                      {timeline.days.map((day, dayIndex) => {
                        const dayStyle = getColumnStyle(day);
                        return (
                          <div
                            key={day}
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
                  ))}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="section-copy">
          Add a milestone or create a task to populate the subsystem timeline.
        </p>
      )}

      {eventModalMode ? (
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
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
          >
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
                  Timeline milestone
                </p>
                <h2 style={{ color: "var(--text-title)" }}>
                  {eventModalMode === "create" ? "Add milestone" : "Edit milestone"}
                </h2>
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
                <button
                  className="secondary-action"
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
                <button className="primary-action" disabled={isSavingEvent} type="submit">
                  {isSavingEvent
                    ? "Saving..."
                    : eventModalMode === "create"
                      ? "Add milestone"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
};
