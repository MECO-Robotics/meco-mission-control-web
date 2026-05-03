// @ts-nocheck
import { useCallback } from "react";

import { buildEmptyMechanismPayload, toErrorMessage } from "@/lib/appUtils";
import { createMechanismRecord, deleteMechanismRecord, updateMechanismRecord } from "@/lib/auth";
import type { AppWorkspaceModel } from "../useAppWorkspaceModel";
import type { MechanismPayload, MechanismRecord } from "@/types";

export type MechanismActions = ReturnType<typeof useMechanismActions>;

export function useMechanismActions(model: AppWorkspaceModel) {
  const openCreateMechanismModal = useCallback(() => {
    model.setActiveMechanismId(null);
    model.setMechanismDraft(buildEmptyMechanismPayload(model.scopedBootstrap));
    model.setMechanismModalMode("create");
  }, [model]);

  const openEditMechanismModal = useCallback((item: MechanismRecord) => {
    model.setActiveMechanismId(item.id);
    model.setMechanismDraft(item as MechanismPayload);
    model.setMechanismModalMode("edit");
  }, [model]);

  const closeMechanismModal = useCallback(() => {
    model.setMechanismModalMode(null);
    model.setActiveMechanismId(null);
  }, [model]);

  const handleMechanismSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    model.setIsSavingMechanism(true);
    model.setDataMessage(null);

    try {
      if (model.mechanismModalMode === "create") {
        await createMechanismRecord(model.mechanismDraft, model.handleUnauthorized);
      } else if (model.mechanismModalMode === "edit" && model.activeMechanismId) {
        await updateMechanismRecord(model.activeMechanismId, model.mechanismDraft, model.handleUnauthorized);
      }

      await model.loadWorkspace();
      closeMechanismModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingMechanism(false);
    }
  }, [closeMechanismModal, model]);

  const handleDeleteMechanism = useCallback(async (mechanismId: string) => {
    model.setIsDeletingMechanism(true);
    model.setDataMessage(null);

    try {
      await deleteMechanismRecord(mechanismId, model.handleUnauthorized);
      if (model.activeMechanismId === mechanismId) {
        closeMechanismModal();
      }
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsDeletingMechanism(false);
    }
  }, [closeMechanismModal, model]);

  const handleToggleMechanismArchived = useCallback(async (mechanismId: string) => {
    const currentMechanism = model.bootstrap.mechanisms.find(
      (mechanism) => mechanism.id === mechanismId,
    );
    if (!currentMechanism) {
      return;
    }

    model.setIsSavingMechanism(true);
    model.setDataMessage(null);

    try {
      await updateMechanismRecord(
        mechanismId,
        { isArchived: !currentMechanism.isArchived },
        model.handleUnauthorized,
      );
      await model.loadWorkspace();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingMechanism(false);
    }
  }, [model]);

  return {
    closeMechanismModal,
    handleDeleteMechanism,
    handleMechanismSubmit,
    handleToggleMechanismArchived,
    openCreateMechanismModal,
    openEditMechanismModal,
  };
}

