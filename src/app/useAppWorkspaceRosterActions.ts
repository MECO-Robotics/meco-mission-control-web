// @ts-nocheck
import { useCallback } from "react";

import { getMemberActiveSeasonIds, toErrorMessage } from "@/lib/appUtils";
import {
  createMemberRecord,
  createProjectRecord,
  createSeasonRecord,
  deleteMemberRecord,
  updateMemberRecord,
  updateProjectRecord,
} from "@/lib/auth";
import type { AppWorkspaceModel } from "@/app/useAppWorkspaceModel";
import { isElevatedMemberRole } from "@/app/workspaceStateUtils";
import type { ProjectPayload } from "@/types";

export type AppWorkspaceRosterActions = ReturnType<typeof useAppWorkspaceRosterActions>;

export function useAppWorkspaceRosterActions(model: AppWorkspaceModel) {
  const handleCreateSeason = useCallback(() => {
    model.setDataMessage(null);
    model.setSeasonNameDraft("");
    model.setIsAddSeasonPopupOpen(true);
  }, [model]);

  const closeCreateSeasonPopup = useCallback(() => {
    if (model.isSavingSeason) {
      return;
    }

    model.setIsAddSeasonPopupOpen(false);
    model.setSeasonNameDraft("");
  }, [model]);

  const handleCreateSeasonSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const seasonName = model.seasonNameDraft.trim();
    if (seasonName.length < 2) {
      model.setDataMessage("Season names need at least 2 characters.");
      return;
    }

    model.setIsSavingSeason(true);
    model.setDataMessage(null);

    try {
      const season = await createSeasonRecord({ name: seasonName }, model.handleUnauthorized);
      await model.loadWorkspace();
      model.setSelectedSeasonId(season.id);
      model.setSelectedProjectId(null);
      model.setIsAddSeasonPopupOpen(false);
      model.setSeasonNameDraft("");
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingSeason(false);
    }
  }, [model]);

  const handleCreateRobot = useCallback(() => {
    if (!model.selectedSeasonId) {
      model.setDataMessage("Pick a season before adding a robot.");
      return;
    }

    model.setDataMessage(null);
    model.setRobotProjectNameDraft("");
    model.setRobotProjectModalMode("create");
  }, [model]);

  const handleEditSelectedRobot = useCallback(() => {
    if (model.selectedProject?.projectType !== "robot") {
      return;
    }

    model.setDataMessage(null);
    model.setRobotProjectNameDraft(model.selectedProject.name);
    model.setRobotProjectModalMode("edit");
  }, [model]);

  const closeRobotProjectPopup = useCallback(() => {
    if (model.isSavingRobotProject) {
      return;
    }

    model.setRobotProjectModalMode(null);
    model.setRobotProjectNameDraft("");
  }, [model]);

  const handleRobotProjectSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const robotName = model.robotProjectNameDraft.trim();
    if (robotName.length < 2) {
      model.setDataMessage("Robot names need at least 2 characters.");
      return;
    }

    if (model.robotProjectModalMode === "create" && !model.selectedSeasonId) {
      model.setDataMessage("Pick a season before adding a robot.");
      return;
    }

    if (model.robotProjectModalMode === "edit" && model.selectedProject?.projectType !== "robot") {
      model.setDataMessage("Select a robot before editing its name.");
      return;
    }

    model.setIsSavingRobotProject(true);
    model.setDataMessage(null);

    try {
      if (model.robotProjectModalMode === "create" && model.selectedSeasonId) {
        const project = await createProjectRecord(
          {
            seasonId: model.selectedSeasonId,
            name: robotName,
            projectType: "robot",
            status: "active",
          },
          model.handleUnauthorized,
        );
        await model.loadWorkspace();
        model.setSelectedProjectId(project.id);
      } else if (model.robotProjectModalMode === "edit" && model.selectedProject) {
        const payload: ProjectPayload = {
          name: robotName,
        };
        const project = await updateProjectRecord(
          model.selectedProject.id,
          payload,
          model.handleUnauthorized,
        );
        await model.loadWorkspace();
        model.setSelectedProjectId(project.id);
      }

      model.setRobotProjectModalMode(null);
      model.setRobotProjectNameDraft("");
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingRobotProject(false);
    }
  }, [model]);

  const handleCreateMember = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
  }, [model]);

  const handleUpdateMember = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
  }, [model]);

  const handleDeleteMember = useCallback(async (memberId: string) => {
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
  }, [model]);

  const handleReactivateMemberForSeason = useCallback(async (memberId: string) => {
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
  }, [model]);

  return {
    closeCreateSeasonPopup,
    closeRobotProjectPopup,
    handleCreateMember,
    handleCreateRobot,
    handleCreateSeason,
    handleCreateSeasonSubmit,
    handleDeleteMember,
    handleEditSelectedRobot,
    handleReactivateMemberForSeason,
    handleRobotProjectSubmit,
    handleUpdateMember,
  };
}
