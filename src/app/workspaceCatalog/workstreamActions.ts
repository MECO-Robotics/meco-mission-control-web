import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback, useState, useEffect } from "react";

import { buildEmptyWorkstreamPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { workstreamToPayload } from "@/lib/appUtils/payloadConversions";
import { createWorkstreamRecord, updateWorkstreamRecord } from "@/lib/auth/records/inventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { WorkstreamPayload } from "@/types/payloads";
import type { WorkstreamRecord } from "@/types/recordsOrganization";

export function useWorkstreamActions({ bootstrap, handleUnauthorized, loadWorkspace, scopedBootstrap, selectedProjectId, setDataMessage, selectedSeasonId }: {
  selectedSeasonId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  scopedBootstrap: BootstrapPayload;
  selectedProjectId: string | null;
  setDataMessage: (message: string | null) => void;
}) {
  const [workstreamModalMode, setWorkstreamModalMode] =
    useState<"create" | "edit" | null>(null);
  const [activeWorkstreamId, setActiveWorkstreamId] = useState<string | null>(null);
  const [workstreamDraft, setWorkstreamDraft] = useState<WorkstreamPayload>(
    buildEmptyWorkstreamPayload(EMPTY_BOOTSTRAP),
  );
  const { beginOperation, resetEditor, isSaving: isSavingWorkstream } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const openCreateWorkstreamModal = useCallback(() => {
    resetEditor();
    setActiveWorkstreamId(null);
    setWorkstreamDraft(
      buildEmptyWorkstreamPayload(scopedBootstrap, {
        projectId: selectedProjectId ?? undefined,
      }),
    );
    setWorkstreamModalMode("create");
  }, [scopedBootstrap, selectedProjectId, resetEditor]);

  const openEditWorkstreamModal = useCallback((item: WorkstreamRecord) => {
    resetEditor();
    setActiveWorkstreamId(item.id);
    setWorkstreamDraft(workstreamToPayload(item));
    setWorkstreamModalMode("edit");
  }, [resetEditor]);

  const closeWorkstreamModal = useCallback(() => {
    resetEditor();
    setWorkstreamModalMode(null);
    setActiveWorkstreamId(null);
  }, [resetEditor]);

  useEffect(() => closeWorkstreamModal(), [closeWorkstreamModal, selectedProjectId, selectedSeasonId]);

  useEffect(() => {
    if (bootstrap === EMPTY_BOOTSTRAP || (workstreamModalMode === "edit" && !scopedBootstrap.workstreams.some((item) => item.id === activeWorkstreamId))) {
      closeWorkstreamModal();
    }
  }, [activeWorkstreamId, bootstrap, closeWorkstreamModal, workstreamModalMode, scopedBootstrap]);

  const handleWorkstreamSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!workstreamModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      const payload: WorkstreamPayload = {
        ...workstreamDraft,
        name: workstreamDraft.name.trim(),
        description: workstreamDraft.description.trim(),
      };
      if (!payload.projectId) {
        setDataMessage("Pick a project before adding a workflow.");
        return;
      }

      if (workstreamModalMode === "create") {
        await createWorkstreamRecord(payload, handleUnauthorized);
      } else if (workstreamModalMode === "edit" && activeWorkstreamId) {
        await updateWorkstreamRecord(activeWorkstreamId, payload, handleUnauthorized);
      }
      await operation.refresh();
      if (operation.isCurrent()) closeWorkstreamModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeWorkstreamId, closeWorkstreamModal, handleUnauthorized, setDataMessage, workstreamDraft, workstreamModalMode, beginOperation]);

  const handleToggleWorkstreamArchived = useCallback(async (workstreamId: string) => {
    const currentWorkstream = bootstrap.workstreams.find(
      (workstream) => workstream.id === workstreamId,
    );
    if (!currentWorkstream) {
      return;
    }

    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      await updateWorkstreamRecord(
        workstreamId,
        { isArchived: !currentWorkstream.isArchived },
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
    workstreamModalMode,
    activeWorkstreamId,
    workstreamDraft,
    isSavingWorkstream,
    setWorkstreamDraft,
    closeWorkstreamModal,
    handleToggleWorkstreamArchived,
    handleWorkstreamSubmit,
    openCreateWorkstreamModal,
    openEditWorkstreamModal,
  };
}
