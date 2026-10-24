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
import { createMaterialRecord, createMaterialTransactionRecord, deleteMaterialRecord, updateMaterialRecord } from "@/lib/auth/records/inventory";
import type { MaterialTransactionPayload } from "@/types/payloads";
import type { MaterialCategory } from "@/types/common";

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
  const openCreateInventoryItem = useCallback((category?: MaterialCategory) => {
    openCreateMaterialModal();
    if (category) setMaterialDraft((current) => ({ ...current, category }));
  }, [openCreateMaterialModal, setMaterialDraft]);

  const handleMaterialSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!materialModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      const payload = materialDraft;

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

  const handleMaterialTransaction = useCallback(async (payload: MaterialTransactionPayload) => {
    if (!activeMaterialId || materialModalMode !== "edit") return false;
    const operation = beginOperation();
    if (!operation) return false;
    setDataMessage(null);

    try {
      await createMaterialTransactionRecord(activeMaterialId, payload, handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent()) setDataMessage("Stock transaction recorded.");
      return operation.isCurrent();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
      return false;
    } finally {
      operation.finish();
    }
  }, [activeMaterialId, beginOperation, handleUnauthorized, materialModalMode, setDataMessage]);

  return {
    materialModalMode, activeMaterialId, materialDraft, setMaterialDraft, isSavingMaterial, isDeletingMaterial,
    closeMaterialModal,
    handleDeleteMaterial,
    handleMaterialSubmit,
    handleMaterialTransaction,
    openCreateMaterialModal: openCreateInventoryItem,
    openEditMaterialModal,
  };
}
