import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { useCallback } from "react";

import { buildEmptyPartInstancePayload } from "@/lib/appUtils/payloadBuilders";
import { partInstanceToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createPartInstanceRecord, updatePartInstanceRecord } from "@/lib/auth/records/parts";
import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { Dispatch, SetStateAction } from "react";
import type { MechanismRecord } from "@/types/recordsOrganization";
import type { PartInstancePayload } from "@/types/payloads";
import type { PartInstanceRecord } from "@/types/recordsInventory";
import { useCatalogDraftEditor } from "./useCatalogDraftEditor";

export function usePartInstanceActions({ bootstrap, handleUnauthorized, loadWorkspace, setBootstrap, setDataMessage, selectedProjectId, selectedSeasonId }: {
  selectedSeasonId: string | null;
  selectedProjectId: string | null;
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  setBootstrap: Dispatch<SetStateAction<BootstrapPayload>>;
  setDataMessage: (message: string | null) => void;
}) {
  const { beginOperation, resetEditor, isSaving: isSavingPartInstance } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const makeCreatePartInstanceDraft = useCallback((mechanism: MechanismRecord, partDefinitionId?: string) =>
    ({
      ...buildEmptyPartInstancePayload(bootstrap, { subsystemId: mechanism.subsystemId, mechanismId: mechanism.id }),
      ...(partDefinitionId ? { partDefinitionId } : {}),
    }), [bootstrap]);
  const {
    modalMode: partInstanceModalMode,
    activeRecordId: activePartInstanceId,
    draft: partInstanceDraft,
    setDraft: setPartInstanceDraft,
    openCreate: openCreatePartInstanceModal,
    openEdit: openEditPartInstanceModal,
    close: closePartInstanceModal,
  } = useCatalogDraftEditor({
    bootstrapIsEmpty: bootstrap === EMPTY_BOOTSTRAP,
    makeCreateDraft: makeCreatePartInstanceDraft,
    makeInitialDraft: () => buildEmptyPartInstancePayload(EMPTY_BOOTSTRAP),
    records: bootstrap.partInstances,
    resetOperation: resetEditor,
    selectedProjectId,
    selectedSeasonId,
    toDraft: partInstanceToPayload,
  });

  const handlePartInstanceSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!partInstanceModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      const selectedPartDefinition = bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === partInstanceDraft.partDefinitionId,
      );

      if (!selectedPartDefinition) {
        setDataMessage("Please choose a real part from the Parts tab before saving the part instance.");
        return;
      }

      if (!partInstanceDraft.mechanismId) {
        setDataMessage("Please choose a mechanism before saving the part instance.");
        return;
      }

      const payload: PartInstancePayload = {
        ...partInstanceDraft,
        name: partInstanceDraft.name.trim(),
      };

      if (partInstanceModalMode === "create") {
        await createPartInstanceRecord(payload, handleUnauthorized);
      } else if (partInstanceModalMode === "edit" && activePartInstanceId) {
        await updatePartInstanceRecord(
          activePartInstanceId,
          payload,
          handleUnauthorized,
        );
      }

      await operation.refresh();
      if (operation.isCurrent()) closePartInstanceModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activePartInstanceId, bootstrap, closePartInstanceModal, handleUnauthorized, partInstanceDraft, partInstanceModalMode, setDataMessage, beginOperation]);

  const removePartInstanceFromMechanism = useCallback(async (partInstanceId: string) => {
    const previousPartInstance = bootstrap.partInstances.find(
      (partInstance) => partInstance.id === partInstanceId,
    );
    if (!previousPartInstance || !previousPartInstance.mechanismId) {
      return false;
    }

    const optimisticPartInstance: PartInstanceRecord = {
      ...previousPartInstance,
      mechanismId: null,
    };

    setBootstrap((current) => ({
      ...current,
      partInstances: current.partInstances.map((partInstance) =>
        partInstance.id === partInstanceId ? optimisticPartInstance : partInstance,
      ),
    }));

    try {
      const updatedPartInstance = await updatePartInstanceRecord(
        partInstanceId,
        { mechanismId: null },
        handleUnauthorized,
      );

      setBootstrap((current) => ({
        ...current,
        partInstances: current.partInstances.map((partInstance) =>
          partInstance.id === partInstanceId ? { ...partInstance, ...updatedPartInstance } : partInstance,
        ),
      }));
      return true;
    } catch (error) {
      setBootstrap((current) => ({
        ...current,
        partInstances: current.partInstances.map((partInstance) =>
          partInstance.id === partInstanceId ? previousPartInstance : partInstance,
        ),
      }));
      setDataMessage(toErrorMessage(error));
      return false;
    }
  }, [bootstrap, handleUnauthorized, setBootstrap, setDataMessage]);

  return {
    partInstanceModalMode,
    activePartInstanceId,
    partInstanceDraft,
    isSavingPartInstance,
    setPartInstanceDraft,
    closePartInstanceModal,
    handlePartInstanceSubmit,
    openCreatePartInstanceModal,
    openEditPartInstanceModal,
    removePartInstanceFromMechanism,
  };
}
