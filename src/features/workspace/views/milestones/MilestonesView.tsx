import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { BootstrapPayload, EventPayload, EventRecord } from "@/types";
import { formatFilterSelectionLabel, type FilterSelection, useFilterChangeMotionClass } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { groupTasksByPlanningState } from "@/features/workspace/shared/taskPlanning";
import {
  getEventProjectIds,
  getMilestoneSubsystemOptions,
} from "@/features/workspace/shared/eventProjectUtils";
import { DEFAULT_EVENT_TYPE } from "@/features/workspace/shared/eventStyles";
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
  type MilestoneSortField,
} from "./milestonesViewUtils";
import { MilestoneKanbanBoard } from "./MilestoneKanbanBoard";
import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";
import { MilestonesToolbar } from "./MilestonesToolbar";
import { MilestonesEventModal } from "./MilestonesEventModal";

interface MilestonesViewProps {
  activePersonFilter: FilterSelection;
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

export function MilestonesView({
  activePersonFilter,
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
    if (isAllProjectsView && projectFilter.length > 0) {
      return projectFilter;
    }

    return scopedProjectIds;
  };

  const selectableSubsystems = useMemo(
    () => getMilestoneSubsystemOptions(bootstrap.subsystems, milestoneDraft.projectIds),
    [bootstrap.subsystems, milestoneDraft.projectIds],
  );

  const processedEvents = useMemo(() => {
    return filterAndSortMilestones({
      activePersonFilter,
      events: bootstrap.events,
      isAllProjectsView,
      projectFilter,
      searchFilter,
      sortField,
      sortOrder,
      tasks: bootstrap.tasks,
      subsystemsById,
      typeFilter,
    });
  }, [
    activePersonFilter,
    bootstrap.events,
    bootstrap.tasks,
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
    activePersonFilter,
    isAllProjectsView,
    projectFilter,
    searchFilter,
    sortField,
    sortOrder,
    typeFilter,
  ]);
  const activePersonFilterLabel = formatFilterSelectionLabel(
    "All roster",
    bootstrap.members,
    activePersonFilter,
  );
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
  const activeEventCompleteTasks = useMemo(
    () => activeEventTasks.filter((task) => task.status === "complete"),
    [activeEventTasks],
  );
  const eventTaskGroups = useMemo(
    () =>
      groupTasksByPlanningState(
        activeEventTasks.filter((task) => task.status !== "complete"),
        bootstrap,
      ),
    [activeEventTasks, bootstrap],
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

  const modalPortalTarget =
    typeof document !== "undefined"
      ? ((document.querySelector(".page-shell") as HTMLElement | null) ?? document.body)
      : null;

  return (
    <section className={`panel dense-panel milestone-view ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Milestones</h2>
          <p className="section-copy filter-copy">
            {processedEvents.length === 1
              ? "1 milestone matches the current filters."
              : `${processedEvents.length} milestones match the current filters.`}
            {activePersonFilter.length > 0
              ? ` Only milestones linked to tasks assigned to or mentored by ${activePersonFilterLabel}.`
              : ""}
          </p>
        </div>
        <MilestonesToolbar
          isAllProjectsView={isAllProjectsView}
          onAddMilestone={openCreateEventModal}
          projectFilter={projectFilter}
          projects={bootstrap.projects}
          searchFilter={searchFilter}
          setProjectFilter={setProjectFilter}
          setSearchFilter={setSearchFilter}
          setSortField={setSortField}
          setSortOrder={setSortOrder}
          setTypeFilter={setTypeFilter}
          sortField={sortField}
          sortOrder={sortOrder}
          typeFilter={typeFilter}
        />
      </div>

      {processedEvents.length > 0 ? (
        <KanbanScrollFrame motionClassName={milestoneFilterMotionClass}>
          <MilestoneKanbanBoard
            events={processedEvents}
            onOpenEvent={openEditEventModal}
            projectLabelByEventId={projectLabelByEventId}
            subsystemsById={subsystemsById}
          />
        </KanbanScrollFrame>
      ) : (
        <p className="empty-state">No milestones match the current filters.</p>
      )}

      <MilestonesEventModal
        activeEvent={activeEvent}
        activeEventCompleteTasks={activeEventCompleteTasks}
        activeEventTasks={activeEventTasks}
        bootstrap={bootstrap}
        eventError={eventError}
        eventModalMode={eventModalMode}
        eventStartDate={eventStartDate}
        eventStartTime={eventStartTime}
        eventEndDate={eventEndDate}
        eventEndTime={eventEndTime}
        eventTaskGroups={eventTaskGroups}
        eventTaskOrder={eventTaskOrder}
        isDeletingEvent={isDeletingEvent}
        isSavingEvent={isSavingEvent}
        milestoneDraft={milestoneDraft}
        modalPortalTarget={modalPortalTarget}
        onClose={closeEventModal}
        onDelete={handleEventDelete}
        onSubmit={handleEventSubmit}
        projectsById={projectsById}
        selectableSubsystems={selectableSubsystems}
        setEventEndDate={setEventEndDate}
        setEventEndTime={setEventEndTime}
        setEventStartDate={setEventStartDate}
        setEventStartTime={setEventStartTime}
        setMilestoneDraft={setMilestoneDraft}
        subsystemsById={subsystemsById}
      />
    </section>
  );
}
