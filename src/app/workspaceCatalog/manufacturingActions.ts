import { useCallback, useState, useEffect } from "react";

import { buildEmptyManufacturingPayload } from "@/lib/appUtils/manufacturing";
import { manufacturingToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createManufacturingItemRecord, updateManufacturingItemRecord } from "@/lib/auth/records/production";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { WorkspaceLoader } from "@/app/hooks/workspace/loader/useAppWorkspaceLoaderWorkspaceTypes";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { useCatalogEditorLifecycle } from "./useCatalogEditorLifecycle";
import type { ManufacturingItemPayload } from "@/types/payloads";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";

export function useManufacturingActions({ bootstrap, handleUnauthorized, loadWorkspace, setDataMessage, selectedProjectId, selectedSeasonId, signedInMemberId }: {
  bootstrap: BootstrapPayload;
  handleUnauthorized: () => void;
  loadWorkspace: WorkspaceLoader;
  setDataMessage: (message: string | null) => void;
  selectedProjectId: string | null;
  selectedSeasonId: string | null;
  signedInMemberId: string | null;
}) {
  const [manufacturingModalMode, setManufacturingModalMode] =
    useState<"create" | "edit" | null>(null);
  const [activeManufacturingId, setActiveManufacturingId] = useState<string | null>(
    null,
  );
  const [manufacturingDraft, setManufacturingDraft] =
    useState<ManufacturingItemPayload>(
      buildEmptyManufacturingPayload(EMPTY_BOOTSTRAP, "cnc"),
    );
  const { beginOperation, resetEditor, isSaving: isSavingManufacturing, captureWorkspace } =
    useCatalogEditorLifecycle({ loadWorkspace, selectedProjectId, selectedSeasonId });
  const openCreateManufacturingModal = useCallback((process: ManufacturingItemPayload["process"]) => {
    resetEditor();
    setActiveManufacturingId(null);
    setManufacturingDraft(
      buildEmptyManufacturingPayload(
        bootstrap,
        process,
        process === "cnc" ? signedInMemberId : null,
      ),
    );
    setManufacturingModalMode("create");
  }, [bootstrap, signedInMemberId, resetEditor]);

  const openEditManufacturingModal = useCallback((item: ManufacturingItemRecord) => {
    resetEditor();
    setActiveManufacturingId(item.id);
    setManufacturingDraft(manufacturingToPayload(item));
    setManufacturingModalMode("edit");
  }, [resetEditor]);

  const closeManufacturingModal = useCallback(() => {
    resetEditor();
    setManufacturingModalMode(null);
    setActiveManufacturingId(null);
  }, [resetEditor]);

  useEffect(() => closeManufacturingModal(), [closeManufacturingModal, selectedProjectId, selectedSeasonId]);

  useEffect(() => {
    if (bootstrap === EMPTY_BOOTSTRAP || (manufacturingModalMode === "edit" && !bootstrap.manufacturingItems.some((item) => item.id === activeManufacturingId))) {
      closeManufacturingModal();
    }
  }, [activeManufacturingId, bootstrap, closeManufacturingModal, manufacturingModalMode]);

  const handleManufacturingSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    if (!manufacturingModalMode) return;
    const operation = beginOperation();
    if (!operation) return;
    setDataMessage(null);

    try {
      const selectedPartDefinition = manufacturingDraft.partDefinitionId
        ? bootstrap.partDefinitions.find(
            (partDefinition) => partDefinition.id === manufacturingDraft.partDefinitionId,
          )
        : null;

      if (!selectedPartDefinition) {
        setDataMessage("Please choose a real part from the Parts tab before saving the manufacturing job.");
        return;
      }

      const selectedPartInstanceIds =
        manufacturingDraft.partInstanceIds.length > 0
          ? manufacturingDraft.partInstanceIds
          : manufacturingDraft.partInstanceId
            ? [manufacturingDraft.partInstanceId]
            : [];
      const selectedPartInstances = selectedPartInstanceIds
        .map((partInstanceId) =>
          bootstrap.partInstances.find((partInstance) => partInstance.id === partInstanceId),
        )
        .filter((partInstance): partInstance is NonNullable<typeof partInstance> => {
          if (!partInstance) {
            return false;
          }

          return (
            !selectedPartDefinition ||
            partInstance.partDefinitionId === selectedPartDefinition.id
          );
        });

      if (selectedPartInstances.length === 0) {
        setDataMessage("Select at least one part instance for this manufacturing job.");
        return;
      }

      const primaryPartInstance = selectedPartInstances[0] ?? null;

      const payload: ManufacturingItemPayload = {
        ...manufacturingDraft,
        subsystemId: primaryPartInstance?.subsystemId ?? manufacturingDraft.subsystemId,
        title: selectedPartDefinition.name,
        partInstanceId: primaryPartInstance?.id ?? null,
        partInstanceIds: selectedPartInstances.map((partInstance) => partInstance.id),
        inHouse: manufacturingDraft.process === "cnc" ? manufacturingDraft.inHouse : false,
        batchLabel: manufacturingDraft.batchLabel?.trim() || undefined,
      };

      if (manufacturingModalMode === "create") {
        await createManufacturingItemRecord(payload, handleUnauthorized);
      } else if (manufacturingModalMode === "edit" && activeManufacturingId) {
        await updateManufacturingItemRecord(
          activeManufacturingId,
          payload,
          handleUnauthorized,
        );
      }

      await operation.refresh();
      if (operation.isCurrent()) closeManufacturingModal();
    } catch (error) {
      if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
    } finally {
      operation.finish();
    }
  }, [activeManufacturingId, bootstrap, closeManufacturingModal, handleUnauthorized, manufacturingDraft, manufacturingModalMode, setDataMessage, beginOperation]);

  const handleCncQuickStatusChange = useCallback(
    async (
      item: ManufacturingItemRecord,
      status: ManufacturingItemRecord["status"],
    ) => {
      if (item.status === status && item.mentorReviewed) {
        return;
      }

      const operation = captureWorkspace();
      setDataMessage(null);
      try {
        await updateManufacturingItemRecord(
          item.id,
          {
            mentorReviewed: true,
            status,
          },
          handleUnauthorized,
        );
        await operation.refresh();
      } catch (error) {
        if (operation.isCurrent()) setDataMessage(toErrorMessage(error));
      }
    },
    [captureWorkspace, handleUnauthorized, setDataMessage],
  );

  return {
    manufacturingModalMode,
    activeManufacturingId,
    manufacturingDraft,
    setManufacturingDraft,
    isSavingManufacturing,
    closeManufacturingModal,
    handleCncQuickStatusChange,
    handleManufacturingSubmit,
    openCreateManufacturingModal,
    openEditManufacturingModal,
  };
}
