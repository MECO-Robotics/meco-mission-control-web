import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback } from "react";

import { buildEmptyWorkstreamPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { workstreamToPayload } from "@/lib/appUtils/payloadConversions";
import { createWorkstreamRecord, updateWorkstreamRecord } from "@/lib/auth/records/inventory";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { WorkstreamPayload } from "@/types/payloads";
import { useCatalogDraftEditor } from "./useCatalogDraftEditor";

export function useWorkstreamActions({ bootstrap, handleUnauthorized, loadWorkspace, scopedBootstrap, selectedProjectId, setDataMessage, selectedSeasonId }: {
  selectedSeasonId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  scopedBootstrap: BootstrapPayload;
  selectedProjectId: string | null;
  setDataMessage: (message: string | null) => void;
}) {
  const { beginOperation, resetEditor, isSaving: isSavingWorkstream } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const makeCreateWorkstreamDraft = useCallback(() =>
    buildEmptyWorkstreamPayload(scopedBootstrap, {
      projectId: selectedProjectId ?? undefined,
    }), [scopedBootstrap, selectedProjectId]);
  const {
    modalMode: workstreamModalMode,
    activeRecordId: activeWorkstreamId,
    draft: workstreamDraft,
    setDraft: setWorkstreamDraft,
    openCreate: openCreateWorkstreamModal,
    openEdit: openEditWorkstreamModal,
    close: closeWorkstreamModal,
  } = useCatalogDraftEditor({
    bootstrapIsEmpty: bootstrap === EMPTY_BOOTSTRAP,
    makeCreateDraft: makeCreateWorkstreamDraft,
    makeInitialDraft: () => buildEmptyWorkstreamPayload(EMPTY_BOOTSTRAP),
    records: scopedBootstrap.workstreams,
    resetOperation: resetEditor,
    selectedProjectId,
    selectedSeasonId,
    toDraft: workstreamToPayload,
  });

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
