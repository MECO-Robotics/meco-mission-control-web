import { useState, type FormEvent } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { IconCalendar, IconTasks } from "@/components/shared/Icons";
import { toErrorMessage } from "@/lib/appUtils/common";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { MilestonesMilestoneModal } from "@/features/workspace/views/milestones/MilestonesEventModal";
import { useMilestonesMilestoneModalState } from "@/features/workspace/views/milestones/sections/useMilestonesEventModalState";
import { TaskCalendarFilterToolbar } from "./TaskCalendarFilterToolbar";
import { TaskCalendarDayDetails } from "./TaskCalendarDayDetails";
import { MeetingScheduleModal } from "./MeetingScheduleModal";
import { TaskCalendarMonthGrid } from "./TaskCalendarMonthGrid";
import { TaskCalendarMonthToolbar } from "./TaskCalendarMonthToolbar";
import { formatDateKey } from "./taskCalendarLayout";
import type { TaskCalendarEvent } from "./taskCalendarEvents";
import { useTaskCalendarEventData } from "./useTaskCalendarEventData";

interface TaskCalendarViewProps {
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
  const [meetingDraft, setMeetingDraft] = useState<MeetingPayload>(() => createDefaultMeetingDraft(bootstrap));
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const calendar = useTaskCalendarEventData({
    activePersonFilter,
    bootstrap,
    isAllProjectsView,
  });
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

  const openMeetingModal = () => {
    setMeetingDraft(createDefaultMeetingDraft(bootstrap));
    setMeetingError(null);
    setIsMeetingModalOpen(true);
  };

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
        <div className="panel-actions filter-toolbar task-queue-toolbar task-calendar-filter-toolbar">
          <TopbarResponsiveSearch
            actionCount={2}
            actions={
              <TaskCalendarFilterToolbar
                eventFilter={calendar.eventFilter}
                onEventFilterChange={calendar.setEventFilter}
                onSortModeChange={calendar.setSortMode}
                sortMode={calendar.sortMode}
              />
            }
            ariaLabel="Search calendar"
            compactPlaceholder="Search"
            onChange={calendar.setSearchFilter}
            placeholder="Search calendar..."
            value={calendar.searchFilter}
          />
          <WorkspaceTopbarAddMenu
            actions={[
              { icon: <IconCalendar />, label: "Add meeting", onSelect: openMeetingModal },
              { icon: <IconTasks />, label: "Add milestone", onSelect: milestoneModalState.openCreateMilestoneModal },
            ]}
            ariaLabel="Add calendar item"
            title="Add calendar item"
          />
        </div>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Calendar</h2>
        </div>
      </div>

      {calendar.unfilteredEvents.length === 0 ? (
        <div className="empty-state">
          <strong>No dated records in scope.</strong>
          <p className="section-copy">
            Add milestone dates or task due dates to populate this month view.
          </p>
        </div>
      ) : (
        <div className="task-calendar-frame">
          <TaskCalendarMonthToolbar
            monthLabel={calendar.monthLabel}
            onMonthChange={() => setSelectedDateKey(null)}
            setMonthCursor={calendar.setMonthCursor}
          />

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
