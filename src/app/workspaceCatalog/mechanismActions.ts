import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback } from "react";

import { buildEmptyMechanismPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createMechanismRecord, deleteMechanismRecord, updateMechanismRecord } from "@/lib/auth/records/structure";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { MechanismPayload } from "@/types/payloads";
import type { MechanismRecord } from "@/types/recordsOrganization";
import { useCatalogDraftEditor } from "./useCatalogDraftEditor";
import { useCatalogRecordActions } from "./useCatalogRecordActions";

export function useMechanismActions({ bootstrap, handleUnauthorized, loadWorkspace, scopedBootstrap, setDataMessage, selectedProjectId, selectedSeasonId }: {
  selectedSeasonId: string | null;
  selectedProjectId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  scopedBootstrap: BootstrapPayload;
  setDataMessage: (message: string | null) => void;
}) {
  const { beginOperation, resetEditor, isSaving: isSavingMechanism, isDeleting: isDeletingMechanism } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const makeCreateMechanismDraft = useCallback(() => buildEmptyMechanismPayload(scopedBootstrap), [scopedBootstrap]);
  const {
    modalMode: mechanismModalMode,
    activeRecordId: activeMechanismId,
    draft: mechanismDraft,
    setDraft: setMechanismDraft,
    openCreate: openCreateMechanismModal,
    openEdit: openEditMechanismModal,
    close: closeMechanismModal,
  } = useCatalogDraftEditor({
    bootstrapIsEmpty: bootstrap === EMPTY_BOOTSTRAP,
    makeCreateDraft: makeCreateMechanismDraft,
    makeInitialDraft: () => buildEmptyMechanismPayload(EMPTY_BOOTSTRAP),
    records: scopedBootstrap.mechanisms,
    resetOperation: resetEditor,
    selectedProjectId,
    selectedSeasonId,
    toDraft: (item: MechanismRecord) => item as MechanismPayload,
  });
  const { handleDelete: handleDeleteMechanism, handleToggleArchived: handleToggleMechanismArchived } = useCatalogRecordActions({
    activeRecordId: activeMechanismId,
    beginOperation,
    closeEditor: closeMechanismModal,
    deleteRecord: deleteMechanismRecord,
    handleUnauthorized,
    records: bootstrap.mechanisms,
    setDataMessage,
    updateRecord: updateMechanismRecord,
  });

  const handleMechanismSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!mechanismModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      if (mechanismModalMode === "create") {
        await createMechanismRecord(mechanismDraft, handleUnauthorized);
      } else if (mechanismModalMode === "edit" && activeMechanismId) {
        await updateMechanismRecord(activeMechanismId, mechanismDraft, handleUnauthorized);
      }

      await operation.refresh();
      if (operation.isCurrent()) closeMechanismModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeMechanismId, closeMechanismModal, handleUnauthorized, mechanismDraft, mechanismModalMode, setDataMessage, beginOperation]);

  return {
    mechanismModalMode,
    activeMechanismId,
    mechanismDraft,
    isSavingMechanism,
    isDeletingMechanism,
    setMechanismDraft,
    closeMechanismModal,
    handleDeleteMechanism,
    handleMechanismSubmit,
    handleToggleMechanismArchived,
    openCreateMechanismModal,
    openEditMechanismModal,
  };
}
