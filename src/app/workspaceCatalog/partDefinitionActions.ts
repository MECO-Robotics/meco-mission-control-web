import { useCallback } from "react";

import { buildEmptyPartDefinitionPayload } from "@/lib/appUtils/payloadBuilders";
import { partDefinitionToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createPartDefinitionRecord, deletePartDefinitionRecord, updatePartDefinitionRecord } from "@/lib/auth/records/parts";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { PartDefinitionRecord } from "@/types/recordsInventory";

export type PartDefinitionActions = ReturnType<typeof usePartDefinitionActions>;

export function usePartDefinitionActions(model: AppWorkspaceModel) {
  const openCreatePartDefinitionModal = useCallback(() => {
    model.setActivePartDefinitionId(null);
    model.setPartDefinitionDraft(buildEmptyPartDefinitionPayload(model.bootstrap));
    model.setPartDefinitionModalMode("create");
  }, [model]);

  const openEditPartDefinitionModal = useCallback((item: PartDefinitionRecord) => {
    model.setActivePartDefinitionId(item.id);
    model.setPartDefinitionDraft(partDefinitionToPayload(item));
    model.setPartDefinitionModalMode("edit");
  }, [model]);

  const closePartDefinitionModal = useCallback(() => {
    model.setPartDefinitionModalMode(null);
    model.setActivePartDefinitionId(null);
  }, [model]);

  const handlePartDefinitionSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (model.partDefinitionModalMode === "create" && !model.selectedSeasonId) {
      model.setDataMessage("Pick a season before adding a part definition.");
      return;
    }

    model.setIsSavingPartDefinition(true);
    model.setDataMessage(null);

    try {
      if (model.partDefinitionModalMode === "create") {
        await createPartDefinitionRecord(
          {
            ...model.partDefinitionDraft,
            seasonId: model.selectedSeasonId ?? model.partDefinitionDraft.seasonId,
            activeSeasonIds: model.selectedSeasonId
              ? [model.selectedSeasonId]
              : model.partDefinitionDraft.activeSeasonIds,
          },
          model.handleUnauthorized,
        );
      } else if (model.partDefinitionModalMode === "edit" && model.activePartDefinitionId) {
        await updatePartDefinitionRecord(
          model.activePartDefinitionId,
          model.partDefinitionDraft,
          model.handleUnauthorized,
        );
      }

      await model.loadWorkspace();
      closePartDefinitionModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingPartDefinition(false);
    }
  }, [closePartDefinitionModal, model]);

  const handleDeletePartDefinition = useCallback(async (partDefinitionId: string) => {
    model.setIsDeletingPartDefinition(true);
    model.setDataMessage(null);

    try {
      await deletePartDefinitionRecord(partDefinitionId, model.handleUnauthorized);
      if (model.activePartDefinitionId === partDefinitionId) {
        closePartDefinitionModal();
      }
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsDeletingPartDefinition(false);
    }
  }, [closePartDefinitionModal, model]);

  const handleTogglePartDefinitionArchived = useCallback(async (partDefinitionId: string) => {
    const currentPartDefinition = model.bootstrap.partDefinitions.find(
      (partDefinition) => partDefinition.id === partDefinitionId,
    );
    if (!currentPartDefinition) {
      return;
    }

    model.setIsSavingPartDefinition(true);
    model.setDataMessage(null);

    try {
      await updatePartDefinitionRecord(
        partDefinitionId,
        { isArchived: !currentPartDefinition.isArchived },
        model.handleUnauthorized,
      );
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingPartDefinition(false);
    }
  }, [model]);

  return {
    closePartDefinitionModal,
    handleDeletePartDefinition,
    handlePartDefinitionSubmit,
    handleTogglePartDefinitionArchived,
    openCreatePartDefinitionModal,
    openEditPartDefinitionModal,
  };
}
