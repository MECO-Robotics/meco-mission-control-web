import { useCallback } from "react";

import { buildEmptyPartInstancePayload } from "@/lib/appUtils/payloadBuilders";
import { partInstanceToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createPartInstanceRecord, updatePartInstanceRecord } from "@/lib/auth/records/parts";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { MechanismRecord } from "@/types/recordsOrganization";
import type { PartInstancePayload } from "@/types/payloads";
import type { PartInstanceRecord } from "@/types/recordsInventory";

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

  const handlePartInstanceSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
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

  const removePartInstanceFromMechanism = useCallback(async (partInstanceId: string) => {
    const previousPartInstance = model.bootstrap.partInstances.find(
      (partInstance) => partInstance.id === partInstanceId,
    );
    if (!previousPartInstance || !previousPartInstance.mechanismId) {
      return false;
    }

    const optimisticPartInstance: PartInstanceRecord = {
      ...previousPartInstance,
      mechanismId: null,
    };

    model.setBootstrap((current) => ({
      ...current,
      partInstances: current.partInstances.map((partInstance) =>
        partInstance.id === partInstanceId ? optimisticPartInstance : partInstance,
      ),
    }));

    try {
      const updatedPartInstance = await updatePartInstanceRecord(
        partInstanceId,
        { mechanismId: null },
        model.handleUnauthorized,
      );

      model.setBootstrap((current) => ({
        ...current,
        partInstances: current.partInstances.map((partInstance) =>
          partInstance.id === partInstanceId ? { ...partInstance, ...updatedPartInstance } : partInstance,
        ),
      }));
      return true;
    } catch (error) {
      model.setBootstrap((current) => ({
        ...current,
        partInstances: current.partInstances.map((partInstance) =>
          partInstance.id === partInstanceId ? previousPartInstance : partInstance,
        ),
      }));
      model.setDataMessage(toErrorMessage(error));
      return false;
    }
  }, [model]);

  return {
    closePartInstanceModal,
    handlePartInstanceSubmit,
    openCreatePartInstanceModal,
    openEditPartInstanceModal,
    removePartInstanceFromMechanism,
  };
}
