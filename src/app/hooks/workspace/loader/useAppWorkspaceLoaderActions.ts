import { useCallback } from "react";

import type { AppWorkspaceLoaderModel } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import type { BootstrapPayload } from "@/types/bootstrap";
import { getRosterLinkedMemberId } from "@/lib/appUtils/common";
import {
  buildEditCanceledNotice,
  buildMilestoneEditSuccessNotice,
} from "@/features/workspace/workspaceEditToastNotice";

export function useAppWorkspaceLoaderActions(
  state: AppWorkspaceState,
  model: AppWorkspaceLoaderModel,
) {
  const clearDataMessage = useCallback(() => {
    state.setDataMessage(null);
  }, [state]);

  const clearTaskEditNotice = useCallback(() => {
    state.clearTaskEditNotices();
  }, [state]);

  const notifyTaskEditCanceled = useCallback(() => {
    state.enqueueTaskEditNotice(buildEditCanceledNotice());
  }, [state]);

  const notifyTaskEditSaved = useCallback(() => {
    state.enqueueTaskEditNotice(buildMilestoneEditSuccessNotice());
  }, [state]);

  const selectMember = useCallback((memberId: string | null, payload: BootstrapPayload) => {
    const member = payload.members.find((candidate) => candidate.id === memberId) ?? null;
    state.setSelectedMemberId(member?.id ?? null);
    state.setMemberEditDraft(
      member
        ? {
            name: member.name,
            email: member.email,
            photoUrl: member.photoUrl ?? "",
            role: member.role,
            elevated: member.elevated,
            disciplineId: member.disciplineId ?? null,
            plannedWeeklyAttendanceHours: member.plannedWeeklyAttendanceHours ?? 0,
            plannedAttendanceDays: member.plannedAttendanceDays ?? [],
            plannedAttendanceNotes: member.plannedAttendanceNotes ?? "",
          }
        : null,
    );
  }, [state]);

  const toggleMyView = useCallback(() => {
    const rosterLinkedSignedInMemberId = getRosterLinkedMemberId(
      model.scopedBootstrap.members,
      model.signedInMember,
    );

    if (!rosterLinkedSignedInMemberId) {
      const nextIsActive = !state.isUnmatchedMyViewActive;
      state.setActivePersonFilter([]);
      state.setIsUnmatchedMyViewActive(nextIsActive);
      if (nextIsActive) {
        state.enqueueTaskEditNotice({
          title: "My View Notice",
          message: "No roster member is linked to this account yet.",
          tone: "info",
        });
      }
      return;
    }

    state.setIsUnmatchedMyViewActive(false);
    state.setDataMessage(null);
    state.setActivePersonFilter((current) =>
      current.length === 1 && current[0] === rosterLinkedSignedInMemberId
        ? []
        : [rosterLinkedSignedInMemberId],
    );
  }, [model.scopedBootstrap.members, model.signedInMember, state]);

  return {
    clearDataMessage,
    clearTaskEditNotice,
    notifyTaskEditCanceled,
    notifyTaskEditSaved,
    selectMember,
    toggleMyView,
  };
}
