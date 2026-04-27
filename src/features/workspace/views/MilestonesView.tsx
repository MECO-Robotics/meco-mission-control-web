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
  ColumnFilterDropdown,
  EditableHoverIndicator,
  type FilterSelection,
  FilterDropdown,
  SearchToolbarInput,
  TableCell,
  useFilterChangeMotionClass,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { getStatusPillClassName } from "@/features/workspace/shared";
import {
  formatTaskPlanningState,
  getTaskBlocksTasks,
  getTaskOpenBlockersForTask,
  getTaskPlanningState,
  getTaskWaitingOnTasks,
  groupTasksByPlanningState,
} from "@/features/workspace/shared/taskPlanning";
import {
  getEventProjectIds,
  getMilestoneSubsystemOptions,
  reconcileMilestoneSubsystemIds,
} from "@/features/workspace/shared/eventProjectUtils";
import { formatDate } from "@/lib/appUtils";
import {
  DEFAULT_EVENT_TYPE,
  EVENT_TYPE_STYLES,
} from "@/features/workspace/shared/eventStyles";
import {
  buildDateTime,
  compareDateTimes,
  datePortion,
  localTodayDate,
  timePortion,
} from "@/features/workspace/shared/timelineDateUtils";
import {
  emptyTimelineEventDraft,
  timelineEventDraftFromRecord,
  type TimelineEventDraft,
} from "@/features/workspace/shared/timelineEventHelpers";
import {
  buildMilestoneProjectLabels,
  filterAndSortMilestones,
  formatMilestoneDateTime,
  type MilestoneSortField,
} from "@/features/workspace/views/milestonesViewUtils";

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

type MilestoneDraft = TimelineEventDraft;

const EVENT_TYPE_OPTIONS: { id: EventType; name: string }[] = (
  Object.entries(EVENT_TYPE_STYLES) as [EventType, (typeof EVENT_TYPE_STYLES)[EventType]][]
).map(([id, style]) => ({
  id,
  name: style.label,
}));

