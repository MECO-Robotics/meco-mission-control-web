import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type FormEvent } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import { formatLocalDate } from "@/lib/dateUtils";
import { indexRecordsById } from "@/features/workspace/shared/model/indexRecordsById";
import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { toErrorMessage } from "@/lib/appUtils/common";
import { MilestonesMilestoneModal } from "@/features/workspace/views/milestones/MilestonesEventModal";
import { useMilestonesMilestoneModalState } from "@/features/workspace/views/milestones/sections/useMilestonesEventModalState";
import { MeetingScheduleModal } from "./MeetingScheduleModal";
import { ScheduleAgendaMonthList } from "./ScheduleAgendaMonthList";
import { groupTaskCalendarEventsByMonth, toEventDateKey } from "./taskCalendarLayout";
import type { TaskCalendarEvent } from "./taskCalendarEvents";

export interface ScheduleAgendaHandle {
  openMilestone: (id: string) => void;
  createMilestone: () => void;
}

interface ScheduleAgendaPanelProps {
  selectedDate?: string | null;
  onClearSelectedDate?: () => void;
  triggerCreateMilestoneToken?: number;
  isVisible?: boolean;
  startDate: string;
  endDate: string | null;
  events: TaskCalendarEvent[];
  onCreateMilestoneReport?: (milestoneId: string, onReturn?: () => void) => void;
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

export const ScheduleAgendaPanel = forwardRef<ScheduleAgendaHandle, ScheduleAgendaPanelProps>(function ScheduleAgendaPanel({
  selectedDate = null,
  onClearSelectedDate,
  triggerCreateMilestoneToken = 0,
  isVisible = true,
  startDate,
  endDate,
  events,
  onCreateMilestoneReport,
  bootstrap,
  isAllProjectsView,
  onSaveMeeting,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  onTaskDetailOpen,
  onTaskEditCanceled = () => {},
  onTaskEditSaved = () => {},
}, ref) {
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);
  const [meetingDraft, setMeetingDraft] = useState<MeetingPayload>(() => createDefaultMeetingDraft(bootstrap));
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const meetingSession = useRef({ pending: false });
  useEffect(() => () => { meetingSession.current = { pending: false }; }, []);
  const closeMeeting = useCallback(() => {
    meetingSession.current = { pending: false };
    setIsMeetingModalOpen(false);
    setIsSavingMeeting(false);
    setMeetingError(null);
  }, []);
  const openMeeting = useCallback(() => {
    meetingSession.current = { pending: false };
    setMeetingDraft(createDefaultMeetingDraft(bootstrap));
    setIsSavingMeeting(false);
    setMeetingError(null);
    setIsMeetingModalOpen(true);
  }, [bootstrap]);
  const [requestedMilestoneId, setRequestedMilestoneId] = useState(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("milestone"));
  const handledMilestoneId = useRef<string | null | undefined>(undefined);
  const projectsById = useMemo(() => indexRecordsById(bootstrap.projects), [bootstrap.projects]);
  const tasksById = useMemo(() => indexRecordsById(bootstrap.tasks), [bootstrap.tasks]);
  const milestonesById = useMemo(() => indexRecordsById(bootstrap.milestones), [bootstrap.milestones]);
  const scopedProjectIds = useMemo(() => bootstrap.projects.map((project) => project.id), [bootstrap.projects]);
  const milestoneModalState = useMilestonesMilestoneModalState({
    bootstrap,
    isAllProjectsView,
    onTaskEditCanceled,
    onTaskEditSaved,
    onDeleteTimelineMilestone,
    onSaveTimelineMilestone,
    projectFilter: [],
    scopedProjectIds: scopedProjectIds,
  });
  const milestoneModalActions = useRef(milestoneModalState);
  useEffect(() => { milestoneModalActions.current = milestoneModalState; });
  useEffect(() => {
    const openMilestone = () => milestoneModalActions.current.openCreateMilestoneModal();
    window.addEventListener("mission-control:open-meeting", openMeeting);
    window.addEventListener("mission-control:open-milestone", openMilestone);
    return () => {
      window.removeEventListener("mission-control:open-meeting", openMeeting);
      window.removeEventListener("mission-control:open-milestone", openMilestone);
    };
  }, [openMeeting]);
  useEffect(() => {
    const restore = () => setRequestedMilestoneId(new URLSearchParams(window.location.search).get("milestone"));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (handledMilestoneId.current === requestedMilestoneId) return;
    if (!requestedMilestoneId) {
      handledMilestoneId.current = null;
      milestoneModalActions.current.closeMilestoneModal();
      return;
    }
    const milestone = milestonesById[requestedMilestoneId];
    if (!milestone) return;
    handledMilestoneId.current = requestedMilestoneId;
    milestoneModalActions.current.openMilestoneDetailsModal(milestone);
  }, [milestonesById, requestedMilestoneId]);

  const updateMilestoneLocation = useCallback((id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id) params.set("milestone", id); else params.delete("milestone");
    window.history.pushState(window.history.state, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
    handledMilestoneId.current = id;
    setRequestedMilestoneId(id);
  }, []);
  const previousMilestoneMode = useRef(milestoneModalState.milestoneModalMode);
  useEffect(() => {
    const previousMode = previousMilestoneMode.current;
    previousMilestoneMode.current = milestoneModalState.milestoneModalMode;
    if (previousMode && !milestoneModalState.milestoneModalMode && requestedMilestoneId) updateMilestoneLocation(null);
  }, [milestoneModalState.milestoneModalMode, requestedMilestoneId, updateMilestoneLocation]);

  const openMilestone = (id: string) => {
    const milestone = milestonesById[id];
    if (!milestone) return;
    updateMilestoneLocation(id);
    milestoneModalActions.current.openMilestoneDetailsModal(milestone);
  };

  useImperativeHandle(ref, () => ({
    openMilestone,
    createMilestone: () => milestoneModalActions.current.openCreateMilestoneModal(),
  }));
  useEffect(() => {
    if (triggerCreateMilestoneToken > 0) milestoneModalActions.current.openCreateMilestoneModal();
  }, [triggerCreateMilestoneToken]);

  const openEvent = (event: TaskCalendarEvent) => {
    if (event.extendedProps.type === "milestone") {
      openMilestone(event.extendedProps.recordId);
      return;
    }

    if (event.extendedProps.type === "task-due" || event.extendedProps.type === "qa-due") {
      const task = tasksById[event.extendedProps.recordId];
      if (task) {
        onTaskDetailOpen(task);
      }
    }
  };
  const agendaEvents = useMemo(() => events.filter((event) => {
    const eventDate = toEventDateKey(event.start);
    return eventDate >= startDate && (!endDate || eventDate <= endDate) && (!selectedDate || eventDate === selectedDate);
  }), [endDate, startDate, events, selectedDate]);
  const agendaMonths = useMemo(
    () => groupTaskCalendarEventsByMonth(agendaEvents),
    [agendaEvents],
  );
  const handleMeetingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (meetingSession.current.pending) return;
    const savingSession = meetingSession.current;
    savingSession.pending = true;
    setIsSavingMeeting(true);
    setMeetingError(null);

    try {
      await onSaveMeeting({
        ...meetingDraft,
        title: meetingDraft.title.trim(),
        location: meetingDraft.location.trim(),
        description: meetingDraft.description.trim(),
      });
      if (meetingSession.current === savingSession) closeMeeting();
    } catch (error) {
      if (meetingSession.current === savingSession) setMeetingError(toErrorMessage(error));
    } finally {
      if (meetingSession.current === savingSession) {
        savingSession.pending = false;
        setIsSavingMeeting(false);
      }
    }
  };

