import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback } from "react";

import { artifactToPayload } from "@/lib/appUtils/payloadConversions";
import { buildEmptyArtifactPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createArtifactRecord, deleteArtifactRecord, updateArtifactRecord } from "@/lib/auth/records/inventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { ArtifactKind } from "@/types/common";
import type { ArtifactPayload } from "@/types/payloads";
import { useCatalogDraftEditor } from "./useCatalogDraftEditor";
import { useCatalogRecordActions } from "./useCatalogRecordActions";

export function useArtifactActions({ bootstrap, handleUnauthorized, loadWorkspace, scopedBootstrap, selectedProjectId, setDataMessage, selectedSeasonId }: {
  selectedSeasonId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  scopedBootstrap: BootstrapPayload;
  selectedProjectId: string | null;
  setDataMessage: (message: string | null) => void;
}) {
  const { beginOperation, resetEditor, isSaving: isSavingArtifact, isDeleting: isDeletingArtifact } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const makeCreateArtifactDraft = useCallback((kind: ArtifactKind) =>
    buildEmptyArtifactPayload(scopedBootstrap, {
      projectId: selectedProjectId ?? undefined,
      kind,
    }), [scopedBootstrap, selectedProjectId]);
  const {
    modalMode: artifactModalMode,
    activeRecordId: activeArtifactId,
    draft: artifactDraft,
    setDraft: setArtifactDraft,
    openCreate: openCreateArtifactModal,
    openEdit: openEditArtifactModal,
    close: closeArtifactModal,
  } = useCatalogDraftEditor({
    bootstrapIsEmpty: bootstrap === EMPTY_BOOTSTRAP,
    makeCreateDraft: makeCreateArtifactDraft,
    makeInitialDraft: () => buildEmptyArtifactPayload(EMPTY_BOOTSTRAP, { kind: "document" }),
    records: bootstrap.artifacts,
    resetOperation: resetEditor,
    selectedProjectId,
    selectedSeasonId,
    toDraft: artifactToPayload,
  });
  const { handleDelete: handleDeleteArtifact, handleToggleArchived: handleToggleArtifactArchived } = useCatalogRecordActions({
    activeRecordId: activeArtifactId,
    beginOperation,
    closeEditor: closeArtifactModal,
    deleteRecord: deleteArtifactRecord,
    handleUnauthorized,
    records: bootstrap.artifacts,
    setDataMessage,
    updateRecord: updateArtifactRecord,
  });

  const handleArtifactSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!artifactModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      const payload: ArtifactPayload = {
        ...artifactDraft,
        title: artifactDraft.title.trim(),
        summary: artifactDraft.summary.trim(),
        link: artifactDraft.link.trim(),
      };
      if (!payload.projectId) {
        setDataMessage("Pick a project before saving an artifact.");
        return;
      }

      if (artifactModalMode === "create") {
        await createArtifactRecord(payload, handleUnauthorized);
      } else if (artifactModalMode === "edit" && activeArtifactId) {
        await updateArtifactRecord(activeArtifactId, payload, handleUnauthorized);
      }

      await operation.refresh();
      if (operation.isCurrent()) closeArtifactModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeArtifactId, artifactDraft, artifactModalMode, closeArtifactModal, handleUnauthorized, setDataMessage, beginOperation]);

  return {
    artifactModalMode,
    activeArtifactId,
    artifactDraft,
    isSavingArtifact,
    isDeletingArtifact,
    setArtifactDraft,
    closeArtifactModal,
    handleArtifactSubmit,
    handleDeleteArtifact,
    handleToggleArtifactArchived,
    openCreateArtifactModal,
    openEditArtifactModal,
  };
}
