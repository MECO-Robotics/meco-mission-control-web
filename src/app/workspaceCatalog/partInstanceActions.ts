// @ts-nocheck
import { useCallback } from "react";

import { buildEmptyPartInstancePayload, partInstanceToPayload, toErrorMessage } from "@/lib/appUtils";
import { createPartInstanceRecord, updatePartInstanceRecord } from "@/lib/auth";
import type { AppWorkspaceModel } from "../useAppWorkspaceModel";
import type { MechanismRecord, PartInstancePayload, PartInstanceRecord } from "@/types";

export type PartInstanceActions = ReturnType<typeof usePartInstanceActions>;

export function usePartInstanceActions(model: AppWorkspaceModel) {
  const openCreatePartInstanceModal = useCallback((mechanism: MechanismRecord) => {
    model.setActivePartInstanceId(null);
    model.setPartInstanceDraft(
      buildEmptyPartInstancePayload(model.bootstrap, {
        subsystemId: mechanism.subsystemId,
        mechanismId: mechanism.id,
      }),
    );
    model.setPartInstanceModalMode("create");
  }, [model]);

  const openEditPartInstanceModal = useCallback((partInstance: PartInstanceRecord) => {
    model.setActivePartInstanceId(partInstance.id);
    model.setPartInstanceDraft(partInstanceToPayload(partInstance));
    model.setPartInstanceModalMode("edit");
  }, [model]);

  const closePartInstanceModal = useCallback(() => {
    model.setPartInstanceModalMode(null);
    model.setActivePartInstanceId(null);
  }, [model]);

  const handlePartInstanceSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    model.setIsSavingPartInstance(true);
    model.setDataMessage(null);

    try {
      const selectedPartDefinition = model.bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === model.partInstanceDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        model.setDataMessage("Please choose a real part from the Parts tab before saving the part instance.");
        return;
      }

      if (!model.partInstanceDraft.mechanismId) {
        model.setDataMessage("Please choose a mechanism before saving the part instance.");
        return;
      }

      const payload: PartInstancePayload = {
        ...model.partInstanceDraft,
        name: model.partInstanceDraft.name.trim(),
      };

      if (model.partInstanceModalMode === "create") {
        await createPartInstanceRecord(payload, model.handleUnauthorized);
      } else if (model.partInstanceModalMode === "edit" && model.activePartInstanceId) {
        await updatePartInstanceRecord(
          model.activePartInstanceId,
          payload,
          model.handleUnauthorized,
        );
      }

      await model.loadWorkspace();
      closePartInstanceModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingPartInstance(false);
    }
  }, [closePartInstanceModal, model]);

  return {
    closePartInstanceModal,
    handlePartInstanceSubmit,
    openCreatePartInstanceModal,
    openEditPartInstanceModal,
  };
}
