import { useCallback } from "react";

import { buildEmptyWorkstreamPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { workstreamToPayload } from "@/lib/appUtils/payloadConversions";
import { createWorkstreamRecord, updateWorkstreamRecord } from "@/lib/auth/records/inventory";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { WorkstreamPayload } from "@/types/payloads";
import type { WorkstreamRecord } from "@/types/recordsOrganization";

export type WorkstreamActions = ReturnType<typeof useWorkstreamActions>;

export function useWorkstreamActions(model: AppWorkspaceModel) {
  const openCreateWorkstreamModal = useCallback(() => {
    model.setActiveWorkstreamId(null);
    model.setWorkstreamDraft(
      buildEmptyWorkstreamPayload(model.scopedBootstrap, {
        projectId: model.selectedProjectId ?? undefined,
      }),
    );
    model.setWorkstreamModalMode("create");
  }, [model]);

  const openEditWorkstreamModal = useCallback((item: WorkstreamRecord) => {
    model.setActiveWorkstreamId(item.id);
    model.setWorkstreamDraft(workstreamToPayload(item));
    model.setWorkstreamModalMode("edit");
  }, [model]);

  const closeWorkstreamModal = useCallback(() => {
    model.setWorkstreamModalMode(null);
    model.setActiveWorkstreamId(null);
  }, [model]);

  const handleWorkstreamSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    model.setIsSavingWorkstream(true);
    model.setDataMessage(null);

    try {
      const payload: WorkstreamPayload = {
        ...model.workstreamDraft,
        name: model.workstreamDraft.name.trim(),
        description: model.workstreamDraft.description.trim(),
      };
      if (!payload.projectId) {
        model.setDataMessage("Pick a project before adding a workflow.");
        return;
      }

      if (model.workstreamModalMode === "create") {
        await createWorkstreamRecord(payload, model.handleUnauthorized);
      } else if (model.workstreamModalMode === "edit" && model.activeWorkstreamId) {
        await updateWorkstreamRecord(model.activeWorkstreamId, payload, model.handleUnauthorized);
      }
      await model.loadWorkspace();
      closeWorkstreamModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingWorkstream(false);
    }
  }, [closeWorkstreamModal, model]);

  const handleToggleWorkstreamArchived = useCallback(async (workstreamId: string) => {
    const currentWorkstream = model.bootstrap.workstreams.find(
      (workstream) => workstream.id === workstreamId,
    );
    if (!currentWorkstream) {
      return;
    }

    model.setIsSavingWorkstream(true);
    model.setDataMessage(null);

    try {
      await updateWorkstreamRecord(
        workstreamId,
        { isArchived: !currentWorkstream.isArchived },
        model.handleUnauthorized,
      );
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingWorkstream(false);
    }
  }, [model]);

  return {
    closeWorkstreamModal,
    handleToggleWorkstreamArchived,
    handleWorkstreamSubmit,
    openCreateWorkstreamModal,
    openEditWorkstreamModal,
  };
}
