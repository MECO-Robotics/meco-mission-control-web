import { useEffect, useRef, useState, type FormEvent } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { formatLocalDate } from "@/lib/dateUtils";
import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { toErrorMessage } from "@/lib/appUtils/common";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { WorkspaceTopbarControls } from "@/features/workspace/shared/topbar";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { MilestonesMilestoneModal } from "@/features/workspace/views/milestones/MilestonesEventModal";
import { useMilestonesMilestoneModalState } from "@/features/workspace/views/milestones/sections/useMilestonesEventModalState";
import { TaskCalendarDayDetails } from "./TaskCalendarDayDetails";
import { MeetingScheduleModal } from "./MeetingScheduleModal";
import { TaskCalendarMonthGrid } from "./TaskCalendarMonthGrid";
import type { TaskCalendarSortMode } from "./taskCalendarLayout";
import type { TaskCalendarEvent, TaskCalendarEventType } from "./taskCalendarEvents";
import { useTaskCalendarEventData } from "./useTaskCalendarEventData";
import { SchedulePresentationSelector, type SchedulePresentation } from "./SchedulePresentationSelector";
import { ScheduleDateSelector } from "./ScheduleDateSelector";

interface TaskCalendarViewProps {
  presentation?: "calendar" | "agenda";
  onPresentationChange?: (value: SchedulePresentation) => void;
  onCreateMilestoneReport?: (milestoneId: string, onReturn?: () => void) => void;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  eventFilter: "all" | TaskCalendarEventType;
  onEventFilterChange: (value: "all" | TaskCalendarEventType) => void;
  sortMode: TaskCalendarSortMode;
  onSortModeChange: (value: TaskCalendarSortMode) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: (value: "asc" | "desc") => void;
  isAllProjectsView: boolean;
  onSaveMeeting: (payload: MeetingPayload) => Promise<void>;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  onTaskDetailOpen: (task: TaskRecord) => void;
  searchFilter?: string;
  onSearchChange?: (value: string) => void;
  onTaskEditCanceled?: () => void;
  onTaskEditSaved?: () => void;
}

function createDefaultMeetingDraft(bootstrap: BootstrapPayload): MeetingPayload {
  const now = new Date();
  const dateKey = formatLocalDate(now);
  const seasonId = bootstrap.projects[0]?.seasonId ?? bootstrap.seasons[0]?.id;

  return {
    title: "",
    meetingType: "general",
    seasonId,
    projectIds: bootstrap.projects[0]?.id ? [bootstrap.projects[0].id] : [],
    startAt: `${dateKey}T18:00`,
    endAt: `${dateKey}T20:00`,
    location: "",
    description: "",
  };
}

