import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { IconParts, IconTasks } from "@/components/shared";
import type {
  BootstrapPayload,
  EventPayload,
  EventRecord,
  EventType,
} from "@/types";
import {
  EditableHoverIndicator,
  FilterDropdown,
  SearchToolbarInput,
  TableCell,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";

type MilestoneSortField = "startDateTime" | "title" | "type";

interface MilestonesViewProps {
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onDeleteTimelineEvent: (eventId: string) => Promise<void>;
  onSaveTimelineEvent: (
    mode: "create" | "edit",
    eventId: string | null,
    payload: EventPayload,
  ) => Promise<void>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

interface EventStyle {
  label: string;
  columnBorder: string;
  chipBackground: string;
  chipText: string;
}

interface MilestoneDraft {
  title: string;
  type: EventType;
  isExternal: boolean;
  description: string;
  relatedSubsystemIds: string[];
}

const DEFAULT_EVENT_TYPE: EventType = "internal-review";
const EVENT_TYPE_STYLES: Record<EventType, EventStyle> = {
  "drive-practice": {
    label: "Drive practice",
    columnBorder: "rgba(22, 71, 142, 0.32)",
    chipBackground: "rgba(22, 71, 142, 0.18)",
    chipText: "#0d2e5c",
  },
  competition: {
    label: "Competition",
    columnBorder: "rgba(76, 121, 207, 0.35)",
    chipBackground: "rgba(76, 121, 207, 0.2)",
    chipText: "#1f3f7a",
  },
  deadline: {
    label: "Deadline",
    columnBorder: "rgba(234, 28, 45, 0.36)",
    chipBackground: "rgba(234, 28, 45, 0.18)",
    chipText: "#8e1120",
  },
  "internal-review": {
    label: "Internal review",
    columnBorder: "rgba(36, 104, 71, 0.34)",
    chipBackground: "rgba(36, 104, 71, 0.18)",
    chipText: "#1d5338",
  },
  demo: {
    label: "Demo",
    columnBorder: "rgba(84, 98, 123, 0.35)",
    chipBackground: "rgba(84, 98, 123, 0.22)",
    chipText: "#36475f",
  },
};

const EVENT_TYPE_OPTIONS: { id: EventType; name: string }[] = (
  Object.entries(EVENT_TYPE_STYLES) as [EventType, EventStyle][]
).map(([id, style]) => ({
  id,
  name: style.label,
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
  return new Date(a).getTime() - new Date(b).getTime();
}

function localTodayDate() {
  const now = new Date();
  const offsetAdjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return offsetAdjusted.toISOString().slice(0, 10);
}

function emptyMilestoneDraft(): MilestoneDraft {
  return {
    title: "",
    type: DEFAULT_EVENT_TYPE,
    isExternal: false,
    description: "",
    relatedSubsystemIds: [],
  };
}

function milestoneDraftFromRecord(record: EventRecord): MilestoneDraft {
  return {
    title: record.title,
    type: record.type,
    isExternal: record.isExternal,
    description: record.description,
    relatedSubsystemIds: record.relatedSubsystemIds,
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MilestonesView({
  bootstrap,
  isAllProjectsView,
  onDeleteTimelineEvent,
  onSaveTimelineEvent,
  subsystemsById,
}: MilestonesViewProps) {
  const [sortField, setSortField] = useState<MilestoneSortField>("startDateTime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [eventModalMode, setEventModalMode] = useState<"create" | "edit" | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneDraft>(emptyMilestoneDraft);
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("18:00");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventError, setEventError] = useState<string | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

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
  const gridTemplate = [
    showProjectCol ? "1fr" : null,
    "minmax(220px, 2.5fr)",
    "1fr",
    "1fr",
    "1fr",
    "1.5fr",
  ]
    .filter(Boolean)
    .join(" ");

  const projectLabelByEventId = useMemo(() => {
    const labels: Record<string, string> = {};

    bootstrap.events.forEach((event) => {
      const relatedProjectIds = Array.from(
        new Set(
          event.relatedSubsystemIds
            .map((subsystemId) => subsystemsById[subsystemId]?.projectId ?? null)
            .filter((projectId): projectId is string => Boolean(projectId)),
        ),
      );

      if (relatedProjectIds.length === 0) {
        labels[event.id] = "All projects";
      } else if (relatedProjectIds.length === 1) {
        labels[event.id] = projectsById[relatedProjectIds[0]]?.name ?? "Unknown project";
      } else {
        const firstProjectName =
          projectsById[relatedProjectIds[0]]?.name ?? "Multiple projects";
        labels[event.id] = `${firstProjectName} +${relatedProjectIds.length - 1}`;
      }
    });

    return labels;
  }, [bootstrap.events, projectsById, subsystemsById]);

  const processedEvents = useMemo(() => {
    let result = [...bootstrap.events];

    if (isAllProjectsView && projectFilter !== "all") {
      result = result.filter((event) => {
        if (event.relatedSubsystemIds.length === 0) {
          return true;
        }

        return event.relatedSubsystemIds.some(
          (subsystemId) => subsystemsById[subsystemId]?.projectId === projectFilter,
        );
      });
    }

    if (typeFilter !== "all") {
      result = result.filter((event) => event.type === typeFilter);
    }

    if (searchFilter.trim() !== "") {
      const search = searchFilter.toLowerCase();

      result = result.filter((event) => {
        const relatedSubsystemNames = event.relatedSubsystemIds
          .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
          .join(" ")
          .toLowerCase();

        return (
          event.title.toLowerCase().includes(search) ||
          event.description.toLowerCase().includes(search) ||
          relatedSubsystemNames.includes(search)
        );
      });
    }

    const readSortValue = (event: EventRecord): string => {
      if (sortField === "title") {
        return event.title.toLowerCase();
      }

      if (sortField === "type") {
        return EVENT_TYPE_STYLES[event.type].label;
      }

      return event.startDateTime;
    };

    return result.sort((left, right) => {
      const leftValue = readSortValue(left);
      const rightValue = readSortValue(right);

      if (leftValue < rightValue) {
        return sortOrder === "asc" ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [
    bootstrap.events,
    isAllProjectsView,
    projectFilter,
    searchFilter,
    sortField,
    sortOrder,
    subsystemsById,
    typeFilter,
  ]);

  const closeEventModal = () => {
    setEventModalMode(null);
    setActiveEventId(null);
    setEventError(null);
    setIsSavingEvent(false);
    setIsDeletingEvent(false);
  };

  const openCreateEventModal = () => {
    setEventModalMode("create");
    setActiveEventId(null);
    setMilestoneDraft(emptyMilestoneDraft());
    setEventStartDate(localTodayDate());
    setEventStartTime("18:00");
    setEventEndDate("");
    setEventEndTime("");
    setEventError(null);
  };

  const openEditEventModal = (event: EventRecord) => {
    setEventModalMode("edit");
    setActiveEventId(event.id);
    setMilestoneDraft(milestoneDraftFromRecord(event));
    setEventStartDate(datePortion(event.startDateTime));
    setEventStartTime(timePortion(event.startDateTime));
    setEventEndDate(event.endDateTime ? datePortion(event.endDateTime) : "");
    setEventEndTime(event.endDateTime ? timePortion(event.endDateTime) : "");
    setEventError(null);
  };

  const handleEventSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventModalMode) {
      return;
    }

    if (!eventStartDate) {
      setEventError("Start date is required.");
      return;
    }

    const normalizedTitle = milestoneDraft.title.trim();
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
        type: milestoneDraft.type,
        startDateTime,
        endDateTime,
        isExternal: milestoneDraft.isExternal,
        description: milestoneDraft.description.trim(),
        relatedSubsystemIds: Array.from(new Set(milestoneDraft.relatedSubsystemIds)),
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

  const toggleSort = (field: MilestoneSortField) => {
    if (sortField === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortOrder("asc");
  };

  const getSortIcon = (field: MilestoneSortField) => {
    if (sortField !== field) {
      return null;
    }

    return sortOrder === "asc" ? " ^" : " v";
  };

  const modalPortalTarget =
    typeof document !== "undefined"
      ? ((document.querySelector(".page-shell") as HTMLElement | null) ?? document.body)
      : null;

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Milestones</h2>
          <p className="section-copy filter-copy">
            {processedEvents.length === 1
              ? "1 milestone matches the current filters."
              : `${processedEvents.length} milestones match the current filters.`}
          </p>
        </div>
        <div className="panel-actions filter-toolbar milestones-toolbar">
          <SearchToolbarInput
            ariaLabel="Search milestones"
            onChange={setSearchFilter}
            placeholder="Search milestones..."
            value={searchFilter}
          />

          {isAllProjectsView ? (
            <FilterDropdown
              allLabel="All projects"
              ariaLabel="Filter milestones by project"
              icon={<IconParts />}
              onChange={setProjectFilter}
              options={bootstrap.projects}
              value={projectFilter}
            />
          ) : null}

          <FilterDropdown
            allLabel="All types"
            ariaLabel="Filter milestones by type"
            icon={<IconTasks />}
            onChange={setTypeFilter}
            options={EVENT_TYPE_OPTIONS}
            value={typeFilter}
          />

          <button
            aria-label="Add milestone"
            className="primary-action queue-toolbar-action"
            onClick={openCreateEventModal}
            title="Add milestone"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div
          className="queue-table queue-table-header"
          style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
        >
          {showProjectCol ? <span>Project</span> : null}
          <button className="table-sort-button" onClick={() => toggleSort("title")} type="button">
            Milestone{getSortIcon("title")}
          </button>
          <button className="table-sort-button" onClick={() => toggleSort("type")} type="button">
            Type{getSortIcon("type")}
          </button>
          <button
            className="table-sort-button"
            onClick={() => toggleSort("startDateTime")}
            type="button"
          >
            Start{getSortIcon("startDateTime")}
          </button>
          <span>End</span>
          <span>Related subsystems</span>
        </div>

        {processedEvents.map((event) => {
          const eventStyle = EVENT_TYPE_STYLES[event.type];
          const relatedSubsystems = event.relatedSubsystemIds
            .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "Unknown subsystem")
            .join(", ");

          return (
            <button
              className="queue-table queue-row editable-hover-target editable-hover-target-row"
              key={event.id}
              onClick={() => openEditEventModal(event)}
              style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
              type="button"
            >
              {showProjectCol ? (
                <TableCell label="Project">
                  {projectLabelByEventId[event.id] ?? "All projects"}
                </TableCell>
              ) : null}
              <span
                className="queue-title table-cell table-cell-primary queue-title-stack"
                data-label="Milestone"
              >
                <strong>{event.title}</strong>
                <small>{event.description.trim() || "No description"}</small>
              </span>
              <TableCell label="Type" valueClassName="table-cell-pill">
                <span
                  className="pill status-pill"
                  style={{
                    background: eventStyle.chipBackground,
                    border: `1px solid ${eventStyle.columnBorder}`,
                    color: eventStyle.chipText,
                  }}
                >
                  {eventStyle.label}
                </span>
              </TableCell>
              <TableCell label="Start">{formatDateTime(event.startDateTime)}</TableCell>
              <TableCell label="End">
                {event.endDateTime ? formatDateTime(event.endDateTime) : "No end"}
              </TableCell>
              <TableCell label="Related subsystems">
                {relatedSubsystems.length > 0 ? relatedSubsystems : "All subsystems"}
              </TableCell>
              <EditableHoverIndicator />
            </button>
          );
        })}

        {processedEvents.length === 0 ? (
          <p className="empty-state">No milestones match the current filters.</p>
        ) : null}
      </div>

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
                        setMilestoneDraft((current) => ({
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
                      value={milestoneDraft.title}
                    />
                  </label>

                  <label className="field">
                    <span style={{ color: "var(--text-title)" }}>Type</span>
                    <select
                      onChange={(event) =>
                        setMilestoneDraft((current) => ({
                          ...current,
                          type: event.target.value as EventType,
                        }))
                      }
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                      }}
                      value={milestoneDraft.type}
                    >
                      {EVENT_TYPE_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
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
                        setMilestoneDraft((current) => ({
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
                      value={milestoneDraft.description}
                    />
                  </label>

                  <label className="field modal-wide">
                    <span style={{ color: "var(--text-title)" }}>Related subsystems</span>
                    <select
                      multiple
                      onChange={(event) =>
                        setMilestoneDraft((current) => ({
                          ...current,
                          relatedSubsystemIds: Array.from(
                            event.currentTarget.selectedOptions,
                            (option) => option.value,
                          ),
                        }))
                      }
                      style={{
                        background: "var(--bg-row-alt)",
                        color: "var(--text-title)",
                        border: "1px solid var(--border-base)",
                        minHeight: "7rem",
                      }}
                      value={milestoneDraft.relatedSubsystemIds}
                    >
                      {bootstrap.subsystems.map((subsystem) => (
                        <option key={subsystem.id} value={subsystem.id}>
                          {subsystem.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field modal-wide" style={{ display: "flex", alignItems: "center" }}>
                    <input
                      checked={milestoneDraft.isExternal}
                      onChange={(event) =>
                        setMilestoneDraft((current) => ({
                          ...current,
                          isExternal: event.target.checked,
                        }))
                      }
                      style={{ width: "auto" }}
                      type="checkbox"
                    />
                    <span style={{ color: "var(--text-title)" }}>External milestone/event</span>
                  </label>

                  {eventError ? (
                    <p className="section-copy" style={{ color: "var(--official-red)" }}>
                      {eventError}
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
                          : "Save milestone"}
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
}




