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

export function usePartInstanceActions({
  activePartInstanceId,
  bootstrap,
  handleUnauthorized,
  loadWorkspace,
  partInstanceDraft,
  partInstanceModalMode,
  setActivePartInstanceId,
  setBootstrap,
  setDataMessage,
  setIsSavingPartInstance,
  setPartInstanceDraft,
  setPartInstanceModalMode,
}: {
  activePartInstanceId: AppWorkspaceModel["activePartInstanceId"];
  bootstrap: AppWorkspaceModel["bootstrap"];
  handleUnauthorized: AppWorkspaceModel["handleUnauthorized"];
  loadWorkspace: AppWorkspaceModel["loadWorkspace"];
  partInstanceDraft: AppWorkspaceModel["partInstanceDraft"];
  partInstanceModalMode: AppWorkspaceModel["partInstanceModalMode"];
  setActivePartInstanceId: AppWorkspaceModel["setActivePartInstanceId"];
  setBootstrap: AppWorkspaceModel["setBootstrap"];
  setDataMessage: AppWorkspaceModel["setDataMessage"];
  setIsSavingPartInstance: AppWorkspaceModel["setIsSavingPartInstance"];
  setPartInstanceDraft: AppWorkspaceModel["setPartInstanceDraft"];
  setPartInstanceModalMode: AppWorkspaceModel["setPartInstanceModalMode"];
}) {
  const openCreatePartInstanceModal = useCallback((mechanism: MechanismRecord, partDefinitionId?: string) => {
    setActivePartInstanceId(null);
    setPartInstanceDraft(
      {
        ...buildEmptyPartInstancePayload(bootstrap, { subsystemId: mechanism.subsystemId, mechanismId: mechanism.id }),
        ...(partDefinitionId ? { partDefinitionId } : {}),
      },
    );
    setPartInstanceModalMode("create");
  }, [bootstrap, setActivePartInstanceId, setPartInstanceDraft, setPartInstanceModalMode]);

  const openEditPartInstanceModal = useCallback((partInstance: PartInstanceRecord) => {
    setActivePartInstanceId(partInstance.id);
    setPartInstanceDraft(partInstanceToPayload(partInstance));
    setPartInstanceModalMode("edit");
  }, [setActivePartInstanceId, setPartInstanceDraft, setPartInstanceModalMode]);

  const closePartInstanceModal = useCallback(() => {
    setPartInstanceModalMode(null);
    setActivePartInstanceId(null);
  }, [setActivePartInstanceId, setPartInstanceModalMode]);

  const handlePartInstanceSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    setIsSavingPartInstance(true);
    setDataMessage(null);

    try {
      const selectedPartDefinition = bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === partInstanceDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        setDataMessage("Please choose a real part from the Parts tab before saving the part instance.");
        return;
      }

      if (!partInstanceDraft.mechanismId) {
        setDataMessage("Please choose a mechanism before saving the part instance.");
        return;
      }

      const payload: PartInstancePayload = {
        ...partInstanceDraft,
        name: partInstanceDraft.name.trim(),
      };

      if (partInstanceModalMode === "create") {
        await createPartInstanceRecord(payload, handleUnauthorized);
      } else if (partInstanceModalMode === "edit" && activePartInstanceId) {
        await updatePartInstanceRecord(
          activePartInstanceId,
          payload,
          handleUnauthorized,
        );
      }

      await loadWorkspace();
      closePartInstanceModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPartInstance(false);
    }
  }, [activePartInstanceId, bootstrap, closePartInstanceModal, handleUnauthorized, loadWorkspace, partInstanceDraft, partInstanceModalMode, setDataMessage, setIsSavingPartInstance]);

  const removePartInstanceFromMechanism = useCallback(async (partInstanceId: string) => {
    const previousPartInstance = bootstrap.partInstances.find(
      (partInstance) => partInstance.id === partInstanceId,
    );
    if (!previousPartInstance || !previousPartInstance.mechanismId) {
      return false;
    }

    const optimisticPartInstance: PartInstanceRecord = {
      ...previousPartInstance,
      mechanismId: null,
    };

    setBootstrap((current) => ({
      ...current,
      partInstances: current.partInstances.map((partInstance) =>
        partInstance.id === partInstanceId ? optimisticPartInstance : partInstance,
      ),
    }));

    try {
      const updatedPartInstance = await updatePartInstanceRecord(
        partInstanceId,
        { mechanismId: null },
        handleUnauthorized,
      );

      setBootstrap((current) => ({
        ...current,
        partInstances: current.partInstances.map((partInstance) =>
          partInstance.id === partInstanceId ? { ...partInstance, ...updatedPartInstance } : partInstance,
        ),
      }));
      return true;
    } catch (error) {
      setBootstrap((current) => ({
        ...current,
        partInstances: current.partInstances.map((partInstance) =>
          partInstance.id === partInstanceId ? previousPartInstance : partInstance,
        ),
      }));
      setDataMessage(toErrorMessage(error));
      return false;
    }
  }, [bootstrap, handleUnauthorized, setBootstrap, setDataMessage]);

  return {
    closePartInstanceModal,
    handlePartInstanceSubmit,
    openCreatePartInstanceModal,
    openEditPartInstanceModal,
    removePartInstanceFromMechanism,
  };
}
