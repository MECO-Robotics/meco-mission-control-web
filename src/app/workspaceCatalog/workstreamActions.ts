import { useCallback } from "react";

import { buildEmptyWorkstreamPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { workstreamToPayload } from "@/lib/appUtils/payloadConversions";
import { createWorkstreamRecord, updateWorkstreamRecord } from "@/lib/auth/records/inventory";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { WorkstreamPayload } from "@/types/payloads";
import type { WorkstreamRecord } from "@/types/recordsOrganization";

export type WorkstreamActions = ReturnType<typeof useWorkstreamActions>;

export function useWorkstreamActions({
  activeWorkstreamId,
  bootstrap,
  handleUnauthorized,
  loadWorkspace,
  scopedBootstrap,
  selectedProjectId,
  setActiveWorkstreamId,
  setDataMessage,
  setIsSavingWorkstream,
  setWorkstreamDraft,
  setWorkstreamModalMode,
  workstreamDraft,
  workstreamModalMode,
}: {
  activeWorkstreamId: AppWorkspaceModel["activeWorkstreamId"];
  bootstrap: AppWorkspaceModel["bootstrap"];
  handleUnauthorized: AppWorkspaceModel["handleUnauthorized"];
  loadWorkspace: AppWorkspaceModel["loadWorkspace"];
  scopedBootstrap: AppWorkspaceModel["scopedBootstrap"];
  selectedProjectId: AppWorkspaceModel["selectedProjectId"];
  setActiveWorkstreamId: AppWorkspaceModel["setActiveWorkstreamId"];
  setDataMessage: AppWorkspaceModel["setDataMessage"];
  setIsSavingWorkstream: AppWorkspaceModel["setIsSavingWorkstream"];
  setWorkstreamDraft: AppWorkspaceModel["setWorkstreamDraft"];
  setWorkstreamModalMode: AppWorkspaceModel["setWorkstreamModalMode"];
  workstreamDraft: AppWorkspaceModel["workstreamDraft"];
  workstreamModalMode: AppWorkspaceModel["workstreamModalMode"];
}) {
  const openCreateWorkstreamModal = useCallback(() => {
    setActiveWorkstreamId(null);
    setWorkstreamDraft(
      buildEmptyWorkstreamPayload(scopedBootstrap, {
        projectId: selectedProjectId ?? undefined,
      }),
    );
    setWorkstreamModalMode("create");
  }, [scopedBootstrap, selectedProjectId, setActiveWorkstreamId, setWorkstreamDraft, setWorkstreamModalMode]);

  const openEditWorkstreamModal = useCallback((item: WorkstreamRecord) => {
    setActiveWorkstreamId(item.id);
    setWorkstreamDraft(workstreamToPayload(item));
    setWorkstreamModalMode("edit");
  }, [setActiveWorkstreamId, setWorkstreamDraft, setWorkstreamModalMode]);

  const closeWorkstreamModal = useCallback(() => {
    setWorkstreamModalMode(null);
    setActiveWorkstreamId(null);
  }, [setActiveWorkstreamId, setWorkstreamModalMode]);

  const handleWorkstreamSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    setIsSavingWorkstream(true);
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
      await loadWorkspace();
      closeWorkstreamModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingWorkstream(false);
    }
  }, [activeWorkstreamId, closeWorkstreamModal, handleUnauthorized, loadWorkspace, setDataMessage, setIsSavingWorkstream, workstreamDraft, workstreamModalMode]);

  const handleToggleWorkstreamArchived = useCallback(async (workstreamId: string) => {
    const currentWorkstream = bootstrap.workstreams.find(
      (workstream) => workstream.id === workstreamId,
    );
    if (!currentWorkstream) {
      return;
    }

    setIsSavingWorkstream(true);
    setDataMessage(null);

    try {
      await updateWorkstreamRecord(
        workstreamId,
        { isArchived: !currentWorkstream.isArchived },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingWorkstream(false);
    }
  }, [bootstrap, handleUnauthorized, loadWorkspace, setDataMessage, setIsSavingWorkstream]);

  return {
    closeWorkstreamModal,
    handleToggleWorkstreamArchived,
    handleWorkstreamSubmit,
    openCreateWorkstreamModal,
    openEditWorkstreamModal,
  };
}
