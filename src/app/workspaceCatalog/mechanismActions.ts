import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback, useState, useEffect } from "react";

import { buildEmptyMechanismPayload } from "@/lib/appUtils/payloadBuilders";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createMechanismRecord, deleteMechanismRecord, updateMechanismRecord } from "@/lib/auth/records/structure";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { MechanismPayload } from "@/types/payloads";
import type { MechanismRecord } from "@/types/recordsOrganization";

export function useMechanismActions({ bootstrap, handleUnauthorized, loadWorkspace, scopedBootstrap, setDataMessage, selectedProjectId, selectedSeasonId }: {
  selectedSeasonId: string | null;
  selectedProjectId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  scopedBootstrap: BootstrapPayload;
  setDataMessage: (message: string | null) => void;
}) {
  const [mechanismModalMode, setMechanismModalMode] =
    useState<"create" | "edit" | null>(null);
  const [activeMechanismId, setActiveMechanismId] = useState<string | null>(null);
  const [mechanismDraft, setMechanismDraft] = useState<MechanismPayload>(
    buildEmptyMechanismPayload(EMPTY_BOOTSTRAP),
  );
  const { beginOperation, resetEditor, isSaving: isSavingMechanism, isDeleting: isDeletingMechanism } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const openCreateMechanismModal = useCallback(() => {
    resetEditor();
    setActiveMechanismId(null);
    setMechanismDraft(buildEmptyMechanismPayload(scopedBootstrap));
    setMechanismModalMode("create");
  }, [scopedBootstrap, resetEditor]);

  const openEditMechanismModal = useCallback((item: MechanismRecord) => {
    resetEditor();
    setActiveMechanismId(item.id);
    setMechanismDraft(item as MechanismPayload);
    setMechanismModalMode("edit");
  }, [resetEditor]);

  const closeMechanismModal = useCallback(() => {
    resetEditor();
    setMechanismModalMode(null);
    setActiveMechanismId(null);
  }, [resetEditor]);

  useEffect(() => closeMechanismModal(), [closeMechanismModal, selectedProjectId, selectedSeasonId]);

  useEffect(() => {
    if (bootstrap === EMPTY_BOOTSTRAP || (mechanismModalMode === "edit" && !scopedBootstrap.mechanisms.some((item) => item.id === activeMechanismId))) {
      closeMechanismModal();
    }
  }, [activeMechanismId, bootstrap, closeMechanismModal, mechanismModalMode, scopedBootstrap]);

  const handleMechanismSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!mechanismModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      if (mechanismModalMode === "create") {
        await createMechanismRecord(mechanismDraft, handleUnauthorized);
      } else if (mechanismModalMode === "edit" && activeMechanismId) {
        await updateMechanismRecord(activeMechanismId, mechanismDraft, handleUnauthorized);
      }

      await operation.refresh();
      if (operation.isCurrent()) closeMechanismModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeMechanismId, closeMechanismModal, handleUnauthorized, mechanismDraft, mechanismModalMode, setDataMessage, beginOperation]);

  const handleDeleteMechanism = useCallback(async (mechanismId: string) => {
    const operation = beginOperation("delete");
    if (!operation) return;
    setDataMessage(null);

    try {
      await deleteMechanismRecord(mechanismId, handleUnauthorized);
      await operation.refresh();
      if (operation.isCurrent() && activeMechanismId === mechanismId) closeMechanismModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeMechanismId, closeMechanismModal, handleUnauthorized, setDataMessage, beginOperation]);

  const handleToggleMechanismArchived = useCallback(async (mechanismId: string) => {
    const currentMechanism = bootstrap.mechanisms.find(
      (mechanism) => mechanism.id === mechanismId,
    );
    if (!currentMechanism) {
      return;
    }

    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      await updateMechanismRecord(
        mechanismId,
        { isArchived: !currentMechanism.isArchived },
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
    mechanismModalMode,
    activeMechanismId,
    mechanismDraft,
    isSavingMechanism,
    isDeletingMechanism,
    setMechanismDraft,
    closeMechanismModal,
    handleDeleteMechanism,
    handleMechanismSubmit,
    handleToggleMechanismArchived,
    openCreateMechanismModal,
    openEditMechanismModal,
  };
}
