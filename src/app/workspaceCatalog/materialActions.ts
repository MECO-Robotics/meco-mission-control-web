import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import { useCallback, useState, useEffect } from "react";

import { buildEmptyMaterialPayload } from "@/lib/appUtils/payloadBuilders";
import { materialToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createMaterialRecord, deleteMaterialRecord, updateMaterialRecord } from "@/lib/auth/records/inventory";
import type { MaterialPayload } from "@/types/payloads";
import type { MaterialRecord } from "@/types/recordsInventory";

export function useMaterialEditor({
  bootstrap, selectedProjectId, selectedSeasonId,
  handleUnauthorized,
  loadWorkspace,
  setDataMessage,
}: {
  bootstrap: BootstrapPayload;
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  setDataMessage: (message: string | null) => void;
}) {
  const [materialModalMode, setMaterialModalMode] = useState<"create" | "edit" | null>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialPayload>(buildEmptyMaterialPayload);
  const { beginOperation, resetEditor, isSaving: isSavingMaterial, isDeleting: isDeletingMaterial } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const openCreateMaterialModal = useCallback(() => {
    resetEditor();
    setActiveMaterialId(null);
    setMaterialDraft(buildEmptyMaterialPayload());
    setMaterialModalMode("create");
  }, [resetEditor]);

  const openEditMaterialModal = useCallback((item: MaterialRecord) => {
    resetEditor();
    setActiveMaterialId(item.id);
    setMaterialDraft(materialToPayload(item));
    setMaterialModalMode("edit");
  }, [resetEditor]);

  const closeMaterialModal = useCallback(() => {
    resetEditor();
    setMaterialModalMode(null);
    setActiveMaterialId(null);
  }, [resetEditor]);

  useEffect(() => closeMaterialModal(), [closeMaterialModal, selectedProjectId, selectedSeasonId]);

  useEffect(() => {
    if (bootstrap === EMPTY_BOOTSTRAP || (materialModalMode === "edit" && !bootstrap.materials.some((item) => item.id === activeMaterialId))) {
      closeMaterialModal();
    }
  }, [activeMaterialId, bootstrap, closeMaterialModal, materialModalMode]);

  const handleMaterialSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!materialModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      const payload: MaterialPayload =
        materialModalMode === "create"
          ? {
              ...materialDraft,
              reorderPoint: Math.floor(materialDraft.onHandQuantity / 2),
            }
          : materialDraft;

      if (materialModalMode === "create") {
        await createMaterialRecord(payload, handleUnauthorized);
      } else if (materialModalMode === "edit" && activeMaterialId) {
        await updateMaterialRecord(activeMaterialId, payload, handleUnauthorized);
      }

      await operation.refresh();
      if (operation.isCurrent()) closeMaterialModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeMaterialId, closeMaterialModal, handleUnauthorized, beginOperation, materialDraft, materialModalMode, setDataMessage]);

  const handleDeleteMaterial = useCallback(async (materialId: string) => {
    const operation = beginOperation("delete");
    if (!operation) return;
    setDataMessage(null);

    try {
      await deleteMaterialRecord(materialId, handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent() && activeMaterialId === materialId) closeMaterialModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeMaterialId, closeMaterialModal, handleUnauthorized, beginOperation, setDataMessage]);

  return {
    materialModalMode, activeMaterialId, materialDraft, setMaterialDraft, isSavingMaterial, isDeletingMaterial,
    closeMaterialModal,
    handleDeleteMaterial,
    handleMaterialSubmit,
    openCreateMaterialModal,
    openEditMaterialModal,
  };
}
