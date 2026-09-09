import { useCallback } from "react";

import { buildEmptyMechanismPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createMechanismRecord, deleteMechanismRecord, updateMechanismRecord } from "@/lib/auth/records/structure";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { MechanismPayload } from "@/types/payloads";
import type { MechanismRecord } from "@/types/recordsOrganization";

export type MechanismActions = ReturnType<typeof useMechanismActions>;

export function useMechanismActions({
  activeMechanismId,
  bootstrap,
  handleUnauthorized,
  loadWorkspace,
  mechanismDraft,
  mechanismModalMode,
  scopedBootstrap,
  setActiveMechanismId,
  setDataMessage,
  setIsDeletingMechanism,
  setIsSavingMechanism,
  setMechanismDraft,
  setMechanismModalMode,
}: {
  activeMechanismId: AppWorkspaceModel["activeMechanismId"];
  bootstrap: AppWorkspaceModel["bootstrap"];
  handleUnauthorized: AppWorkspaceModel["handleUnauthorized"];
  loadWorkspace: AppWorkspaceModel["loadWorkspace"];
  mechanismDraft: AppWorkspaceModel["mechanismDraft"];
  mechanismModalMode: AppWorkspaceModel["mechanismModalMode"];
  scopedBootstrap: AppWorkspaceModel["scopedBootstrap"];
  setActiveMechanismId: AppWorkspaceModel["setActiveMechanismId"];
  setDataMessage: AppWorkspaceModel["setDataMessage"];
  setIsDeletingMechanism: AppWorkspaceModel["setIsDeletingMechanism"];
  setIsSavingMechanism: AppWorkspaceModel["setIsSavingMechanism"];
  setMechanismDraft: AppWorkspaceModel["setMechanismDraft"];
  setMechanismModalMode: AppWorkspaceModel["setMechanismModalMode"];
}) {
  const openCreateMechanismModal = useCallback(() => {
    setActiveMechanismId(null);
    setMechanismDraft(buildEmptyMechanismPayload(scopedBootstrap));
    setMechanismModalMode("create");
  }, [scopedBootstrap, setActiveMechanismId, setMechanismDraft, setMechanismModalMode]);

  const openEditMechanismModal = useCallback((item: MechanismRecord) => {
    setActiveMechanismId(item.id);
    setMechanismDraft(item as MechanismPayload);
    setMechanismModalMode("edit");
  }, [setActiveMechanismId, setMechanismDraft, setMechanismModalMode]);

  const closeMechanismModal = useCallback(() => {
    setMechanismModalMode(null);
    setActiveMechanismId(null);
  }, [setActiveMechanismId, setMechanismModalMode]);

  const handleMechanismSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    setIsSavingMechanism(true);
    setDataMessage(null);

    try {
      if (mechanismModalMode === "create") {
        await createMechanismRecord(mechanismDraft, handleUnauthorized);
      } else if (mechanismModalMode === "edit" && activeMechanismId) {
        await updateMechanismRecord(activeMechanismId, mechanismDraft, handleUnauthorized);
      }

      await loadWorkspace();
      closeMechanismModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMechanism(false);
    }
  }, [activeMechanismId, closeMechanismModal, handleUnauthorized, loadWorkspace, mechanismDraft, mechanismModalMode, setDataMessage, setIsSavingMechanism]);

  const handleDeleteMechanism = useCallback(async (mechanismId: string) => {
    setIsDeletingMechanism(true);
    setDataMessage(null);

    try {
      await deleteMechanismRecord(mechanismId, handleUnauthorized);
      if (activeMechanismId === mechanismId) {
        closeMechanismModal();
      }
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsDeletingMechanism(false);
    }
  }, [activeMechanismId, closeMechanismModal, handleUnauthorized, loadWorkspace, setDataMessage, setIsDeletingMechanism]);

  const handleToggleMechanismArchived = useCallback(async (mechanismId: string) => {
    const currentMechanism = bootstrap.mechanisms.find(
      (mechanism) => mechanism.id === mechanismId,
    );
    if (!currentMechanism) {
      return;
    }

    setIsSavingMechanism(true);
    setDataMessage(null);

    try {
      await updateMechanismRecord(
        mechanismId,
        { isArchived: !currentMechanism.isArchived },
        handleUnauthorized,
      );
      await loadWorkspace();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingMechanism(false);
    }
  }, [bootstrap, handleUnauthorized, loadWorkspace, setDataMessage, setIsSavingMechanism]);

  return {
    closeMechanismModal,
    handleDeleteMechanism,
    handleMechanismSubmit,
    handleToggleMechanismArchived,
    openCreateMechanismModal,
    openEditMechanismModal,
  };
}
