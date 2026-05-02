import { useCallback, useEffect, useState } from "react";
import type React from "react";
import type { BootstrapPayload, EventPayload, EventRecord } from "@/types";
import { getEventProjectIds } from "@/features/workspace/shared/eventProjectUtils";
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

interface UseTimelineEventModalArgs {
  dayEventsByDate: Record<string, EventRecord[]>;
  openCreateTaskModal: () => void;
  onDeleteTimelineEvent: (eventId: string) => Promise<void>;
  onSaveTimelineEvent: (
    mode: "create" | "edit",
    eventId: string | null,
    payload: EventPayload,
  ) => Promise<void>;
  scopedProjectIds: string[];
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  triggerCreateMilestoneToken: number;
}

export function useTimelineEventModal({
  dayEventsByDate,
  openCreateTaskModal,
  onDeleteTimelineEvent,
  onSaveTimelineEvent,
  scopedProjectIds,
  subsystemsById,
  triggerCreateMilestoneToken,
}: UseTimelineEventModalArgs) {
  const [eventModalMode, setEventModalMode] = useState<"create" | "edit" | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventDay, setActiveEventDay] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState<TimelineEventDraft>(
    emptyTimelineEventDraft(DEFAULT_EVENT_TYPE),
  );
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("18:00");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventError, setEventError] = useState<string | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  const closeEventModal = useCallback(() => {
    setEventModalMode(null);
    setActiveEventId(null);
    setActiveEventDay(null);
    setEventError(null);
    setIsSavingEvent(false);
    setIsDeletingEvent(false);
  }, []);

  const openCreateEventModalForDay = useCallback(
    (day: string) => {
      setEventModalMode("create");
      setActiveEventId(null);
      setActiveEventDay(day);
      setEventDraft({
        ...emptyTimelineEventDraft(DEFAULT_EVENT_TYPE),
        projectIds: scopedProjectIds,
      });
      setEventStartDate(day);
      setEventStartTime("18:00");
      setEventEndDate("");
      setEventEndTime("");
      setEventError(null);
    },
    [scopedProjectIds],
  );

  useEffect(() => {
    if (triggerCreateMilestoneToken <= 0) {
      return;
    }

    openCreateEventModalForDay(localTodayDate());
  }, [openCreateEventModalForDay, triggerCreateMilestoneToken]);

  const openEditEventModalForDay = useCallback(
    (day: string, event: EventRecord) => {
      const eventProjectIds = getEventProjectIds(event, subsystemsById);
      setEventModalMode("edit");
      setActiveEventId(event.id);
      setActiveEventDay(day);
      setEventDraft({
        ...timelineEventDraftFromRecord(event),
        projectIds: eventProjectIds.length > 0 ? eventProjectIds : scopedProjectIds,
      });
      setEventStartDate(datePortion(event.startDateTime));
      setEventStartTime(timePortion(event.startDateTime));
      setEventEndDate(event.endDateTime ? datePortion(event.endDateTime) : "");
      setEventEndTime(event.endDateTime ? timePortion(event.endDateTime) : "");
      setEventError(null);
    },
    [scopedProjectIds, subsystemsById],
  );

  const openEventModalForDay = useCallback(
    (day: string) => {
      const eventsOnDay = dayEventsByDate[day] ?? [];
      if (eventsOnDay.length === 0) {
        openCreateEventModalForDay(day);
        return;
      }

      openEditEventModalForDay(day, eventsOnDay[0]);
    },
    [dayEventsByDate, openCreateEventModalForDay, openEditEventModalForDay],
  );

  const switchMilestoneCreateToTask = useCallback(() => {
    closeEventModal();
    openCreateTaskModal();
  }, [closeEventModal, openCreateTaskModal]);

  const handleEventSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
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
          projectIds: Array.from(new Set(eventDraft.projectIds)),
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
    },
    [
      activeEventId,
      closeEventModal,
      eventDraft.description,
      eventDraft.isExternal,
      eventDraft.projectIds,
      eventDraft.relatedSubsystemIds,
      eventDraft.title,
      eventDraft.type,
      eventEndDate,
      eventEndTime,
      eventModalMode,
      eventStartDate,
      eventStartTime,
      onSaveTimelineEvent,
    ],
  );

  const handleEventDelete = useCallback(async () => {
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
  }, [activeEventId, closeEventModal, eventModalMode, onDeleteTimelineEvent]);

  return {
    activeDayEvents: activeEventDay ? dayEventsByDate[activeEventDay] ?? [] : [],
    activeEventDay,
    activeEventId,
    closeEventModal,
    eventDraft,
    eventEndDate,
    eventEndTime,
    eventError,
    eventModalMode,
    eventStartDate,
    eventStartTime,
    handleEventDelete,
    handleEventSubmit,
    isDeletingEvent,
    isSavingEvent,
    openEventModalForDay,
    setEventDraft,
    setEventEndDate,
    setEventEndTime,
    setEventStartDate,
    setEventStartTime,
    switchMilestoneCreateToTask,
  };
}
