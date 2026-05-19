import { useCallback } from "react";

import { toErrorMessage } from "@/lib/appUtils/common";
import {
  createPartDefinitionRecord,
  createPartInstanceRecord,
  deletePartInstanceRecord,
  updatePartDefinitionRecord,
} from "@/lib/auth/records/parts";
import type { AppWorkspaceModel } from "../hooks/useAppWorkspaceModel";
import type { PartMappingChange } from "@/features/workspace/views/partMappingSync/partMappingSyncTypes";

export type PartMappingSyncActions = ReturnType<typeof usePartMappingSyncActions>;

export function usePartMappingSyncActions(model: AppWorkspaceModel) {
  const applyPartMappingChanges = useCallback(async (changes: PartMappingChange[]) => {
    const approvedChanges = changes.filter((change) => change.decision === "approved");
    if (approvedChanges.length === 0) {
      model.setDataMessage("No approved mapping changes to apply.");
      return false;
    }

    model.setIsLoadingData(true);
    model.setDataMessage(null);

    try {
      const createdPartIdsByChangeId = new Map<string, string>();

      for (const change of approvedChanges) {
        if (change.kind !== "new-part") {
          continue;
        }

        const createdPart = await createPartDefinitionRecord(
          change.payload,
          model.handleUnauthorized,
        );
        createdPartIdsByChangeId.set(change.id.replace("part-create-", ""), createdPart.id);
      }

      for (const change of approvedChanges) {
        if (change.kind === "new-iteration" || change.kind === "archived-part") {
          await updatePartDefinitionRecord(
            change.partDefinitionId,
            change.payload,
            model.handleUnauthorized,
          );
        }

        if (change.kind === "new-instance") {
          const pendingPartId = change.payload.partDefinitionId.startsWith("pending:")
            ? createdPartIdsByChangeId.get(change.payload.partDefinitionId.replace("pending:", ""))
            : change.payload.partDefinitionId;

          if (!pendingPartId) {
            continue;
          }

          await createPartInstanceRecord(
            { ...change.payload, partDefinitionId: pendingPartId },
            model.handleUnauthorized,
          );
        }

        if (change.kind === "deleted-instance") {
          await deletePartInstanceRecord(change.partInstanceId, model.handleUnauthorized);
        }
      }

      await model.loadWorkspace();
      model.setDataMessage(`${approvedChanges.length} mapping changes applied.`);
      return true;
    } catch (error) {
      model.setDataMessage(toErrorMessage(error));
      return false;
    } finally {
      model.setIsLoadingData(false);
    }
  }, [model]);

  return { applyPartMappingChanges };
}
