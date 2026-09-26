import { useCallback } from "react";
import { createMeetingRecord, createMilestoneRecord, deleteMilestoneRecord, updateMilestoneRecord } from "@/lib/auth/records/event";
import type { MeetingPayload, MilestonePayload } from "@/types/payloads";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";

export function useWorkspaceEventActions({ handleUnauthorized, loadWorkspace }: {
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
}) {
  const handleTimelineMilestoneSave = useCallback(
    async (mode: "create" | "edit", milestoneId: string | null, payload: MilestonePayload) => {
      if (mode === "create") {
        await createMilestoneRecord(payload, handleUnauthorized);
      } else if (milestoneId) {
        await updateMilestoneRecord(milestoneId, payload, handleUnauthorized);
      }

      await loadWorkspace();
    },
    [handleUnauthorized, loadWorkspace],
  );

  const handleTimelineMilestoneDelete = useCallback(
    async (milestoneId: string) => {
      await deleteMilestoneRecord(milestoneId, handleUnauthorized);
      await loadWorkspace();
    },
    [handleUnauthorized, loadWorkspace],
  );

  const handleMeetingSave = useCallback(
    async (payload: MeetingPayload) => {
      await createMeetingRecord(payload, handleUnauthorized);
      await loadWorkspace();
    },
    [handleUnauthorized, loadWorkspace],
  );

  return { handleTimelineMilestoneSave, handleTimelineMilestoneDelete, handleMeetingSave };
}
