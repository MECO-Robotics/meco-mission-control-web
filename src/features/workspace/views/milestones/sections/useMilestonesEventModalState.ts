import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import type { BootstrapPayload, MilestonePayload, MilestoneRecord } from "@/types";
import type { FilterSelection } from "@/features/workspace/shared/WorkspaceViewShared";
import { getMilestoneTasksForState } from "@/features/workspace/shared/milestones";
import { DEFAULT_EVENT_TYPE as DEFAULT_MILESTONE_TYPE } from "@/features/workspace/shared/milestones";
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
import { groupTasksByPlanningState } from "@/features/workspace/shared/task/taskPlanning";

export const MILESTONE_TASK_ORDER = [
  "blocked",
  "at-risk",
  "waiting-on-dependency",
  "ready",
  "overdue",
] as const;

type TaskPlanningState = (typeof MILESTONE_TASK_ORDER)[number];

type UseMilestonesMilestoneModalStateArgs = {
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onTaskEditCanceled: () => void;
  onTaskEditSaved: () => void;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  projectFilter: FilterSelection;
  scopedProjectIds: string[];
};

export type MilestonesMilestoneModalState = {
  activeMilestone: MilestoneRecord | null;
  activeMilestoneCompleteTasks: BootstrapPayload["tasks"];
  activeMilestoneTasks: BootstrapPayload["tasks"];
  cancelMilestoneEdit: () => void;
  closeMilestoneModal: () => void;
  milestoneEndDate: string;
  milestoneEndTime: string;
  milestoneError: string | null;
  milestoneModalMode: "create" | "detail" | "edit" | null;
  milestoneStartDate: string;
  milestoneStartTime: string;
  milestoneTaskGroups: Record<TaskPlanningState, BootstrapPayload["tasks"]>;
  milestoneTaskOrder: readonly TaskPlanningState[];
  handleMilestoneDelete: () => Promise<void>;
  handleMilestoneSubmit: (milestone: FormEvent<HTMLFormElement>) => Promise<void>;
  isDeletingMilestone: boolean;
  isSavingMilestone: boolean;
  milestoneDraft: TimelineMilestoneDraft;
  modalPortalTarget: HTMLElement | null;
  openCreateMilestoneModal: () => void;
  openMilestoneDetailsModal: (milestone: MilestoneRecord) => void;
  openEditMilestoneModal: (milestone: MilestoneRecord) => void;
  setMilestoneEndDate: Dispatch<SetStateAction<string>>;
  setMilestoneEndTime: Dispatch<SetStateAction<string>>;
  setMilestoneModalMode: Dispatch<SetStateAction<"create" | "detail" | "edit" | null>>;
  setMilestoneStartDate: Dispatch<SetStateAction<string>>;
  setMilestoneStartTime: Dispatch<SetStateAction<string>>;
  setMilestoneDraft: Dispatch<SetStateAction<TimelineMilestoneDraft>>;
};

export function useMilestonesMilestoneModalState({
  bootstrap,
  isAllProjectsView,
  onTaskEditCanceled,
  onTaskEditSaved,
  onDeleteTimelineMilestone,
  onSaveTimelineMilestone,
  projectFilter,
  scopedProjectIds,
}: UseMilestonesMilestoneModalStateArgs): MilestonesMilestoneModalState {
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

  const activeMilestone =
    milestoneModalMode && activeMilestoneId
      ? bootstrap.milestones.find((milestone) => milestone.id === activeMilestoneId) ?? null
      : null;
  const activeMilestoneTasks = useMemo(
    () =>
      activeMilestone ? getMilestoneTasksForState(activeMilestone, bootstrap) : [],
    [activeMilestone, bootstrap],
  );
  const activeMilestoneCompleteTasks = useMemo(
    () => activeMilestoneTasks.filter((task) => task.status === "complete"),
    [activeMilestoneTasks],
  );
  const milestoneTaskGroups = useMemo(
    () =>
      groupTasksByPlanningState(
        activeMilestoneTasks.filter((task) => task.status !== "complete"),
        bootstrap,
      ),
    [activeMilestoneTasks, bootstrap],
  );

  const closeMilestoneModal = () => {
    setMilestoneModalMode(null);
    setActiveMilestoneId(null);
    setMilestoneError(null);
    setIsSavingMilestone(false);
    setIsDeletingMilestone(false);
  };

  const cancelMilestoneEdit = () => {
    if (milestoneModalMode === "edit") {
      onTaskEditCanceled();
    }

    closeMilestoneModal();
  };

  const getDefaultMilestoneProjectIds = () =>
    isAllProjectsView && projectFilter.length > 0 ? projectFilter : scopedProjectIds;

  const openCreateMilestoneModal = () => {
    setMilestoneModalMode("create");
    setActiveMilestoneId(null);
    setMilestoneDraft({
      ...emptyTimelineMilestoneDraft(DEFAULT_MILESTONE_TYPE),
      projectIds: getDefaultMilestoneProjectIds(),
    });
    setMilestoneStartDate(localTodayDate());
    setMilestoneStartTime("18:00");
    setMilestoneEndDate("");
    setMilestoneEndTime("");
    setMilestoneError(null);
  };

  const openMilestoneDetailsModal = (milestone: MilestoneRecord) => {
    setMilestoneModalMode("detail");
    setActiveMilestoneId(milestone.id);
    setMilestoneError(null);
  };

  const openEditMilestoneModal = (milestone: MilestoneRecord) => {
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
  };

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

  const modalPortalTarget =
    typeof document !== "undefined"
      ? ((document.querySelector(".page-shell") as HTMLElement | null) ?? document.body)
      : null;

  return {
    activeMilestone,
    activeMilestoneCompleteTasks,
    activeMilestoneTasks,
    cancelMilestoneEdit,
    closeMilestoneModal,
    milestoneEndDate,
    milestoneEndTime,
    milestoneError,
    milestoneModalMode,
    milestoneStartDate,
    milestoneStartTime,
    milestoneTaskGroups,
    milestoneTaskOrder: MILESTONE_TASK_ORDER,
    handleMilestoneDelete,
    handleMilestoneSubmit,
    isDeletingMilestone,
    isSavingMilestone,
    milestoneDraft,
    modalPortalTarget,
    openCreateMilestoneModal,
    openMilestoneDetailsModal,
    openEditMilestoneModal,
    setMilestoneEndDate,
    setMilestoneEndTime,
    setMilestoneModalMode,
    setMilestoneStartDate,
    setMilestoneStartTime,
    setMilestoneDraft,
  };
}
