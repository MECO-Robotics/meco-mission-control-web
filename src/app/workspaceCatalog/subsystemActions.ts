import { useCallback } from "react";

import { buildEmptySubsystemPayload } from "@/lib/appUtils/payloadBuilders";
import { splitList, toErrorMessage } from "@/lib/appUtils/common";
import { subsystemToPayload } from "@/lib/appUtils/payloadConversions";
import { createSubsystemRecord, updateSubsystemRecord } from "@/lib/auth/records/structure";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { SubsystemPayload } from "@/types/payloads";
import type { SubsystemRecord } from "@/types/recordsOrganization";

export type SubsystemActions = ReturnType<typeof useSubsystemActions>;

export function useSubsystemActions(model: AppWorkspaceModel) {
  const openCreateSubsystemModal = useCallback(() => {
    model.setActiveSubsystemId(null);
    model.setSubsystemDraft(buildEmptySubsystemPayload(model.scopedBootstrap));
    model.setSubsystemDraftRisks("");
    model.setSubsystemModalMode("create");
  }, [model]);

  const openEditSubsystemModal = useCallback((subsystem: SubsystemRecord) => {
    model.setActiveSubsystemId(subsystem.id);
    model.setSubsystemDraft(subsystemToPayload(subsystem));
    model.setSubsystemDraftRisks(subsystem.risks.join("\n"));
    model.setSubsystemModalMode("edit");
  }, [model]);

  const closeSubsystemModal = useCallback(() => {
    model.setSubsystemModalMode(null);
    model.setActiveSubsystemId(null);
  }, [model]);

  const handleSubsystemSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (model.subsystemModalMode === "create" && !model.selectedProjectId) {
      model.setDataMessage("Pick a project before adding a subsystem.");
      return;
    }

    model.setIsSavingSubsystem(true);
    model.setDataMessage(null);

    try {
      const payload: SubsystemPayload = {
        ...model.subsystemDraft,
        projectId: model.selectedProjectId ?? model.subsystemDraft.projectId,
        risks: splitList(model.subsystemDraftRisks),
      };

      if (model.subsystemModalMode === "create") {
        await createSubsystemRecord(payload, model.handleUnauthorized);
      } else if (model.subsystemModalMode === "edit" && model.activeSubsystemId) {
        await updateSubsystemRecord(model.activeSubsystemId, payload, model.handleUnauthorized);
      }

      await model.loadWorkspace();
      closeSubsystemModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingSubsystem(false);
    }
  }, [closeSubsystemModal, model]);

  const handleToggleSubsystemArchived = useCallback(async (subsystemId: string) => {
    const currentSubsystem = model.bootstrap.subsystems.find(
      (subsystem) => subsystem.id === subsystemId,
    );
    if (!currentSubsystem) {
      return;
    }

    model.setIsSavingSubsystem(true);
    model.setDataMessage(null);

    try {
      await updateSubsystemRecord(
        subsystemId,
        { isArchived: !currentSubsystem.isArchived },
        model.handleUnauthorized,
      );
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingSubsystem(false);
    }
  }, [model]);

  return {
    closeSubsystemModal,
    handleSubsystemSubmit,
    handleToggleSubsystemArchived,
    openCreateSubsystemModal,
    openEditSubsystemModal,
  };
}