export function MilestonesView({
  bootstrap,
  isAllProjectsView,
  onDeleteTimelineEvent,
  onSaveTimelineEvent,
  subsystemsById,
}: MilestonesViewProps) {
  const [sortField, setSortField] = useState<MilestoneSortField>("startDateTime");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [projectFilter, setProjectFilter] = useState<FilterSelection>([]);
  const [typeFilter, setTypeFilter] = useState<FilterSelection>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [eventModalMode, setEventModalMode] = useState<"create" | "edit" | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneDraft>(
    emptyTimelineEventDraft(DEFAULT_EVENT_TYPE),
  );
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("18:00");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventError, setEventError] = useState<string | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  useEffect(() => {
    if (!isAllProjectsView && projectFilter.length > 0) {
      setProjectFilter([]);
    }
  }, [isAllProjectsView, projectFilter]);

  useEffect(() => {
    const projectIds = new Set(bootstrap.projects.map((project) => project.id));
    if (projectFilter.some((projectId) => !projectIds.has(projectId))) {
      setProjectFilter((current) => current.filter((projectId) => projectIds.has(projectId)));
    }
  }, [bootstrap.projects, projectFilter]);

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

  const getDefaultEventProjectIds = () => {
    if (
      isAllProjectsView &&
      projectFilter.length > 0
    ) {
      return projectFilter;
    }

    return scopedProjectIds;
  };

  const selectableSubsystems = useMemo(
    () => getMilestoneSubsystemOptions(bootstrap.subsystems, milestoneDraft.projectIds),
    [bootstrap.subsystems, milestoneDraft.projectIds],
  );

  const showProjectCol = isAllProjectsView;
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

  const processedEvents = useMemo(() => {
    return filterAndSortMilestones({
      events: bootstrap.events,
      isAllProjectsView,
      projectFilter,
      searchFilter,
      sortField,
      sortOrder,
      subsystemsById,
      typeFilter,
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
  const projectLabelByEventId = useMemo(
    () =>
      buildMilestoneProjectLabels(
        bootstrap.events,
        projectsById,
        scopedProjectIds,
        subsystemsById,
      ),
    [bootstrap.events, projectsById, scopedProjectIds, subsystemsById],
  );
  const milestoneFilterMotionClass = useFilterChangeMotionClass([
    isAllProjectsView,
    projectFilter,
    searchFilter,
    sortField,
    sortOrder,
    typeFilter,
  ]);
  const activeEvent = eventModalMode && activeEventId
    ? bootstrap.events.find((event) => event.id === activeEventId) ?? null
    : null;
  const activeEventTasks = useMemo(
    () =>
      activeEvent
        ? bootstrap.tasks.filter((task) => task.targetEventId === activeEvent.id)
        : [],
    [activeEvent, bootstrap.tasks],
  );
  const activeEventIncompleteTasks = useMemo(
    () => activeEventTasks.filter((task) => task.status !== "complete"),
    [activeEventTasks],
  );
  const activeEventCompleteTasks = useMemo(
    () => activeEventTasks.filter((task) => task.status === "complete"),
    [activeEventTasks],
  );
  const eventTaskGroups = useMemo(
    () => groupTasksByPlanningState(activeEventIncompleteTasks, bootstrap),
    [activeEventIncompleteTasks, bootstrap],
  );
  const eventTaskOrder = [
    "blocked",
    "at-risk",
    "waiting-on-dependency",
    "ready",
    "overdue",
  ] as const;

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
    setMilestoneDraft({
      ...emptyTimelineEventDraft(DEFAULT_EVENT_TYPE),
      projectIds: getDefaultEventProjectIds(),
    });
    setEventStartDate(localTodayDate());
    setEventStartTime("18:00");
    setEventEndDate("");
    setEventEndTime("");
    setEventError(null);
  };

  const openEditEventModal = (event: EventRecord) => {
    const eventProjectIds = getEventProjectIds(event, subsystemsById);
    setEventModalMode("edit");
    setActiveEventId(event.id);
    setMilestoneDraft({
      ...timelineEventDraftFromRecord(event),
      projectIds: eventProjectIds.length > 0 ? eventProjectIds : scopedProjectIds,
    });
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
        projectIds: Array.from(new Set(milestoneDraft.projectIds)),
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
      return "";
    }

    return sortOrder === "asc" ? "^" : "v";
  };

  const renderSortLabel = (field: MilestoneSortField, label: string) => {
    const sortIcon = getSortIcon(field);

    return (
      <>
        <span aria-hidden="true" className="table-sort-arrow">
          {sortIcon}
        </span>
        <span>{label}</span>
      </>
    );
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
          <div data-tutorial-target="milestone-search-input">
            <SearchToolbarInput
              ariaLabel="Search milestones"
              onChange={setSearchFilter}
              placeholder="Search milestones..."
              value={searchFilter}
            />
          </div>

          {isAllProjectsView ? (
            <FilterDropdown
              allLabel="All projects"
              ariaLabel="Filter milestones by project"
              className="mobile-filter-control"
              icon={<IconParts />}
              onChange={setProjectFilter}
              options={bootstrap.projects}
              value={projectFilter}
            />
          ) : null}

          <FilterDropdown
            allLabel="All types"
            ariaLabel="Filter milestones by type"
            className="mobile-filter-control"
            icon={<IconTasks />}
            onChange={setTypeFilter}
            options={EVENT_TYPE_OPTIONS}
            value={typeFilter}
          />

          <button
            aria-label="Add milestone"
            className="primary-action queue-toolbar-action"
            data-tutorial-target="create-milestone-button"
            onClick={openCreateEventModal}
            title="Add milestone"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className={`table-shell ${milestoneFilterMotionClass}`}>
        <div
          className="queue-table queue-table-header"
          style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
        >
          {showProjectCol ? (
            <span className="table-column-header-cell">
              <span className="table-column-title">Project</span>
              <ColumnFilterDropdown
                allLabel="All projects"
                ariaLabel="Filter milestones by project"
                onChange={setProjectFilter}
                options={bootstrap.projects}
                value={projectFilter}
              />
            </span>
          ) : null}
          <button className="table-sort-button" onClick={() => toggleSort("title")} type="button">
            {renderSortLabel("title", "Milestone")}
          </button>
          <span className="table-column-header-cell">
            <button className="table-sort-button" onClick={() => toggleSort("type")} type="button">
              {renderSortLabel("type", "Type")}
            </button>
            <ColumnFilterDropdown
              allLabel="All types"
              ariaLabel="Filter milestones by type"
              onChange={setTypeFilter}
              options={EVENT_TYPE_OPTIONS}
              value={typeFilter}
            />
          </span>
          <button
            className="table-sort-button"
            onClick={() => toggleSort("startDateTime")}
            type="button"
          >
            {renderSortLabel("startDateTime", "Start")}
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
              data-tutorial-target="edit-milestone-row"
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
                  className="pill status-pill milestone-type-pill"
                  style={{
                    "--milestone-type-chip-bg": eventStyle.chipBackground,
                    "--milestone-type-chip-border": eventStyle.columnBorder,
                    "--milestone-type-chip-text": eventStyle.chipText,
                    "--milestone-type-chip-bg-dark": eventStyle.darkChipBackground,
                    "--milestone-type-chip-border-dark": eventStyle.darkColumnBorder,
                    "--milestone-type-chip-text-dark": eventStyle.darkChipText,
                  } as CSSProperties}
                >
                  {eventStyle.label}
                </span>
              </TableCell>
              <TableCell label="Start">{formatMilestoneDateTime(event.startDateTime)}</TableCell>
              <TableCell label="End">
                {event.endDateTime ? formatMilestoneDateTime(event.endDateTime) : "No end"}
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
                data-tutorial-target={
                  eventModalMode === "create"
                    ? "milestone-create-modal"
                    : "milestone-edit-modal"
                }
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

                  {eventModalMode === "edit" && activeEvent ? (
                    <div className="field modal-wide">
                      <span style={{ color: "var(--text-title)" }}>Readiness</span>
                      {activeEventTasks.length > 0 ? (
                        <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
                          {eventTaskOrder.map((state) => {
                            const tasks = eventTaskGroups[state];
                            if (tasks.length === 0) {
                              return null;
                            }

                            return (
                              <section key={state} style={{ display: "grid", gap: "0.5rem" }}>
                                <h3
                                  style={{
                                    margin: 0,
                                    color: "var(--text-title)",
                                    fontSize: "0.9rem",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {formatTaskPlanningState(state)} ({tasks.length})
                                </h3>
                                <div style={{ display: "grid", gap: "0.5rem" }}>
                                  {tasks.map((task) => {
                                    const taskPlanningState = getTaskPlanningState(task, bootstrap);
                                    const blockers = getTaskOpenBlockersForTask(task.id, bootstrap);
                                    const waitingOn = getTaskWaitingOnTasks(task.id, bootstrap);
                                    const blocks = getTaskBlocksTasks(task.id, bootstrap);

                                    return (
                                      <div
                                        key={task.id}
                                        style={{
                                          display: "grid",
                                          gap: "0.25rem",
                                          padding: "0.75rem",
                                          border: "1px solid var(--border-base)",
                                          borderRadius: "12px",
                                          background: "var(--bg-row-alt)",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "0.5rem",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                          }}
                                        >
                                          <strong style={{ color: "var(--text-title)" }}>{task.title}</strong>
                                          <span className={getStatusPillClassName(taskPlanningState)}>
                                            {formatTaskPlanningState(taskPlanningState)}
                                          </span>
                                        </div>
                                        <small style={{ color: "var(--text-copy)" }}>
                                          Due {formatDate(task.dueDate)}
                                          {blockers.length > 0 ? ` · blocked by ${blockers.length}` : ""}
                                          {waitingOn.length > 0 ? ` · waiting on ${waitingOn.length}` : ""}
                                          {blocks.length > 0 ? ` · blocks ${blocks.length}` : ""}
                                        </small>
                                      </div>
                                    );
                                  })}
                                </div>
                              </section>
                            );
                          })}
                          {activeEventCompleteTasks.length > 0 ? (
                            <section style={{ display: "grid", gap: "0.5rem" }}>
                              <h3
                                style={{
                                  margin: 0,
                                  color: "var(--text-title)",
                                  fontSize: "0.9rem",
                                  textTransform: "capitalize",
                                }}
                              >
                                Complete ({activeEventCompleteTasks.length})
                              </h3>
                              <div style={{ display: "grid", gap: "0.5rem" }}>
                                {activeEventCompleteTasks.map((task) => {
                                  const taskPlanningState = getTaskPlanningState(task, bootstrap);
                                  const blockers = getTaskOpenBlockersForTask(task.id, bootstrap);
                                  const waitingOn = getTaskWaitingOnTasks(task.id, bootstrap);
                                  const blocks = getTaskBlocksTasks(task.id, bootstrap);

                                  return (
                                    <div
                                      key={task.id}
                                      style={{
                                        display: "grid",
                                        gap: "0.25rem",
                                        padding: "0.75rem",
                                        border: "1px solid var(--border-base)",
                                        borderRadius: "12px",
                                        background: "var(--bg-row-alt)",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: "0.5rem",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        <strong style={{ color: "var(--text-title)" }}>{task.title}</strong>
                                        <span className={getStatusPillClassName(taskPlanningState)}>
                                          {formatTaskPlanningState(taskPlanningState)}
                                        </span>
                                      </div>
                                      <small style={{ color: "var(--text-copy)" }}>
                                        Due {formatDate(task.dueDate)}
                                        {blockers.length > 0 ? ` · blocked by ${blockers.length}` : ""}
                                        {waitingOn.length > 0 ? ` · waiting on ${waitingOn.length}` : ""}
                                        {blocks.length > 0 ? ` · blocks ${blocks.length}` : ""}
                                      </small>
                                    </div>
                                  );
                                })}
                              </div>
                            </section>
                          ) : null}
                        </div>
                      ) : (
                        <p style={{ margin: "0.25rem 0 0", color: "var(--text-copy)" }}>
                          No tasks currently target this milestone.
                        </p>
                      )}
                    </div>
                  ) : null}

                  <label className="field modal-wide">
                    <span style={{ color: "var(--text-title)" }}>Related projects</span>
                    <select
                      multiple
                      onChange={(event) =>
                        setMilestoneDraft((current) => {
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
                        minHeight: "5rem",
                      }}
                      value={milestoneDraft.projectIds}
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
                      {selectableSubsystems.map((subsystem) => (
                        <option key={subsystem.id} value={subsystem.id}>
                          {projectsById[subsystem.projectId]?.name
                            ? `${projectsById[subsystem.projectId].name} - ${subsystem.name}`
                            : subsystem.name}
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
