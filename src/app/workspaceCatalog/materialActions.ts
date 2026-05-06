import { useCallback } from "react";

import { buildEmptyMaterialPayload } from "@/lib/appUtils/payloadBuilders";
import { materialToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createMaterialRecord, deleteMaterialRecord, updateMaterialRecord } from "@/lib/auth/records/inventory";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { MaterialPayload } from "@/types/payloads";
import type { MaterialRecord } from "@/types/recordsInventory";

export type MaterialActions = ReturnType<typeof useMaterialActions>;

export function useMaterialActions(model: AppWorkspaceModel) {
  const openCreateMaterialModal = useCallback(() => {
    model.setActiveMaterialId(null);
    model.setMaterialDraft(buildEmptyMaterialPayload());
    model.setMaterialModalMode("create");
  }, [model]);

  const openEditMaterialModal = useCallback((item: MaterialRecord) => {
    model.setActiveMaterialId(item.id);
    model.setMaterialDraft(materialToPayload(item));
    model.setMaterialModalMode("edit");
  }, [model]);

  const closeMaterialModal = useCallback(() => {
    model.setMaterialModalMode(null);
    model.setActiveMaterialId(null);
  }, [model]);

  const handleMaterialSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    model.setIsSavingMaterial(true);
    model.setDataMessage(null);

    try {
      const payload: MaterialPayload =
        model.materialModalMode === "create"
          ? {
              ...model.materialDraft,
              reorderPoint: Math.floor(model.materialDraft.onHandQuantity / 2),
            }
          : model.materialDraft;

      if (model.materialModalMode === "create") {
        await createMaterialRecord(payload, model.handleUnauthorized);
      } else if (model.materialModalMode === "edit" && model.activeMaterialId) {
        await updateMaterialRecord(model.activeMaterialId, payload, model.handleUnauthorized);
      }

      await model.loadWorkspace();
      closeMaterialModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingMaterial(false);
    }
  }, [closeMaterialModal, model]);

  const handleDeleteMaterial = useCallback(async (materialId: string) => {
    model.setIsDeletingMaterial(true);
    model.setDataMessage(null);

    try {
      await deleteMaterialRecord(materialId, model.handleUnauthorized);
      if (model.activeMaterialId === materialId) {
        closeMaterialModal();
      }
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsDeletingMaterial(false);
    }
  }, [closeMaterialModal, model]);

  return {
    closeMaterialModal,
    handleDeleteMaterial,
    handleMaterialSubmit,
    openCreateMaterialModal,
    openEditMaterialModal,
  };
}
