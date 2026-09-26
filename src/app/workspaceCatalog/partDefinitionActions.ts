import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback, useRef } from "react";

import { getLocalWorkspaceGeneration } from "@/lib/localWorkspace/session";
import { getSessionGeneration } from "@/lib/auth/core/sessionStorage";
import { buildEmptyPartDefinitionPayload } from "@/lib/appUtils/payloadBuilders";
import { partDefinitionToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createPartDefinitionRecord, deletePartDefinitionRecord, updatePartDefinitionRecord } from "@/lib/auth/records/parts";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { Dispatch, SetStateAction } from "react";
import { useCatalogDraftEditor } from "./useCatalogDraftEditor";

export function usePartDefinitionActions({ bootstrap, handleUnauthorized, loadWorkspace, selectedSeasonId, setBootstrap, setDataMessage, selectedProjectId }: {
  selectedProjectId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  selectedSeasonId: string | null;
  setBootstrap: Dispatch<SetStateAction<BootstrapPayload>>;
  setDataMessage: (message: string | null) => void;
}) {
  const { beginOperation, resetEditor, isSaving: isSavingPartDefinition, isDeleting: isDeletingPartDefinition } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const makeCreatePartDefinitionDraft = useCallback(() => buildEmptyPartDefinitionPayload(bootstrap), [bootstrap]);
  const {
    modalMode: partDefinitionModalMode,
    activeRecordId: activePartDefinitionId,
    draft: partDefinitionDraft,
    setDraft: setPartDefinitionDraft,
    openCreate: openCreatePartDefinitionModal,
    openEdit: openEditPartDefinitionModal,
    close: closePartDefinitionModal,
  } = useCatalogDraftEditor({
    bootstrapIsEmpty: bootstrap === EMPTY_BOOTSTRAP,
    makeCreateDraft: makeCreatePartDefinitionDraft,
    makeInitialDraft: () => buildEmptyPartDefinitionPayload(EMPTY_BOOTSTRAP),
    records: bootstrap.partDefinitions,
    resetOperation: resetEditor,
    selectedProjectId,
    selectedSeasonId,
    toDraft: partDefinitionToPayload,
  });
  const currentBootstrap = useRef(bootstrap);
  currentBootstrap.current = bootstrap;
  const savePartImage = useCallback(async (partId: string, revision: string, imageUrl: string) => {
    const current = currentBootstrap.current.partDefinitions.find((part) => part.id === partId);
    if (!current || current.revision !== revision || current.isArchived) {
      throw new Error("This part changed. Choose its current revision and try again.");
    }
    if (!imageUrl.startsWith("data:image/png;base64,") || imageUrl.length > 150_000) {
      throw new Error("The generated part image is invalid or too large.");
    }
    const session = getSessionGeneration();
    const workspace = getLocalWorkspaceGeneration();
    const saved = await updatePartDefinitionRecord(partId, { photoUrl: imageUrl }, handleUnauthorized);
    if (session !== getSessionGeneration() || workspace !== getLocalWorkspaceGeneration()) {
      throw new Error("The workspace changed while saving the part image.");
    }
    setBootstrap((current) => ({ ...current, partDefinitions: current.partDefinitions.map((part) => part.id === saved.id ? saved : part) }));
  }, [handleUnauthorized, setBootstrap]);

  const handlePartDefinitionSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (partDefinitionModalMode === "create" && !selectedSeasonId) {
      setDataMessage("Pick a season before adding a part definition.");
      return;
    }

    if (!partDefinitionModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
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

      await operation.refresh();
      if (operation.isCurrent()) closePartDefinitionModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activePartDefinitionId, closePartDefinitionModal, handleUnauthorized, partDefinitionDraft, partDefinitionModalMode, selectedSeasonId, setDataMessage, beginOperation]);

  const handleDeletePartDefinition = useCallback(async (partDefinitionId: string) => {
    const operation = beginOperation("delete");
    if (!operation) return;
    setDataMessage(null);

    try {
      await deletePartDefinitionRecord(partDefinitionId, handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent() && activePartDefinitionId === partDefinitionId) closePartDefinitionModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activePartDefinitionId, closePartDefinitionModal, handleUnauthorized, setDataMessage, beginOperation]);

  const handleTogglePartDefinitionArchived = useCallback(async (partDefinitionId: string) => {
    const currentPartDefinition = bootstrap.partDefinitions.find(
      (partDefinition) => partDefinition.id === partDefinitionId,
    );
    if (!currentPartDefinition) {
      return;
    }

    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      await updatePartDefinitionRecord(
        partDefinitionId,
        { isArchived: !currentPartDefinition.isArchived },
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
    partDefinitionModalMode,
    activePartDefinitionId,
    partDefinitionDraft,
    isSavingPartDefinition,
    isDeletingPartDefinition,
    setPartDefinitionDraft,
    savePartImage,
    closePartDefinitionModal,
    handleDeletePartDefinition,
    handlePartDefinitionSubmit,
    handleTogglePartDefinitionArchived,
    openCreatePartDefinitionModal,
    openEditPartDefinitionModal,
  };
}
