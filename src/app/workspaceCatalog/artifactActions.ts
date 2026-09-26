import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback, useState, useEffect } from "react";

import { artifactToPayload } from "@/lib/appUtils/payloadConversions";
import { buildEmptyArtifactPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createArtifactRecord, deleteArtifactRecord, updateArtifactRecord } from "@/lib/auth/records/inventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { ArtifactKind } from "@/types/common";
import type { ArtifactPayload } from "@/types/payloads";
import type { ArtifactRecord } from "@/types/recordsInventory";

export function useArtifactActions({ bootstrap, handleUnauthorized, loadWorkspace, scopedBootstrap, selectedProjectId, setDataMessage, selectedSeasonId }: {
  selectedSeasonId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  scopedBootstrap: BootstrapPayload;
  selectedProjectId: string | null;
  setDataMessage: (message: string | null) => void;
}) {
  const [artifactModalMode, setArtifactModalMode] = useState<"create" | "edit" | null>(null);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [artifactDraft, setArtifactDraft] = useState<ArtifactPayload>(
    buildEmptyArtifactPayload(EMPTY_BOOTSTRAP, { kind: "document" }),
  );
  const { beginOperation, resetEditor, isSaving: isSavingArtifact, isDeleting: isDeletingArtifact } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const openCreateArtifactModal = useCallback((kind: ArtifactKind) => {
    resetEditor();
    setActiveArtifactId(null);
    setArtifactDraft(
      buildEmptyArtifactPayload(scopedBootstrap, {
        projectId: selectedProjectId ?? undefined,
        kind,
      }),
    );
    setArtifactModalMode("create");
  }, [scopedBootstrap, selectedProjectId, resetEditor]);

  const openEditArtifactModal = useCallback((artifact: ArtifactRecord) => {
    resetEditor();
    setActiveArtifactId(artifact.id);
    setArtifactDraft(artifactToPayload(artifact));
    setArtifactModalMode("edit");
  }, [resetEditor]);

  const closeArtifactModal = useCallback(() => {
    resetEditor();
    setArtifactModalMode(null);
    setActiveArtifactId(null);
  }, [resetEditor]);

  useEffect(() => closeArtifactModal(), [closeArtifactModal, selectedProjectId, selectedSeasonId]);

  useEffect(() => {
    if (bootstrap === EMPTY_BOOTSTRAP || (artifactModalMode === "edit" && !bootstrap.artifacts.some((item) => item.id === activeArtifactId))) {
      closeArtifactModal();
    }
  }, [activeArtifactId, bootstrap, closeArtifactModal, artifactModalMode]);

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

  const handleDeleteArtifact = useCallback(async (artifactId: string) => {
    const operation = beginOperation("delete");
    if (!operation) return;
    setDataMessage(null);

    try {
      await deleteArtifactRecord(artifactId, handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent() && activeArtifactId === artifactId) closeArtifactModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeArtifactId, closeArtifactModal, handleUnauthorized, setDataMessage, beginOperation]);

  const handleToggleArtifactArchived = useCallback(async (artifactId: string) => {
    const currentArtifact = bootstrap.artifacts.find(
      (artifact) => artifact.id === artifactId,
    );
    if (!currentArtifact) {
      return;
    }

    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      await updateArtifactRecord(
        artifactId,
        { isArchived: !(currentArtifact.isArchived ?? false) },
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
