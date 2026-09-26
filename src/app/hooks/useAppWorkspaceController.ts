import { useAppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceReportActions } from "@/app/hooks/useAppWorkspaceReportActions";
import { useAppWorkspaceRosterActions } from "@/app/hooks/useAppWorkspaceRosterActions";
import { useAppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
export function useAppWorkspaceController() {
  const state = useAppWorkspaceState();
  const model = useAppWorkspaceModel(state);
  const reportActions = useAppWorkspaceReportActions(model);
  const rosterActions = useAppWorkspaceRosterActions(model);
  return { auth: model, model, reportActions, rosterActions };
}

export type AppWorkspaceController = ReturnType<typeof useAppWorkspaceController>;
