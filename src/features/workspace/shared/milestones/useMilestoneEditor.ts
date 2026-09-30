import { useCallback, useState, type FormEvent } from "react";

import type { MilestonePayload } from "@/types/payloads";
import type { MilestoneRecord } from "@/types/recordsExecution";
import { DEFAULT_EVENT_TYPE as DEFAULT_MILESTONE_TYPE } from "@/features/workspace/shared/events/eventStyles";
import { buildDateTime, compareDateTimes, datePortion, localTodayDate, timePortion } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { emptyTimelineMilestoneDraft, timelineMilestoneDraftFromRecord } from "@/features/workspace/shared/timeline/timelineEventHelpers";
import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline/timelineEventHelpers";

export type MilestoneEditorArgs = {
  onTaskEditCanceled: () => void;
  onTaskEditSaved: () => void;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  createProjectIds?: string[];
  scopedProjectIds: string[];
};

export function useMilestoneEditor({
  onTaskEditCanceled,
  onTaskEditSaved,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  scopedProjectIds,
  createProjectIds = scopedProjectIds,
}: MilestoneEditorArgs) {
  const [milestoneModalMode, setMilestoneModalMode] = useState<"create" | "detail" | "edit" | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<TimelineMilestoneDraft>(
    emptyTimelineMilestoneDraft(DEFAULT_MILESTONE_TYPE),
  );
  const [milestoneStartDate, setMilestoneStartDate] = useState("");
  const [milestoneStartTime, setMilestoneStartTime] = useState("18:00");
  const [milestoneEndDate, setMilestoneEndDate] = useState("");
  const [milestoneEndTime, setMilestoneEndTime] = useState("");
  const [milestoneError, setMilestoneError] = useState<string | null>(null);
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);
  const [isDeletingMilestone, setIsDeletingMilestone] = useState(false);

  const closeMilestoneModal = useCallback(() => {
    setMilestoneModalMode(null);
    setActiveMilestoneId(null);
    setMilestoneError(null);
    setIsSavingMilestone(false);
    setIsDeletingMilestone(false);
  }, []);

  const cancelMilestoneEdit = () => {
    if (milestoneModalMode === "edit") {
      onTaskEditCanceled();
    }

    closeMilestoneModal();
  };

  const openCreateMilestoneModalForDay = useCallback((day = localTodayDate()) => {
    setMilestoneModalMode("create");
    setActiveMilestoneId(null);
    setMilestoneDraft({
      ...emptyTimelineMilestoneDraft(DEFAULT_MILESTONE_TYPE),
      projectIds: createProjectIds,
    });
    setMilestoneStartDate(day);
    setMilestoneStartTime("18:00");
    setMilestoneEndDate("");
    setMilestoneEndTime("");
    setMilestoneError(null);
  }, [createProjectIds]);

  const openMilestoneDetailsModal = (milestone: MilestoneRecord) => {
    setMilestoneModalMode("detail");
    setActiveMilestoneId(milestone.id);
    setMilestoneError(null);
  };

  const openEditMilestoneModal = useCallback((milestone: MilestoneRecord) => {
    setMilestoneModalMode("edit");
    setActiveMilestoneId(milestone.id);
    setMilestoneDraft({
      ...timelineMilestoneDraftFromRecord(milestone),
      projectIds: milestone.projectIds.length > 0 ? milestone.projectIds : scopedProjectIds,
    });
    setMilestoneStartDate(datePortion(milestone.startDateTime));
    setMilestoneStartTime(timePortion(milestone.startDateTime));
    setMilestoneEndDate(milestone.endDateTime ? datePortion(milestone.endDateTime) : "");
    setMilestoneEndTime(milestone.endDateTime ? timePortion(milestone.endDateTime) : "");
    setMilestoneError(null);
  }, [scopedProjectIds]);

  const handleMilestoneSubmit = async (milestone: FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!milestoneModalMode || milestoneModalMode === "detail") {
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
        error instanceof Error ? error.message : "Could not save the milestone. Please try again.",
      );
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleMilestoneDelete = async () => {
    if (milestoneModalMode !== "edit" || !activeMilestoneId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this milestone? Any tasks targeting this milestone will be unlinked.",
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
        error instanceof Error ? error.message : "Could not delete the milestone. Please try again.",
      );
      setIsDeletingMilestone(false);
    }
  };

  return {
    activeMilestoneId,
    cancelMilestoneEdit,
    closeMilestoneModal,
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
    milestoneDraft,
    openCreateMilestoneModalForDay,
    openMilestoneDetailsModal,
    openEditMilestoneModal,
    setMilestoneEndDate,
    setMilestoneEndTime,
    setMilestoneStartDate,
    setMilestoneStartTime,
    setMilestoneDraft,
  };
}
