import { useCallback } from "react";

import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { toErrorMessage } from "@/lib/appUtils/common";
import { deleteRiskRecord, updateRiskRecord } from "@/lib/auth/records/reporting";
import type { RiskPayload } from "@/types/payloads";
import { sanitizeRiskPayload } from "@/features/workspace/views/riskViewData/riskViewDataPayload";

export type AppWorkspaceReportRiskActions = ReturnType<typeof useAppWorkspaceReportRiskActions>;

export function useAppWorkspaceReportRiskActions(model: AppWorkspaceModel) {
  const handleUpdateRisk = useCallback(
    async (riskId: string, payload: RiskPayload) => {
      model.setDataMessage(null);

      try {
        await updateRiskRecord(riskId, sanitizeRiskPayload(payload), model.handleUnauthorized);
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
    handleDeleteRisk,
    handleUpdateRisk,
  };
}
