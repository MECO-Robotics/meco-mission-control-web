import { useCallback } from "react";

import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { toErrorMessage } from "@/lib/appUtils/common";
import { createRiskRecord, deleteRiskRecord, updateRiskRecord } from "@/lib/auth/records/reporting";
import type { RiskPayload } from "@/types/payloads";

export type AppWorkspaceReportRiskActions = ReturnType<typeof useAppWorkspaceReportRiskActions>;

function normalizeRiskPayload(payload: RiskPayload): RiskPayload {
  const mitigationTaskId =
    typeof payload.mitigationTaskId === "string" && payload.mitigationTaskId.trim().length > 0
      ? payload.mitigationTaskId.trim()
      : null;

  return {
    ...payload,
    title: payload.title.trim(),
    detail: payload.detail.trim(),
    sourceId: payload.sourceId.trim(),
    attachmentId: payload.attachmentId.trim(),
    mitigationTaskId,
  };
}

export function useAppWorkspaceReportRiskActions(model: AppWorkspaceModel) {
  const handleCreateRisk = useCallback(
    async (payload: RiskPayload) => {
      model.setDataMessage(null);

      try {
        await createRiskRecord(normalizeRiskPayload(payload), model.handleUnauthorized);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
        throw error;
      }
    },
    [model],
  );

  const handleUpdateRisk = useCallback(
    async (riskId: string, payload: RiskPayload) => {
      model.setDataMessage(null);

      try {
        await updateRiskRecord(riskId, normalizeRiskPayload(payload), model.handleUnauthorized);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
        throw error;
      }
    },
    [model],
  );

  const handleDeleteRisk = useCallback(
    async (riskId: string) => {
      model.setDataMessage(null);

      try {
        await deleteRiskRecord(riskId, model.handleUnauthorized);
        await model.loadWorkspace();
      } catch (error) {
        model.setDataMessage(toErrorMessage(error));
        throw error;
      }
    },
    [model],
  );

  return {
    handleCreateRisk,
    handleDeleteRisk,
    handleUpdateRisk,
  };
}
