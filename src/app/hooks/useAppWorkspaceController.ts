import { useAppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { useAppWorkspaceReportModalActions } from "@/app/hooks/workspace/report/useAppWorkspaceReportModalActions";
import { useAppWorkspaceReportRiskActions } from "@/app/hooks/workspace/report/useAppWorkspaceReportRiskActions";
import { useAppWorkspaceReportSubmitActions } from "@/app/hooks/workspace/report/useAppWorkspaceReportSubmitActions";
import { useAppWorkspaceRosterMemberActions } from "@/app/hooks/workspace/roster/useAppWorkspaceRosterMemberActions";
import { useAppWorkspaceRosterRobotActions } from "@/app/hooks/workspace/roster/useAppWorkspaceRosterRobotActions";
import { useAppWorkspaceRosterSeasonActions } from "@/app/hooks/workspace/roster/useAppWorkspaceRosterSeasonActions";

export function useAppWorkspaceController() {
  const state = useAppWorkspaceState();
  const model = useAppWorkspaceModel(state);
  const reportActions = {
    ...useAppWorkspaceReportModalActions(model),
    ...useAppWorkspaceReportRiskActions(model),
    ...useAppWorkspaceReportSubmitActions(model),
  };
  const rosterActions = {
    ...useAppWorkspaceRosterMemberActions(model),
    ...useAppWorkspaceRosterRobotActions(model),
    ...useAppWorkspaceRosterSeasonActions(model),
  };
  return { model, reportActions, rosterActions };
}

export type AppWorkspaceController = ReturnType<typeof useAppWorkspaceController>;
