import { useMemo, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { MilestonesMilestoneModal } from "@/features/workspace/views/milestones/MilestonesEventModal";
import { useMilestonesMilestoneModalState } from "@/features/workspace/views/milestones/sections/useMilestonesEventModalState";
import { TaskCalendarFilterToolbar } from "./TaskCalendarFilterToolbar";
import { TaskCalendarLegend } from "./TaskCalendarLegend";
import {
  createMonthCells,
  formatDateKey,
  sortTaskCalendarEvents,
  toEventDateKey,
  type TaskCalendarSortMode,
  WEEKDAY_LABELS,
} from "./taskCalendarLayout";
import {
  buildTaskCalendarEvents,
  type TaskCalendarEvent,
  type TaskCalendarEventType,
} from "./taskCalendarEvents";

interface TaskCalendarViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  onTaskDetailOpen: (task: TaskRecord) => void;
  onTaskEditCanceled?: () => void;
  onTaskEditSaved?: () => void;
}

function eventTypeClassName(event: TaskCalendarEvent) {
  return `task-calendar-day-event-${event.extendedProps.type}`;
}

export function TaskCalendarView({
  activePersonFilter,
  bootstrap,
  isAllProjectsView,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  onTaskDetailOpen,
  onTaskEditCanceled = () => {},
  onTaskEditSaved = () => {},
}: TaskCalendarViewProps) {
  const [eventFilter, setEventFilter] = useState<"all" | TaskCalendarEventType>("all");
  const [sortMode, setSortMode] = useState<TaskCalendarSortMode>("date");
  const [monthCursor, setMonthCursor] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const todayDateKey = useMemo(() => formatDateKey(new Date()), []);
  const projectsById = useMemo(
    () => Object.fromEntries(bootstrap.projects.map((project) => [project.id, project] as const)),
    [bootstrap.projects],
  );
  const tasksById = useMemo(
    () => Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task] as const)),
    [bootstrap.tasks],
  );
  const milestonesById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.milestones.map((milestone) => [milestone.id, milestone] as const),
      ),
    [bootstrap.milestones],
  );
  const scopedProjectIds = useMemo(
    () => bootstrap.projects.map((project) => project.id),
    [bootstrap.projects],
  );
  const milestoneModalState = useMilestonesMilestoneModalState({
    bootstrap,
    isAllProjectsView,
    onTaskEditCanceled,
    onTaskEditSaved,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
    projectFilter: [],
    scopedProjectIds,
  });
  const unfilteredEvents = useMemo(
    () =>
      buildTaskCalendarEvents({
        activePersonFilter,
        bootstrap,
        isAllProjectsView,
        projectsById,
      }),
    [activePersonFilter, bootstrap, isAllProjectsView, projectsById],
  );
  const events = useMemo(() => {
    const scopedEvents =
      eventFilter === "all"
        ? unfilteredEvents
        : unfilteredEvents.filter((event) => event.extendedProps.type === eventFilter);

    return sortTaskCalendarEvents(scopedEvents, sortMode);
  }, [eventFilter, sortMode, unfilteredEvents]);
  const monthCells = useMemo(() => createMonthCells(monthCursor), [monthCursor]);
  const eventsByDateKey = useMemo(() => {
    const grouped = new Map<string, TaskCalendarEvent[]>();

    events.forEach((event) => {
      const dateKey = toEventDateKey(event.start);
      grouped.set(dateKey, [...(grouped.get(dateKey) ?? []), event]);
    });

    return grouped;
  }, [events]);
  const monthLabel = monthCursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const openEvent = (event: TaskCalendarEvent) => {
    if (event.extendedProps.type === "milestone") {
      const milestone = milestonesById[event.extendedProps.recordId];
      if (milestone) {
        milestoneModalState.openMilestoneDetailsModal(milestone);
      }
      return;
    }

    if (event.extendedProps.type === "task-due" || event.extendedProps.type === "qa-due") {
      const task = tasksById[event.extendedProps.recordId];
      if (task) {
        onTaskDetailOpen(task);
      }
    }
  };

  return (
    <section className={`panel dense-panel task-calendar-shell ${WORKSPACE_PANEL_CLASS}`}>
      {unfilteredEvents.length > 0 ? (
        <TaskCalendarFilterToolbar
          eventFilter={eventFilter}
          onEventFilterChange={setEventFilter}
          onSortModeChange={setSortMode}
          sortMode={sortMode}
        />
      ) : null}

      {unfilteredEvents.length === 0 ? (
        <div className="empty-state">
          <strong>No dated records in scope.</strong>
          <p className="section-copy">
            Add milestone dates or task due dates to populate this month view.
          </p>
        </div>
      ) : (
        <div className="task-calendar-frame">
          <div className="task-calendar-toolbar">
            <div className="task-calendar-toolbar-actions">
              <button
                className="secondary-action"
                onClick={() =>
                  setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                }
                type="button"
              >
                Prev
              </button>
              <button
                className="secondary-action"
                onClick={() =>
                  setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                }
                type="button"
              >
                Next
              </button>
              <button
                className="secondary-action"
                onClick={() => {
                  const now = new Date();
                  setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                type="button"
              >
                Today
              </button>
            </div>
            <div className="task-calendar-toolbar-center">
              <strong className="task-calendar-toolbar-title">{monthLabel}</strong>
              <TaskCalendarLegend />
            </div>
          </div>

          {events.length === 0 ? (
            <div className="empty-state task-calendar-filter-empty">
              <strong>No events match this filter.</strong>
              <p className="section-copy">
                Adjust filter or sort settings to view more records in this month.
              </p>
            </div>
          ) : (
            <>
              <div className="task-calendar-weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="task-calendar-grid">
                {monthCells.map((cellDate) => {
                  const cellDateKey = formatDateKey(cellDate);
                  const cellEvents = eventsByDateKey.get(cellDateKey) ?? [];
                  const visibleEvents = cellEvents.slice(0, 4);
                  const hiddenEventCount = Math.max(0, cellEvents.length - visibleEvents.length);
                  const isCurrentMonth = cellDate.getMonth() === monthCursor.getMonth();
                  const isToday = cellDateKey === todayDateKey;

                  return (
                    <article
                      className={`task-calendar-day${isCurrentMonth ? "" : " is-outside-month"}${isToday ? " is-today" : ""}`}
                      key={cellDateKey}
                    >
                      <header className="task-calendar-day-header">
                        <span>{cellDate.getDate()}</span>
                      </header>

                      <div className="task-calendar-day-events">
                        {visibleEvents.map((event) => (
                          <button
                            className={`task-calendar-day-event ${eventTypeClassName(event)}`}
                            key={event.id}
                            onClick={() => openEvent(event)}
                            title={event.title}
                            type="button"
                          >
                            {event.title}
                          </button>
                        ))}
                        {hiddenEventCount > 0 ? (
                          <small className="task-calendar-more">+{hiddenEventCount} more</small>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <MilestonesMilestoneModal
        activeMilestone={milestoneModalState.activeMilestone}
        bootstrap={bootstrap}
        isDeletingMilestone={milestoneModalState.isDeletingMilestone}
        isSavingMilestone={milestoneModalState.isSavingMilestone}
        milestoneDraft={milestoneModalState.milestoneDraft}
        milestoneEndDate={milestoneModalState.milestoneEndDate}
        milestoneEndTime={milestoneModalState.milestoneEndTime}
        milestoneError={milestoneModalState.milestoneError}
        milestoneModalMode={milestoneModalState.milestoneModalMode}
        milestoneStartDate={milestoneModalState.milestoneStartDate}
        milestoneStartTime={milestoneModalState.milestoneStartTime}
        modalPortalTarget={milestoneModalState.modalPortalTarget}
        onCancelEdit={milestoneModalState.cancelMilestoneEdit}
        onClose={milestoneModalState.closeMilestoneModal}
        onDelete={() => void milestoneModalState.handleMilestoneDelete()}
        onEditMilestone={milestoneModalState.openEditMilestoneModal}
        onSubmit={(event) => void milestoneModalState.handleMilestoneSubmit(event)}
        projectsById={projectsById}
        setMilestoneDraft={milestoneModalState.setMilestoneDraft}
        setMilestoneEndDate={milestoneModalState.setMilestoneEndDate}
        setMilestoneEndTime={milestoneModalState.setMilestoneEndTime}
        setMilestoneStartDate={milestoneModalState.setMilestoneStartDate}
        setMilestoneStartTime={milestoneModalState.setMilestoneStartTime}
      />
    </section>
  );
}
