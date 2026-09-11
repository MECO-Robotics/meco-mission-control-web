import { useEffect, useState, type FormEvent } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { IconCalendar, IconTasks } from "@/components/shared/Icons";
import { toErrorMessage } from "@/lib/appUtils/common";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import {
  buildTopbarAddMenuActions,
  buildTopbarSearchProps,
  makeAddMenuAction,
} from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarControls } from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { MilestonesMilestoneModal } from "@/features/workspace/views/milestones/MilestonesEventModal";
import { useMilestonesMilestoneModalState } from "@/features/workspace/views/milestones/sections/useMilestonesEventModalState";
import { TaskCalendarFilterToolbar } from "./TaskCalendarFilterToolbar";
import { TaskCalendarDayDetails } from "./TaskCalendarDayDetails";
import { MeetingScheduleModal } from "./MeetingScheduleModal";
import { TaskCalendarMonthGrid } from "./TaskCalendarMonthGrid";
import { formatDateKey } from "./taskCalendarLayout";
import type { TaskCalendarEvent } from "./taskCalendarEvents";
import { useTaskCalendarEventData } from "./useTaskCalendarEventData";

interface TaskCalendarViewProps {
  onCreateMilestoneReport?: (milestoneId: string, onReturn?: () => void) => void;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onSaveMeeting: (payload: MeetingPayload) => Promise<void>;
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

function createDefaultMeetingDraft(bootstrap: BootstrapPayload): MeetingPayload {
  const now = new Date();
  const dateKey = formatDateKey(now);
  const seasonId = bootstrap.projects[0]?.seasonId ?? bootstrap.seasons[0]?.id;

  return {
    title: "",
    meetingType: "general",
    seasonId,
    projectIds: bootstrap.projects[0]?.id ? [bootstrap.projects[0].id] : [],
    startDateTime: `${dateKey}T18:00`,
    endDateTime: `${dateKey}T20:00`,
    location: "",
    description: "",
  };
}

export function TaskCalendarView({
  activePersonFilter,
  onCreateMilestoneReport,
  bootstrap,
  isAllProjectsView,
  onSaveMeeting,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  onTaskDetailOpen,
  onTaskEditCanceled = () => {},
  onTaskEditSaved = () => {},
}: TaskCalendarViewProps) {
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month");
  const [meetingDraft, setMeetingDraft] = useState<MeetingPayload>(() => createDefaultMeetingDraft(bootstrap));
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const calendar = useTaskCalendarEventData({
    activePersonFilter,
    bootstrap,
    isAllProjectsView,
  });
  useEffect(() => {
    const handleSchedulePeriodChange = (event: Event) => {
      const anchorDate = (event as CustomEvent<{ anchorDate?: string }>).detail?.anchorDate;
      const viewMode = (event as CustomEvent<{ viewMode?: "month" | "week" }>).detail?.viewMode;
      if (viewMode) setCalendarViewMode(viewMode);
      if (anchorDate) calendar.setMonthCursor(new Date(anchorDate + "T12:00:00"));
    };
    window.addEventListener("mission-control:schedule-period-change", handleSchedulePeriodChange);
    return () => window.removeEventListener("mission-control:schedule-period-change", handleSchedulePeriodChange);
  }, [calendar.setMonthCursor]);
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

  const openEvent = (event: TaskCalendarEvent) => {
    if (event.extendedProps.type === "milestone") {
      const milestone = calendar.milestonesById[event.extendedProps.recordId];
      if (milestone) {
        milestoneModalState.openMilestoneDetailsModal(milestone);
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
        <WorkspaceTopbarControls
          className="task-queue-toolbar task-calendar-filter-toolbar"
          search={
            <TopbarResponsiveSearch
              {...buildTopbarSearchProps("calendar", {
                actions: (
                  <TaskCalendarFilterToolbar
                    eventFilter={calendar.eventFilter}
                    onEventFilterChange={calendar.setEventFilter}
                    onSortModeChange={calendar.setSortMode}
                    sortMode={calendar.sortMode}
                  />
                ),
                onChange: calendar.setSearchFilter,
                placeholder: "Search calendar...",
                value: calendar.searchFilter,
              })}
            />
          }
          addMenu={
            <WorkspaceTopbarAddMenu
              actions={buildTopbarAddMenuActions(
                makeAddMenuAction("Add meeting", () => setIsMeetingModalOpen(true), <IconCalendar />),
                makeAddMenuAction("Add milestone", milestoneModalState.openCreateMilestoneModal, <IconTasks />),
              )}
              ariaLabel="Add calendar item"
              title="Add calendar item"
            />
          }
        />
      </AppTopbarSlotPortal>

      {calendar.unfilteredEvents.length === 0 ? (
        <div className="empty-state">
          <strong>No dated records in scope.</strong>
          <p className="section-copy">
            Add milestone dates or task due dates to populate this month view.
          </p>
        </div>
      ) : (
        <div className="task-calendar-frame">
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
              monthCells={calendarViewMode === "week" ? calendar.weekCells : calendar.monthCells}
              monthCursor={calendar.monthCursor}
              onOpenDay={setSelectedDateKey}
              onOpenEvent={openEvent}
              selectedDateKey={selectedDateKey}
              todayDateKey={calendar.todayDateKey}
              viewMode={calendarViewMode}
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
        onClose={milestoneModalState.closeMilestoneModal}
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
