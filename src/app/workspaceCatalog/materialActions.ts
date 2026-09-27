import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import { useCallback } from "react";
import { useCatalogDraftEditor } from "./useCatalogDraftEditor";
import { useCatalogRecordActions } from "./useCatalogRecordActions";

import { buildEmptyMaterialPayload } from "@/lib/appUtils/payloadBuilders";
import { materialToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createMaterialRecord, deleteMaterialRecord, updateMaterialRecord } from "@/lib/auth/records/inventory";
import type { MaterialPayload } from "@/types/payloads";

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
  const { beginOperation, resetEditor, isSaving: isSavingMaterial, isDeleting: isDeletingMaterial } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const {
    modalMode: materialModalMode,
    activeRecordId: activeMaterialId,
    draft: materialDraft,
    setDraft: setMaterialDraft,
    openCreate: openCreateMaterialModal,
    openEdit: openEditMaterialModal,
    close: closeMaterialModal,
  } = useCatalogDraftEditor({
    bootstrapIsEmpty: bootstrap === EMPTY_BOOTSTRAP,
    makeCreateDraft: buildEmptyMaterialPayload,
    makeInitialDraft: buildEmptyMaterialPayload,
    records: bootstrap.materials,
    resetOperation: resetEditor,
    selectedProjectId,
    selectedSeasonId,
    toDraft: materialToPayload,
  });
  const { handleDelete: handleDeleteMaterial } = useCatalogRecordActions({
    activeRecordId: activeMaterialId,
    beginOperation,
    closeEditor: closeMaterialModal,
    deleteRecord: deleteMaterialRecord,
    handleUnauthorized,
    records: bootstrap.materials,
    setDataMessage,
  });

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

  return {
    materialModalMode, activeMaterialId, materialDraft, setMaterialDraft, isSavingMaterial, isDeletingMaterial,
    closeMaterialModal,
    handleDeleteMaterial,
    handleMaterialSubmit,
    openCreateMaterialModal,
    openEditMaterialModal,
  };
}
