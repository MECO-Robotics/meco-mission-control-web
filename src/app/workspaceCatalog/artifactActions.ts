import { useCallback } from "react";

import { artifactToPayload } from "@/lib/appUtils/payloadConversions";
import { buildEmptyArtifactPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createArtifactRecord, deleteArtifactRecord, updateArtifactRecord } from "@/lib/auth/records/inventory";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { ArtifactKind } from "@/types/common";
import type { ArtifactPayload } from "@/types/payloads";
import type { ArtifactRecord } from "@/types/recordsInventory";

export type ArtifactActions = ReturnType<typeof useArtifactActions>;

export function useArtifactActions({
  activeArtifactId,
  artifactDraft,
  artifactModalMode,
  bootstrap,
  handleUnauthorized,
  loadWorkspace,
  scopedBootstrap,
  selectedProjectId,
  setActiveArtifactId,
  setArtifactDraft,
  setArtifactModalMode,
  setDataMessage,
  setIsDeletingArtifact,
  setIsSavingArtifact,
}: {
  activeArtifactId: AppWorkspaceModel["activeArtifactId"];
  artifactDraft: AppWorkspaceModel["artifactDraft"];
  artifactModalMode: AppWorkspaceModel["artifactModalMode"];
  bootstrap: AppWorkspaceModel["bootstrap"];
  handleUnauthorized: AppWorkspaceModel["handleUnauthorized"];
  loadWorkspace: AppWorkspaceModel["loadWorkspace"];
  scopedBootstrap: AppWorkspaceModel["scopedBootstrap"];
  selectedProjectId: AppWorkspaceModel["selectedProjectId"];
  setActiveArtifactId: AppWorkspaceModel["setActiveArtifactId"];
  setArtifactDraft: AppWorkspaceModel["setArtifactDraft"];
  setArtifactModalMode: AppWorkspaceModel["setArtifactModalMode"];
  setDataMessage: AppWorkspaceModel["setDataMessage"];
  setIsDeletingArtifact: AppWorkspaceModel["setIsDeletingArtifact"];
  setIsSavingArtifact: AppWorkspaceModel["setIsSavingArtifact"];
}) {
  const openCreateArtifactModal = useCallback((kind: ArtifactKind) => {
    setActiveArtifactId(null);
    setArtifactDraft(
      buildEmptyArtifactPayload(scopedBootstrap, {
        projectId: selectedProjectId ?? undefined,
        kind,
      }),
    );
    setArtifactModalMode("create");
  }, [scopedBootstrap, selectedProjectId, setActiveArtifactId, setArtifactDraft, setArtifactModalMode]);

  const openEditArtifactModal = useCallback((artifact: ArtifactRecord) => {
    setActiveArtifactId(artifact.id);
    setArtifactDraft(artifactToPayload(artifact));
    setArtifactModalMode("edit");
  }, [setActiveArtifactId, setArtifactDraft, setArtifactModalMode]);

  const closeArtifactModal = useCallback(() => {
    setArtifactModalMode(null);
    setActiveArtifactId(null);
  }, [setActiveArtifactId, setArtifactModalMode]);

  const handleArtifactSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    setIsSavingArtifact(true);
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

      await loadWorkspace();
      closeArtifactModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingArtifact(false);
    }
  }, [activeArtifactId, artifactDraft, artifactModalMode, closeArtifactModal, handleUnauthorized, loadWorkspace, setDataMessage, setIsSavingArtifact]);

  const handleDeleteArtifact = useCallback(async (artifactId: string) => {
    setIsDeletingArtifact(true);
    setDataMessage(null);

    try {
      await deleteArtifactRecord(artifactId, handleUnauthorized);
      if (activeArtifactId === artifactId) {
        closeArtifactModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingArtifact(false);
    }
  }, [activeArtifactId, closeArtifactModal, handleUnauthorized, loadWorkspace, setDataMessage, setIsDeletingArtifact]);

  const handleToggleArtifactArchived = useCallback(async (artifactId: string) => {
    const currentArtifact = bootstrap.artifacts.find(
      (artifact) => artifact.id === artifactId,
    );
    if (!currentArtifact) {
      return;
    }

    setIsSavingArtifact(true);
    setDataMessage(null);

    try {
      await updateArtifactRecord(
        artifactId,
        { isArchived: !(currentArtifact.isArchived ?? false) },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingArtifact(false);
    }
  }, [bootstrap, handleUnauthorized, loadWorkspace, setDataMessage, setIsSavingArtifact]);

  return {
    closeArtifactModal,
    handleArtifactSubmit,
    handleDeleteArtifact,
    handleToggleArtifactArchived,
    openCreateArtifactModal,
    openEditArtifactModal,
  };
}
