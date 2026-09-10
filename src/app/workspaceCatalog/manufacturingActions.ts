import { useCallback } from "react";

import { buildEmptyManufacturingPayload } from "@/lib/appUtils/manufacturing";
import { manufacturingToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createManufacturingItemRecord, updateManufacturingItemRecord } from "@/lib/auth/records/production";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { ManufacturingItemPayload } from "@/types/payloads";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";

export type ManufacturingActions = ReturnType<typeof useManufacturingActions>;

export function useManufacturingActions({
  activeManufacturingId,
  bootstrap,
  handleUnauthorized,
  loadWorkspace,
  manufacturingDraft,
  manufacturingModalMode,
  setActiveManufacturingId,
  setDataMessage,
  setIsSavingManufacturing,
  setManufacturingDraft,
  setManufacturingModalMode,
  signedInMember,
}: {
  activeManufacturingId: AppWorkspaceModel["activeManufacturingId"];
  bootstrap: AppWorkspaceModel["bootstrap"];
  handleUnauthorized: AppWorkspaceModel["handleUnauthorized"];
  loadWorkspace: AppWorkspaceModel["loadWorkspace"];
  manufacturingDraft: AppWorkspaceModel["manufacturingDraft"];
  manufacturingModalMode: AppWorkspaceModel["manufacturingModalMode"];
  setActiveManufacturingId: AppWorkspaceModel["setActiveManufacturingId"];
  setDataMessage: AppWorkspaceModel["setDataMessage"];
  setIsSavingManufacturing: AppWorkspaceModel["setIsSavingManufacturing"];
  setManufacturingDraft: AppWorkspaceModel["setManufacturingDraft"];
  setManufacturingModalMode: AppWorkspaceModel["setManufacturingModalMode"];
  signedInMember: AppWorkspaceModel["signedInMember"];
}) {
  const openCreateManufacturingModal = useCallback((process: ManufacturingItemPayload["process"]) => {
    setActiveManufacturingId(null);
    setManufacturingDraft(
      buildEmptyManufacturingPayload(
        bootstrap,
        process,
        process === "cnc" ? signedInMember?.id ?? null : null,
      ),
    );
    setManufacturingModalMode("create");
  }, [bootstrap, setActiveManufacturingId, setManufacturingDraft, setManufacturingModalMode, signedInMember]);

  const openEditManufacturingModal = useCallback((item: ManufacturingItemRecord) => {
    setActiveManufacturingId(item.id);
    setManufacturingDraft(manufacturingToPayload(item));
    setManufacturingModalMode("edit");
  }, [setActiveManufacturingId, setManufacturingDraft, setManufacturingModalMode]);

  const closeManufacturingModal = useCallback(() => {
    setManufacturingModalMode(null);
    setActiveManufacturingId(null);
  }, [setActiveManufacturingId, setManufacturingModalMode]);

  const handleManufacturingSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    setIsSavingManufacturing(true);
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

      await loadWorkspace();
      closeManufacturingModal();
    } catch (error) {
      setDataMessage(toErrorMessage(error));
    } finally {
      setIsSavingManufacturing(false);
    }
  }, [activeManufacturingId, bootstrap, closeManufacturingModal, handleUnauthorized, loadWorkspace, manufacturingDraft, manufacturingModalMode, setDataMessage, setIsSavingManufacturing]);

  const handleCncQuickStatusChange = useCallback(
    async (
      item: ManufacturingItemRecord,
      status: ManufacturingItemRecord["status"],
    ) => {
      if (item.status === status && item.mentorReviewed) {
        return;
      }

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
        await loadWorkspace();
      } catch (error) {
        setDataMessage(toErrorMessage(error));
      }
    },
    [handleUnauthorized, loadWorkspace, setDataMessage],
  );

  return {
    closeManufacturingModal,
    handleCncQuickStatusChange,
    handleManufacturingSubmit,
    openCreateManufacturingModal,
    openEditManufacturingModal,
  };
}
