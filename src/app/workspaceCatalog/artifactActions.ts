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

export function useArtifactActions(model: AppWorkspaceModel) {
  const openCreateArtifactModal = useCallback((kind: ArtifactKind) => {
    model.setActiveArtifactId(null);
    model.setArtifactDraft(
      buildEmptyArtifactPayload(model.scopedBootstrap, {
        projectId: model.selectedProjectId ?? undefined,
        kind,
      }),
    );
    model.setArtifactModalMode("create");
  }, [model]);

  const openEditArtifactModal = useCallback((artifact: ArtifactRecord) => {
    model.setActiveArtifactId(artifact.id);
    model.setArtifactDraft(artifactToPayload(artifact));
    model.setArtifactModalMode("edit");
  }, [model]);

  const closeArtifactModal = useCallback(() => {
    model.setArtifactModalMode(null);
    model.setActiveArtifactId(null);
  }, [model]);

  const handleArtifactSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    model.setIsSavingArtifact(true);
    model.setDataMessage(null);

    try {
      const payload: ArtifactPayload = {
        ...model.artifactDraft,
        title: model.artifactDraft.title.trim(),
        summary: model.artifactDraft.summary.trim(),
        link: model.artifactDraft.link.trim(),
      };
      if (!payload.projectId) {
        model.setDataMessage("Pick a project before saving an artifact.");
        return;
      }

      if (model.artifactModalMode === "create") {
        await createArtifactRecord(payload, model.handleUnauthorized);
      } else if (model.artifactModalMode === "edit" && model.activeArtifactId) {
        await updateArtifactRecord(model.activeArtifactId, payload, model.handleUnauthorized);
      }

      await model.loadWorkspace();
      closeArtifactModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingArtifact(false);
    }
  }, [closeArtifactModal, model]);

  const handleDeleteArtifact = useCallback(async (artifactId: string) => {
    model.setIsDeletingArtifact(true);
    model.setDataMessage(null);

    try {
      await deleteArtifactRecord(artifactId, model.handleUnauthorized);
      if (model.activeArtifactId === artifactId) {
        closeArtifactModal();
      }
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsDeletingArtifact(false);
    }
  }, [closeArtifactModal, model]);

  const handleToggleArtifactArchived = useCallback(async (artifactId: string) => {
    const currentArtifact = model.bootstrap.artifacts.find(
      (artifact) => artifact.id === artifactId,
    );
    if (!currentArtifact) {
      return;
    }

    model.setIsSavingArtifact(true);
    model.setDataMessage(null);

    try {
      await updateArtifactRecord(
        artifactId,
        { isArchived: !(currentArtifact.isArchived ?? false) },
        model.handleUnauthorized,
      );
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingArtifact(false);
    }
  }, [model]);

  return {
    closeArtifactModal,
    handleArtifactSubmit,
    handleDeleteArtifact,
    handleToggleArtifactArchived,
    openCreateArtifactModal,
    openEditArtifactModal,
  };
}