  return (
    <>
      <aside aria-label="Schedule agenda" className="schedule-agenda-panel" hidden={!isVisible}>
        {selectedDate && (
          <div className="schedule-agenda-focus">
            <time dateTime={selectedDate}>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time>
            {onClearSelectedDate && <button className="secondary-action" onClick={onClearSelectedDate} type="button">Show period</button>}
          </div>
        )}
        {agendaEvents.length === 0 ? (
          <div aria-live="polite" className="empty-state schedule-agenda-empty-state">
            <strong>{selectedDate ? "No schedule items on this date." : "No schedule items in this period."}</strong>
            <p className="section-copy">Adjust search, filters, or dates to see more schedule items.</p>
          </div>
        ) : <ScheduleAgendaMonthList groups={agendaMonths} onOpenEvent={openEvent} />}

      </aside>
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
        onRecordResult={onCreateMilestoneReport ? (milestone) => onCreateMilestoneReport(milestone.id, milestoneModalState.leaveMilestoneDetails(milestone)) : undefined}
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
      <MeetingScheduleModal
        bootstrap={bootstrap}
        draft={meetingDraft}
        error={meetingError}
        isOpen={isMeetingModalOpen}
        isSaving={isSavingMeeting}
        onClose={closeMeeting}
        onSubmit={(event) => void handleMeetingSubmit(event)}
        setDraft={setMeetingDraft}
      />
    </>
  );
});
