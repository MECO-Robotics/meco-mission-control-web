import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

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

  const session = useRef({ pending: false });
  useEffect(() => () => { session.current = { pending: false }; }, []);
  const beginSession = useCallback(() => {
    session.current = { pending: false };
    setIsSavingMilestone(false);
    setIsDeletingMilestone(false);
  }, []);

  const closeMilestoneModal = useCallback(() => {
    beginSession();
    setMilestoneModalMode(null);
    setActiveMilestoneId(null);
    setMilestoneError(null);
  }, [beginSession]);

  const cancelMilestoneEdit = () => {
    if (milestoneModalMode === "edit") {
      onTaskEditCanceled();
    }

    closeMilestoneModal();
  };

  const openCreateMilestoneModalForDay = useCallback((day = localTodayDate()) => {
    beginSession();
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
  }, [beginSession, createProjectIds]);

  const openMilestoneDetailsModal = (milestone: MilestoneRecord) => {
    beginSession();
    setMilestoneModalMode("detail");
    setActiveMilestoneId(milestone.id);
    setMilestoneError(null);
  };

  const leaveMilestoneDetails = (milestone: MilestoneRecord) => {
    closeMilestoneModal();
    const returnSession = session.current;
    return () => {
      if (session.current !== returnSession) return;
      openMilestoneDetailsModal(milestone);
    };
  };

  const openEditMilestoneModal = useCallback((milestone: MilestoneRecord) => {
    beginSession();
    setMilestoneModalMode("edit");
    setActiveMilestoneId(milestone.id);
    setMilestoneDraft({
      ...timelineMilestoneDraftFromRecord(milestone),
      projectIds: milestone.projectIds.length > 0 ? milestone.projectIds : scopedProjectIds,
    });
    setMilestoneStartDate(datePortion(milestone.startAt));
    setMilestoneStartTime(timePortion(milestone.startAt));
    setMilestoneEndDate(milestone.endAt ? datePortion(milestone.endAt) : "");
    setMilestoneEndTime(milestone.endAt ? timePortion(milestone.endAt) : "");
    setMilestoneError(null);
  }, [beginSession, scopedProjectIds]);

  const handleMilestoneSubmit = async (milestone: FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (session.current.pending || !milestoneModalMode || milestoneModalMode === "detail") {
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
    const startAt = buildDateTime(milestoneStartDate, normalizedStartTime);
    const includeEndDate = milestoneEndDate.trim().length > 0 || milestoneEndTime.trim().length > 0;
    const endAt = includeEndDate
      ? buildDateTime(
          milestoneEndDate.trim().length > 0 ? milestoneEndDate : milestoneStartDate,
          milestoneEndTime.trim().length > 0 ? milestoneEndTime : normalizedStartTime,
        )
      : null;

    if (endAt && compareDateTimes(endAt, startAt) < 0) {
      setMilestoneError("End date/time must be after the start date/time.");
      return;
    }

    const savingSession = session.current;
    savingSession.pending = true;
    setIsSavingMilestone(true);
    setMilestoneError(null);

    try {
      const payload: MilestonePayload = {
        title: normalizedTitle,
        type: milestoneDraft.type,
        status: milestoneDraft.status,
        startAt,
        endAt,
        description: milestoneDraft.description.trim(),
        projectIds: Array.from(new Set(milestoneDraft.projectIds)),
      };

      await onSaveTimelineMilestone(milestoneModalMode, activeMilestoneId, payload);
      if (session.current !== savingSession) return;
      if (milestoneModalMode === "edit") {
        onTaskEditSaved();
      }
      closeMilestoneModal();
    } catch (error) {
      if (session.current !== savingSession) return;
      setMilestoneError(
        error instanceof Error ? error.message : "Could not save the milestone. Please try again.",
      );
    } finally {
      if (session.current === savingSession) {
        savingSession.pending = false;
        setIsSavingMilestone(false);
      }
    }
  };

  const handleMilestoneDelete = async () => {
    if (session.current.pending || milestoneModalMode !== "edit" || !activeMilestoneId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this milestone? Any tasks targeting this milestone will be unlinked.",
    );
    if (!shouldDelete) {
      return;
    }

    const deletingSession = session.current;
    deletingSession.pending = true;
    setIsDeletingMilestone(true);
    setMilestoneError(null);

    try {
      await onDeleteTimelineMilestone(activeMilestoneId);
      if (session.current !== deletingSession) return;
      closeMilestoneModal();
    } catch (error) {
      if (session.current !== deletingSession) return;
      setMilestoneError(
        error instanceof Error ? error.message : "Could not delete the milestone. Please try again.",
      );
    } finally {
      if (session.current === deletingSession) {
        deletingSession.pending = false;
        setIsDeletingMilestone(false);
      }
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
    leaveMilestoneDetails,
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
