import { useCallback } from "react";

import { buildEmptyPartDefinitionPayload } from "@/lib/appUtils/payloadBuilders";
import { partDefinitionToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createPartDefinitionRecord, deletePartDefinitionRecord, updatePartDefinitionRecord } from "@/lib/auth/records/parts";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { PartDefinitionRecord } from "@/types/recordsInventory";

export type PartDefinitionActions = ReturnType<typeof usePartDefinitionActions>;

export function usePartDefinitionActions({
  activePartDefinitionId,
  bootstrap,
  handleUnauthorized,
  loadWorkspace,
  partDefinitionDraft,
  partDefinitionModalMode,
  selectedSeasonId,
  setActivePartDefinitionId,
  setDataMessage,
  setIsDeletingPartDefinition,
  setIsSavingPartDefinition,
  setPartDefinitionDraft,
  setPartDefinitionModalMode,
}: {
  activePartDefinitionId: AppWorkspaceModel["activePartDefinitionId"];
  bootstrap: AppWorkspaceModel["bootstrap"];
  handleUnauthorized: AppWorkspaceModel["handleUnauthorized"];
  loadWorkspace: AppWorkspaceModel["loadWorkspace"];
  partDefinitionDraft: AppWorkspaceModel["partDefinitionDraft"];
  partDefinitionModalMode: AppWorkspaceModel["partDefinitionModalMode"];
  selectedSeasonId: AppWorkspaceModel["selectedSeasonId"];
  setActivePartDefinitionId: AppWorkspaceModel["setActivePartDefinitionId"];
  setDataMessage: AppWorkspaceModel["setDataMessage"];
  setIsDeletingPartDefinition: AppWorkspaceModel["setIsDeletingPartDefinition"];
  setIsSavingPartDefinition: AppWorkspaceModel["setIsSavingPartDefinition"];
  setPartDefinitionDraft: AppWorkspaceModel["setPartDefinitionDraft"];
  setPartDefinitionModalMode: AppWorkspaceModel["setPartDefinitionModalMode"];
}) {
  const openCreatePartDefinitionModal = useCallback(() => {
    setActivePartDefinitionId(null);
    setPartDefinitionDraft(buildEmptyPartDefinitionPayload(bootstrap));
    setPartDefinitionModalMode("create");
  }, [bootstrap, setActivePartDefinitionId, setPartDefinitionDraft, setPartDefinitionModalMode]);

  const openEditPartDefinitionModal = useCallback((item: PartDefinitionRecord) => {
    setActivePartDefinitionId(item.id);
    setPartDefinitionDraft(partDefinitionToPayload(item));
    setPartDefinitionModalMode("edit");
  }, [setActivePartDefinitionId, setPartDefinitionDraft, setPartDefinitionModalMode]);

  const closePartDefinitionModal = useCallback(() => {
    setPartDefinitionModalMode(null);
    setActivePartDefinitionId(null);
  }, [setActivePartDefinitionId, setPartDefinitionModalMode]);

  const handlePartDefinitionSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (partDefinitionModalMode === "create" && !selectedSeasonId) {
      setDataMessage("Pick a season before adding a part definition.");
      return;
    }

    setIsSavingPartDefinition(true);
    setDataMessage(null);

    try {
      if (partDefinitionModalMode === "create") {
        await createPartDefinitionRecord(
          {
            ...partDefinitionDraft,
            seasonId: selectedSeasonId ?? partDefinitionDraft.seasonId,
            activeSeasonIds: selectedSeasonId
              ? [selectedSeasonId]
              : partDefinitionDraft.activeSeasonIds,
          },
          handleUnauthorized,
        );
      } else if (partDefinitionModalMode === "edit" && activePartDefinitionId) {
        await updatePartDefinitionRecord(
          activePartDefinitionId,
          partDefinitionDraft,
          handleUnauthorized,
        );
      }

      await loadWorkspace();
      closePartDefinitionModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPartDefinition(false);
    }
  }, [activePartDefinitionId, closePartDefinitionModal, handleUnauthorized, loadWorkspace, partDefinitionDraft, partDefinitionModalMode, selectedSeasonId, setDataMessage, setIsSavingPartDefinition]);

  const handleDeletePartDefinition = useCallback(async (partDefinitionId: string) => {
    setIsDeletingPartDefinition(true);
    setDataMessage(null);

    try {
      await deletePartDefinitionRecord(partDefinitionId, handleUnauthorized);
      if (activePartDefinitionId === partDefinitionId) {
        closePartDefinitionModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingPartDefinition(false);
    }
  }, [activePartDefinitionId, closePartDefinitionModal, handleUnauthorized, loadWorkspace, setDataMessage, setIsDeletingPartDefinition]);

  const handleTogglePartDefinitionArchived = useCallback(async (partDefinitionId: string) => {
    const currentPartDefinition = bootstrap.partDefinitions.find(
      (partDefinition) => partDefinition.id === partDefinitionId,
    );
    if (!currentPartDefinition) {
      return;
    }

    setIsSavingPartDefinition(true);
    setDataMessage(null);

    try {
      await updatePartDefinitionRecord(
        partDefinitionId,
        { isArchived: !currentPartDefinition.isArchived },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingPartDefinition(false);
    }
  }, [bootstrap, handleUnauthorized, loadWorkspace, setDataMessage, setIsSavingPartDefinition]);

  return {
    closePartDefinitionModal,
    handleDeletePartDefinition,
    handlePartDefinitionSubmit,
    handleTogglePartDefinitionArchived,
    openCreatePartDefinitionModal,
    openEditPartDefinitionModal,
  };
}
