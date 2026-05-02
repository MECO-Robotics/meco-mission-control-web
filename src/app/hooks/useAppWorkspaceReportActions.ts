// @ts-nocheck
import { useAppWorkspaceReportModalActions } from "@/app/hooks/useAppWorkspaceReportModalActions";
import { useAppWorkspaceReportRiskActions } from "@/app/hooks/useAppWorkspaceReportRiskActions";
import { useAppWorkspaceReportSubmitActions } from "@/app/hooks/useAppWorkspaceReportSubmitActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";

export type AppWorkspaceReportActions = ReturnType<typeof useAppWorkspaceReportActions>;

export function useAppWorkspaceReportActions(model: AppWorkspaceModel) {
  return {
    ...useAppWorkspaceReportModalActions(model),
    ...useAppWorkspaceReportRiskActions(model),
    ...useAppWorkspaceReportSubmitActions(model),
  };
}
