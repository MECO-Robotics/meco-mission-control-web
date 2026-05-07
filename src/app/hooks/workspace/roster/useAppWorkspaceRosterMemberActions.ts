import { useCallback, type FormEvent } from "react";

import { getMemberActiveSeasonIds, toErrorMessage } from "@/lib/appUtils/common";
import { createMemberRecord, deleteMemberRecord, updateMemberRecord } from "@/lib/auth/records/planning";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { isElevatedMemberRole } from "@/app/state/workspaceMemberRoleUtils";

export function useAppWorkspaceRosterMemberActions(model: AppWorkspaceModel) {
  const handleCreateMember = useCallback(
    async (milestone: FormEvent<HTMLFormElement>) => {
      milestone.preventDefault();
      if (!model.selectedSeasonId) {
        model.setDataMessage("Pick a season before adding a roster member.");
        return;
      }

      model.setIsSavingMember(true);
      model.setDataMessage(null);

      try {
        const normalizedRole = model.memberForm.role;
        await createMemberRecord(
          {
            name: model.memberForm.name.trim(),
            email: model.memberForm.email.trim(),
            photoUrl: model.memberForm.photoUrl.trim(),
            role: normalizedRole,
            elevated: isElevatedMemberRole(normalizedRole),
            seasonId: model.selectedSeasonId,
            activeSeasonIds: [model.selectedSeasonId],
          },
          model.handleUnauthorized,
        );
        model.setMemberForm({ name: "", email: "", photoUrl: "", role: "student", elevated: false });
        model.setIsAddPersonOpen(false);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsSavingMember(false);
      }
    },
    [model],
  );

  const handleUpdateMember = useCallback(
    async (milestone: FormEvent<HTMLFormElement>) => {
      milestone.preventDefault();
      if (!model.selectedMemberId || !model.memberEditDraft) {
        return;
      }

      model.setIsSavingMember(true);
      model.setDataMessage(null);

      try {
        const normalizedRole = model.memberEditDraft.role;
        await updateMemberRecord(
          model.selectedMemberId,
          {
            name: model.memberEditDraft.name.trim(),
            email: model.memberEditDraft.email.trim(),
            photoUrl: model.memberEditDraft.photoUrl.trim(),
            role: normalizedRole,
            elevated: isElevatedMemberRole(normalizedRole),
          },
          model.handleUnauthorized,
        );
        model.setIsEditPersonOpen(false);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsSavingMember(false);
      }
    },
    [model],
  );

  const handleDeleteMember = useCallback(
    async (memberId: string) => {
      if (!memberId) {
        return;
      }

      model.setIsDeletingMember(true);
      model.setDataMessage(null);

      try {
        await deleteMemberRecord(memberId, model.handleUnauthorized);
        if (model.activePersonFilter.includes(memberId)) {
          model.setActivePersonFilter((current) => current.filter((id) => id !== memberId));
        }
        if (model.selectedMemberId === memberId) {
          model.setSelectedMemberId(null);
          model.setMemberEditDraft(null);
          model.setIsEditPersonOpen(false);
        }
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsDeletingMember(false);
      }
    },
    [model],
  );

  const handleReactivateMemberForSeason = useCallback(
    async (memberId: string) => {
      if (!model.selectedSeasonId) {
        model.setDataMessage("Pick a season before reactivating a roster member.");
        return;
      }

      const member = model.bootstrap.members.find((candidate) => candidate.id === memberId);
      if (!member) {
        model.setDataMessage("Select a valid inactive roster member to reactivate.");
        return;
      }

      const activeSeasonIds = getMemberActiveSeasonIds(member);
      if (activeSeasonIds.includes(model.selectedSeasonId)) {
        model.setDataMessage("That person is already active in this season.");
        return;
      }

      model.setIsSavingMember(true);
      model.setDataMessage(null);

      try {
        await updateMemberRecord(
          member.id,
          {
            activeSeasonIds: [...activeSeasonIds, model.selectedSeasonId],
          },
          model.handleUnauthorized,
        );
        model.setIsAddPersonOpen(false);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      } finally {
        model.setIsSavingMember(false);
      }
    },
    [model],
  );

  return {
    handleCreateMember,
    handleDeleteMember,
    handleReactivateMemberForSeason,
    handleUpdateMember,
  };
}