export function TaskCalendarView({
  presentation = "calendar",
  onPresentationChange,
  activePersonFilter,
  onCreateMilestoneReport,
  bootstrap,
  eventFilter,
  onEventFilterChange,
  sortMode,
  onSortModeChange,
  sortDirection,
  onSortDirectionChange,
  isAllProjectsView,
  onSaveMeeting,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  onTaskDetailOpen,
  searchFilter,
  onSearchChange,
  onTaskEditCanceled = () => {},
  onTaskEditSaved = () => {},
}: TaskCalendarViewProps) {
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [meetingDraft, setMeetingDraft] = useState<MeetingPayload>(() => createDefaultMeetingDraft(bootstrap));
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [agendaStartDate, setAgendaStartDate] = useState(() => formatLocalDate(new Date()));
  const [requestedMilestoneId, setRequestedMilestoneId] = useState(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("milestone"));
  const handledMilestoneId = useRef<string | null | undefined>(undefined);
  const calendar = useTaskCalendarEventData({
    activePersonFilter,
    bootstrap,
    eventFilter,
    onEventFilterChange,
    isAllProjectsView,
    searchFilter,
    onSearchChange,
    sortMode,
    onSortModeChange,
    sortDirection,
    onSortDirectionChange,
  });
  const monthLabel = calendar.monthCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const milestoneModalState = useMilestonesMilestoneModalState({
    bootstrap,
    isAllProjectsView,
    onTaskEditCanceled,
    onTaskEditSaved,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
    projectFilter: [],
    scopedProjectIds: calendar.scopedProjectIds,
  });
  const milestoneModalActions = useRef(milestoneModalState);
  useEffect(() => { milestoneModalActions.current = milestoneModalState; });
  useEffect(() => {
    const openMeeting = () => setIsMeetingModalOpen(true);
    const openMilestone = () => milestoneModalActions.current.openCreateMilestoneModal();
    window.addEventListener("mission-control:open-meeting", openMeeting);
    window.addEventListener("mission-control:open-milestone", openMilestone);
    return () => {
      window.removeEventListener("mission-control:open-meeting", openMeeting);
      window.removeEventListener("mission-control:open-milestone", openMilestone);
    };
  }, []);
  useEffect(() => {
    const restore = () => setRequestedMilestoneId(new URLSearchParams(window.location.search).get("milestone"));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (handledMilestoneId.current === requestedMilestoneId) return;
    handledMilestoneId.current = requestedMilestoneId;
    const milestone = calendar.milestonesById[requestedMilestoneId ?? ""];
    if (milestone) milestoneModalActions.current.openMilestoneDetailsModal(milestone);
  }, [calendar.milestonesById, requestedMilestoneId]);

  const updateMilestoneLocation = (id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id) params.set("milestone", id); else params.delete("milestone");
    window.history.pushState(window.history.state, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    handledMilestoneId.current = id;
    setRequestedMilestoneId(id);
  };

  const openEvent = (event: TaskCalendarEvent) => {
    if (event.extendedProps.type === "milestone") {
      const milestone = calendar.milestonesById[event.extendedProps.recordId];
      if (milestone) {
        updateMilestoneLocation(milestone.id);
        milestoneModalActions.current.openMilestoneDetailsModal(milestone);
      }
      return;
    }

    if (event.extendedProps.type === "task-due" || event.extendedProps.type === "qa-due") {
      const task = calendar.tasksById[event.extendedProps.recordId];
      if (task) {
        onTaskDetailOpen(task);
      }
    }
  };
  const selectedDayEvents = selectedDateKey ? calendar.eventsByDateKey.get(selectedDateKey) ?? [] : [];
  const agendaEvents = calendar.events.filter((event) => event.start.slice(0, 10) >= agendaStartDate);

  const handleMeetingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingMeeting(true);
    setMeetingError(null);

    try {
      await onSaveMeeting({
        ...meetingDraft,
        title: meetingDraft.title.trim(),
        location: meetingDraft.location.trim(),
        description: meetingDraft.description.trim(),
      });
      setIsMeetingModalOpen(false);
    } catch (error) {
      setMeetingError(toErrorMessage(error));
    } finally {
      setIsSavingMeeting(false);
    }
  };

  return (
    <section className={`panel dense-panel task-calendar-shell ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls className="schedule-topbar-controls">
          {onPresentationChange ? <SchedulePresentationSelector value={presentation} onChange={onPresentationChange} /> : null}
          <ScheduleDateSelector
            onChange={(date) => {
              if (!date) return;
              if (presentation === "agenda") {
                setAgendaStartDate(date);
                return;
              }
              const [year, month] = date.split("-").map(Number);
              calendar.setMonthCursor(new Date(year, month - 1, 1));
              setSelectedDateKey(date);
            }}
            value={presentation === "agenda" ? agendaStartDate : selectedDateKey ?? formatLocalDate(new Date())}
          />
          {presentation === "calendar" ? (
            <div className="task-calendar-month-controls" role="group" aria-label="Calendar month navigation">
              <button className="icon-button task-calendar-month-button" aria-label="Previous month" onClick={() => calendar.setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} type="button">‹</button>
              <strong className="task-calendar-toolbar-title">{monthLabel}</strong>
              <button className="icon-button task-calendar-month-button" aria-label="Next month" onClick={() => calendar.setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} type="button">›</button>
              <button className="secondary-action task-calendar-today-button" onClick={() => { const now = new Date(); calendar.setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDateKey(null); }} type="button">Today</button>
            </div>
          ) : null}
        </WorkspaceTopbarControls>
        <TopbarResponsiveSearch
          ariaLabel="Search schedule"
          compactPlaceholder="Search"
          onChange={calendar.setSearchFilter}
          placeholder="Search schedule..."
          value={calendar.searchFilter}
        />
      </AppTopbarSlotPortal>
      <h2 className="schedule-calendar-heading">Schedule</h2>
      {calendar.unfilteredEvents.length === 0 ? (
        <div className="empty-state">
          <strong>No dated records in scope.</strong>
          <p className="section-copy">
            Add milestone dates or task due dates to populate this month view.
          </p>
        </div>
      ) : (
        presentation === "agenda" ? (
          <ol aria-label="Schedule agenda" className="schedule-agenda-list">
            {agendaEvents.map((event) => {
              const canOpen = event.extendedProps.type === "milestone" || event.extendedProps.type === "task-due" || event.extendedProps.type === "qa-due";
              const date = new Date(event.start);
              return <li key={event.id}><time dateTime={event.start}>{date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}{date.toString() !== "Invalid Date" && event.start.includes("T") ? ` · ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : ""}</time>{canOpen ? <button className="task-calendar-day-details-title" onClick={() => openEvent(event)} type="button">{event.title}</button> : <span>{event.title}</span>}<small>{event.extendedProps.type.replaceAll("-", " ")}{event.extendedProps.status ? ` · ${event.extendedProps.status}` : ""}</small></li>;
            })}
          </ol>
        ) : <div className="task-calendar-frame">
          {calendar.events.length === 0 ? (
            <div className="empty-state task-calendar-filter-empty">
              <strong>No events match this filter.</strong>
              <p className="section-copy">
                Adjust filter or sort settings to view more records in this month.
              </p>
            </div>
          ) : (
            <TaskCalendarMonthGrid
              eventsByDateKey={calendar.eventsByDateKey}
              monthCells={calendar.monthCells}
              monthCursor={calendar.monthCursor}
              onOpenDay={setSelectedDateKey}
              onOpenEvent={openEvent}
              selectedDateKey={selectedDateKey}
              todayDateKey={calendar.todayDateKey}
              viewMode="month"
            />
          )}

          {selectedDateKey ? (
            <TaskCalendarDayDetails
              dateKey={selectedDateKey}
              events={selectedDayEvents}
              onClose={() => setSelectedDateKey(null)}
              onOpenEvent={openEvent}
            />
          ) : null}
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
        onClose={() => { if (requestedMilestoneId) updateMilestoneLocation(null); milestoneModalState.closeMilestoneModal(); }}
        onRecordResult={onCreateMilestoneReport ? (milestone) => { milestoneModalState.closeMilestoneModal(); onCreateMilestoneReport(milestone.id, () => milestoneModalState.openMilestoneDetailsModal(milestone)); } : undefined}
        onDelete={() => void milestoneModalState.handleMilestoneDelete()}
        onEditMilestone={milestoneModalState.openEditMilestoneModal}
        onSubmit={(event) => void milestoneModalState.handleMilestoneSubmit(event)}
        projectsById={calendar.projectsById}
        setMilestoneDraft={milestoneModalState.setMilestoneDraft}
        setMilestoneEndDate={milestoneModalState.setMilestoneEndDate}
        setMilestoneEndTime={milestoneModalState.setMilestoneEndTime}
        setMilestoneStartDate={milestoneModalState.setMilestoneStartDate}
        setMilestoneStartTime={milestoneModalState.setMilestoneStartTime}
      />
      <MeetingScheduleModal
        bootstrap={bootstrap}
        draft={meetingDraft}
        error={meetingError}
        isOpen={isMeetingModalOpen}
        isSaving={isSavingMeeting}
        onClose={() => setIsMeetingModalOpen(false)}
        onSubmit={(event) => void handleMeetingSubmit(event)}
        setDraft={setMeetingDraft}
      />
    </section>
  );
}
