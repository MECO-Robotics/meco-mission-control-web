import { useCallback } from "react";

import { buildEmptyManufacturingPayload } from "@/lib/appUtils/manufacturing";
import { manufacturingToPayload } from "@/lib/appUtils/payloadConversions";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createManufacturingItemRecord, updateManufacturingItemRecord } from "@/lib/auth/records/production";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { ManufacturingItemPayload } from "@/types/payloads";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";

export type ManufacturingActions = ReturnType<typeof useManufacturingActions>;

export function useManufacturingActions(model: AppWorkspaceModel) {
  const openCreateManufacturingModal = useCallback((process: ManufacturingItemPayload["process"]) => {
    model.setActiveManufacturingId(null);
    model.setManufacturingDraft(
      buildEmptyManufacturingPayload(
        model.bootstrap,
        process,
        process === "cnc" ? model.signedInMember?.id ?? null : null,
      ),
    );
    model.setManufacturingModalMode("create");
  }, [model]);

  const openEditManufacturingModal = useCallback((item: ManufacturingItemRecord) => {
    model.setActiveManufacturingId(item.id);
    model.setManufacturingDraft(manufacturingToPayload(item));
    model.setManufacturingModalMode("edit");
  }, [model]);

  const closeManufacturingModal = useCallback(() => {
    model.setManufacturingModalMode(null);
    model.setActiveManufacturingId(null);
  }, [model]);

  const handleManufacturingSubmit = useCallback(async (milestone: React.FormEvent<HTMLFormElement>) => {
    milestone.preventDefault();
    model.setIsSavingManufacturing(true);
    model.setDataMessage(null);

    try {
      const selectedPartDefinition = model.manufacturingDraft.partDefinitionId
        ? model.bootstrap.partDefinitions.find(
            (partDefinition) => partDefinition.id === model.manufacturingDraft.partDefinitionId,
          )
        : null;

      if (!selectedPartDefinition) {
        model.setDataMessage("Please choose a real part from the Parts tab before saving the manufacturing job.");
        return;
      }

      const selectedPartInstanceIds =
        model.manufacturingDraft.partInstanceIds.length > 0
          ? model.manufacturingDraft.partInstanceIds
          : model.manufacturingDraft.partInstanceId
            ? [model.manufacturingDraft.partInstanceId]
            : [];
      const selectedPartInstances = selectedPartInstanceIds
        .map((partInstanceId) =>
          model.bootstrap.partInstances.find((partInstance) => partInstance.id === partInstanceId),
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
        model.setDataMessage("Select at least one part instance for this manufacturing job.");
        return;
      }

      const primaryPartInstance = selectedPartInstances[0] ?? null;

      const payload: ManufacturingItemPayload = {
        ...model.manufacturingDraft,
        subsystemId: primaryPartInstance?.subsystemId ?? model.manufacturingDraft.subsystemId,
        title: selectedPartDefinition.name,
        partInstanceId: primaryPartInstance?.id ?? null,
        partInstanceIds: selectedPartInstances.map((partInstance) => partInstance.id),
        inHouse: model.manufacturingDraft.process === "cnc" ? model.manufacturingDraft.inHouse : false,
        batchLabel: model.manufacturingDraft.batchLabel?.trim() || undefined,
      };

      if (model.manufacturingModalMode === "create") {
        await createManufacturingItemRecord(payload, model.handleUnauthorized);
      } else if (model.manufacturingModalMode === "edit" && model.activeManufacturingId) {
        await updateManufacturingItemRecord(
          model.activeManufacturingId,
          payload,
          model.handleUnauthorized,
        );
      }

      await model.loadWorkspace();
      closeManufacturingModal();
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
    } finally {
      model.setIsSavingManufacturing(false);
    }
  }, [closeManufacturingModal, model]);

  const handleCncQuickStatusChange = useCallback(
    async (
      item: ManufacturingItemRecord,
      status: ManufacturingItemRecord["status"],
    ) => {
      if (item.status === status && item.mentorReviewed) {
        return;
      }

      model.setDataMessage(null);
      try {
        await updateManufacturingItemRecord(
          item.id,
          {
            mentorReviewed: true,
            status,
          },
          model.handleUnauthorized,
        );
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
      }
    },
    [model],
  );

  return {
    closeManufacturingModal,
    handleCncQuickStatusChange,
    handleManufacturingSubmit,
    openCreateManufacturingModal,
    openEditManufacturingModal,
  };
}
