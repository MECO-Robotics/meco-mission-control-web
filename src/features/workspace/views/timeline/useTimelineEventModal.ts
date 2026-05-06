import { useCallback, useEffect, useState } from "react";
import type React from "react";
import type { MilestonePayload, MilestoneRecord } from "@/types";
import { DEFAULT_EVENT_TYPE } from "@/features/workspace/shared/milestones";
import {
  buildDateTime,
  compareDateTimes,
  datePortion,
  localTodayDate,
  timePortion,
} from "@/features/workspace/shared/timeline";
import {
  emptyTimelineMilestoneDraft,
  timelineMilestoneDraftFromRecord,
  type TimelineMilestoneDraft,
} from "@/features/workspace/shared/timeline";

interface UseTimelineMilestoneModalArgs {
  dayMilestonesByDate: Record<string, MilestoneRecord[]>;
  openCreateTaskModal: () => void;
  onTaskEditCanceled: () => void;
  onTaskEditSaved: () => void;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  scopedProjectIds: string[];
  triggerCreateMilestoneToken: number;
}

export function useTimelineMilestoneModal({
  dayMilestonesByDate,
  openCreateTaskModal,
  onTaskEditCanceled,
  onTaskEditSaved,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  scopedProjectIds,
  triggerCreateMilestoneToken,
}: UseTimelineMilestoneModalArgs) {
  const [milestoneModalMode, setMilestoneModalMode] = useState<"create" | "edit" | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [activeMilestoneDay, setActiveMilestoneDay] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<TimelineMilestoneDraft>(
    emptyTimelineMilestoneDraft(DEFAULT_EVENT_TYPE),
  );
  const [milestoneStartDate, setMilestoneStartDate] = useState("");
  const [milestoneStartTime, setMilestoneStartTime] = useState("18:00");
  const [milestoneEndDate, setMilestoneEndDate] = useState("");
  const [milestoneEndTime, setMilestoneEndTime] = useState("");
  const [milestoneError, setMilestoneError] = useState<string | null>(null);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);
  const [activeMilestoneDetail, setActiveMilestoneDetail] = useState<MilestoneRecord | null>(null);

  const closeMilestoneModal = useCallback(() => {
    setMilestoneModalMode(null);
    setActiveMilestoneId(null);
    setActiveMilestoneDay(null);
    setMilestoneError(null);
    setIsSavingMilestone(false);
    setIsDeletingMilestone(false);
  }, []);

  const cancelMilestoneEdit = useCallback(() => {
    if (milestoneModalMode === "edit") {
      onTaskEditCanceled();
    }

    closeMilestoneModal();
  }, [closeMilestoneModal, milestoneModalMode, onTaskEditCanceled]);

  const openCreateMilestoneModalForDay = useCallback(
    (day: string) => {
      setActiveMilestoneDetail(null);
      setMilestoneModalMode("create");
      setActiveMilestoneId(null);
      setActiveMilestoneDay(day);
      setMilestoneDraft({
        ...emptyTimelineMilestoneDraft(DEFAULT_EVENT_TYPE),
        projectIds: scopedProjectIds,
      });
      setMilestoneStartDate(day);
      setMilestoneStartTime("18:00");
      setMilestoneEndDate("");
      setMilestoneEndTime("");
      setMilestoneError(null);
    },
    [scopedProjectIds],
  );

  useEffect(() => {
    if (triggerCreateMilestoneToken <= 0) {
      return;
    }

    openCreateMilestoneModalForDay(localTodayDate());
  }, [openCreateMilestoneModalForDay, triggerCreateMilestoneToken]);

  const openEditMilestoneModalForDay = useCallback(
    (day: string, milestone: MilestoneRecord) => {
      setActiveMilestoneDetail(null);
      setMilestoneModalMode("edit");
      setActiveMilestoneId(milestone.id);
      setActiveMilestoneDay(day);
      setMilestoneDraft({
        ...timelineMilestoneDraftFromRecord(milestone),
        projectIds: milestone.projectIds.length > 0 ? milestone.projectIds : scopedProjectIds,
      });
      setMilestoneStartDate(datePortion(milestone.startDateTime));
      setMilestoneStartTime(timePortion(milestone.startDateTime));
      setMilestoneEndDate(milestone.endDateTime ? datePortion(milestone.endDateTime) : "");
      setMilestoneEndTime(milestone.endDateTime ? timePortion(milestone.endDateTime) : "");
      setMilestoneError(null);
    },
    [scopedProjectIds],
  );

  const openEditMilestoneModalForMilestone = useCallback(
    (milestone: MilestoneRecord) => {
      openEditMilestoneModalForDay(datePortion(milestone.startDateTime), milestone);
    },
    [openEditMilestoneModalForDay],
  );

  const openMilestoneModalForDay = useCallback(
    (day: string) => {
      const milestonesOnDay = dayMilestonesByDate[day] ?? [];
      if (milestonesOnDay.length === 0) {
        openCreateMilestoneModalForDay(day);
        return;
      }

      openEditMilestoneModalForDay(day, milestonesOnDay[0]);
    },
    [dayMilestonesByDate, openCreateMilestoneModalForDay, openEditMilestoneModalForDay],
  );

  const openMilestoneDetailModalForMilestone = useCallback((milestone: MilestoneRecord) => {
    setActiveMilestoneDetail(milestone);
    closeMilestoneModal();
  }, [closeMilestoneModal]);

  const closeMilestoneDetailModal = useCallback(() => {
    setActiveMilestoneDetail(null);
  }, []);

  const switchMilestoneCreateToTask = useCallback(() => {
    closeMilestoneModal();
    openCreateTaskModal();
  }, [closeMilestoneModal, openCreateTaskModal]);

  const handleMilestoneSubmit = useCallback(
    async (milestone: React.FormEvent<HTMLFormElement>) => {
      milestone.preventDefault();
      if (!milestoneModalMode) {
        return;
      }

      if (!milestoneStartDate) {
        setMilestoneError("Start date is required.");
        return;
      }

      const normalizedTitle = milestoneDraft.title.trim();
      if (!normalizedTitle) {
        setMilestoneError("Title is required.");
        return;
      }

      const hasStartTime = milestoneStartTime.trim().length > 0;
      const hasEndTime = milestoneEndTime.trim().length > 0;
      if (hasStartTime !== hasEndTime) {
        setMilestoneError("Start time and end time must both be set, or both be empty.");
        return;
      }

      const normalizedStartTime = milestoneStartTime.trim().length > 0 ? milestoneStartTime : "12:00";
      const startDateTime = buildDateTime(milestoneStartDate, normalizedStartTime);
      const includeEndDate = milestoneEndDate.trim().length > 0 || milestoneEndTime.trim().length > 0;
      const endDateTime = includeEndDate
        ? buildDateTime(
            milestoneEndDate.trim().length > 0 ? milestoneEndDate : milestoneStartDate,
            milestoneEndTime.trim().length > 0 ? milestoneEndTime : normalizedStartTime,
          )
        : null;

      if (endDateTime && compareDateTimes(endDateTime, startDateTime) < 0) {
        setMilestoneError("End date/time must be after the start date/time.");
        return;
      }

      setIsSavingMilestone(true);
      setMilestoneError(null);

      try {
        const payload: MilestonePayload = {
          title: normalizedTitle,
          type: milestoneDraft.type,
          startDateTime,
          endDateTime,
        isExternal: milestoneDraft.isExternal,
        description: milestoneDraft.description.trim(),
        projectIds: Array.from(new Set(milestoneDraft.projectIds)),
      };

        await onSaveTimelineMilestone(milestoneModalMode, activeMilestoneId, payload);
        if (milestoneModalMode === "edit") {
          onTaskEditSaved();
        }
        closeMilestoneModal();
      } catch (error) {
        setMilestoneError(
          error instanceof Error
            ? error.message
            : "Could not save the milestone. Please try again.",
        );
      } finally {
        setIsSavingMilestone(false);
      }
    },
    [
      activeMilestoneId,
      closeMilestoneModal,
      milestoneDraft.description,
      milestoneDraft.isExternal,
      milestoneDraft.projectIds,
      milestoneDraft.title,
      milestoneDraft.type,
      milestoneEndDate,
      milestoneEndTime,
      milestoneModalMode,
      milestoneStartDate,
      milestoneStartTime,
      onSaveTimelineMilestone,
      onTaskEditSaved,
    ],
  );

  const handleMilestoneDelete = useCallback(async () => {
    if (milestoneModalMode !== "edit" || !activeMilestoneId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this milestone milestone? Any tasks targeting this milestone will be unlinked.",
    );
    if (!shouldDelete) {
      return;
    }

    setIsDeletingMilestone(true);
    setMilestoneError(null);

    try {
      await onDeleteTimelineMilestone(activeMilestoneId);
      closeMilestoneModal();
    } catch (error) {
      setMilestoneError(
        error instanceof Error
          ? error.message
          : "Could not delete the milestone. Please try again.",
      );
      setIsDeletingMilestone(false);
    }
  }, [activeMilestoneId, closeMilestoneModal, milestoneModalMode, onDeleteTimelineMilestone]);

  return {
    activeDayMilestones: activeMilestoneDay ? dayMilestonesByDate[activeMilestoneDay] ?? [] : [],
    activeMilestoneDay,
    activeMilestoneId,
    activeMilestoneDetail,
    closeMilestoneDetailModal,
    closeMilestoneModal,
    cancelMilestoneEdit,
    milestoneDraft,
    milestoneEndDate,
    milestoneEndTime,
    milestoneError,
    milestoneModalMode,
    milestoneStartDate,
    milestoneStartTime,
    handleMilestoneDelete,
    handleMilestoneSubmit,
    isDeletingMilestone,
    isSavingMilestone,
    openMilestoneModalForDay,
    openMilestoneDetailModalForMilestone,
    openEditMilestoneModalForMilestone,
    setMilestoneDraft,
    setMilestoneEndDate,
    setMilestoneEndTime,
    setMilestoneStartDate,
    setMilestoneStartTime,
    switchMilestoneCreateToTask,
  };
}
