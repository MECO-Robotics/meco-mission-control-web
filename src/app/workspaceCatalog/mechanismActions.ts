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

  const handleDeleteMechanism = useCallback(async (mechanismId: string) => {
    const operation = beginOperation("delete");
    if (!operation) return;
    setDataMessage(null);

    try {
      await deleteMechanismRecord(mechanismId, handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent() && activeMechanismId === mechanismId) closeMechanismModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeMechanismId, closeMechanismModal, handleUnauthorized, setDataMessage, beginOperation]);

  const handleToggleMechanismArchived = useCallback(async (mechanismId: string) => {
    const currentMechanism = bootstrap.mechanisms.find(
      (mechanism) => mechanism.id === mechanismId,
    );
    if (!currentMechanism) {
      return;
    }

    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      await updateMechanismRecord(
        mechanismId,
        { isArchived: !currentMechanism.isArchived },
        handleUnauthorized,
      );
      await operation.refresh();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [bootstrap, handleUnauthorized, setDataMessage, beginOperation]);

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
