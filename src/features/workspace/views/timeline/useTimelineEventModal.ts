import { useCallback, useEffect, useState } from "react";
import type { MilestoneRecord } from "@/types/recordsExecution";
import { useMilestoneEditor, type MilestoneEditorArgs } from "@/features/workspace/shared/milestones/useMilestoneEditor";

interface UseTimelineMilestoneModalArgs extends MilestoneEditorArgs {
  dayMilestonesByDate: Record<string, MilestoneRecord[]>;
  openCreateTaskModal: () => void;
  triggerCreateMilestoneToken: number;
}

export function useTimelineMilestoneModal({
  dayMilestonesByDate,
  openCreateTaskModal,
  triggerCreateMilestoneToken,
  ...editorArgs
}: UseTimelineMilestoneModalArgs) {
  const editor = useMilestoneEditor(editorArgs);
  const { closeMilestoneModal, openCreateMilestoneModalForDay: openCreateMilestoneModal, openEditMilestoneModal } = editor;
  const [activeMilestoneDetail, setActiveMilestoneDetail] = useState<MilestoneRecord | null>(null);

  const openCreateMilestoneModalForDay = useCallback((day?: string) => {
    setActiveMilestoneDetail(null);
    openCreateMilestoneModal(day);
  }, [openCreateMilestoneModal]);

  useEffect(() => {
    if (triggerCreateMilestoneToken > 0) {
      openCreateMilestoneModalForDay();
    }
  }, [openCreateMilestoneModalForDay, triggerCreateMilestoneToken]);

  const openEditMilestoneModalForMilestone = useCallback((milestone: MilestoneRecord) => {
    setActiveMilestoneDetail(null);
    openEditMilestoneModal(milestone);
  }, [openEditMilestoneModal]);

  const openMilestoneModalForDay = useCallback((day: string) => {
    const milestonesOnDay = dayMilestonesByDate[day] ?? [];
    if (milestonesOnDay.length === 0) {
      openCreateMilestoneModalForDay(day);
    } else {
      openEditMilestoneModalForMilestone(milestonesOnDay[0]);
    }
  }, [dayMilestonesByDate, openCreateMilestoneModalForDay, openEditMilestoneModalForMilestone]);

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

  return {
    activeMilestoneId: editor.activeMilestoneId,
    cancelMilestoneEdit: editor.cancelMilestoneEdit,
    closeMilestoneModal: editor.closeMilestoneModal,
    milestoneDraft: editor.milestoneDraft,
    milestoneEndDate: editor.milestoneEndDate,
    milestoneEndTime: editor.milestoneEndTime,
    milestoneError: editor.milestoneError,
    milestoneModalMode: editor.milestoneModalMode,
    milestoneStartDate: editor.milestoneStartDate,
    milestoneStartTime: editor.milestoneStartTime,
    handleMilestoneDelete: editor.handleMilestoneDelete,
    handleMilestoneSubmit: editor.handleMilestoneSubmit,
    isDeletingMilestone: editor.isDeletingMilestone,
    isSavingMilestone: editor.isSavingMilestone,
    setMilestoneDraft: editor.setMilestoneDraft,
    setMilestoneEndDate: editor.setMilestoneEndDate,
    setMilestoneEndTime: editor.setMilestoneEndTime,
    setMilestoneStartDate: editor.setMilestoneStartDate,
    setMilestoneStartTime: editor.setMilestoneStartTime,
    activeMilestoneDetail,
    closeMilestoneDetailModal,
    openMilestoneModalForDay,
    openMilestoneDetailModalForMilestone,
    openEditMilestoneModalForMilestone,
    switchMilestoneCreateToTask,
  };
}
