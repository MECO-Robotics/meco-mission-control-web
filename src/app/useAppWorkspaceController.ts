import { useAppWorkspaceCatalogActions } from "@/app/useAppWorkspaceCatalogActions";
import { useAppWorkspaceModel } from "@/app/useAppWorkspaceModel";
import { useAppWorkspaceReportActions } from "@/app/useAppWorkspaceReportActions";
import { useAppWorkspaceRosterActions } from "@/app/useAppWorkspaceRosterActions";
import { useAppWorkspaceState } from "@/app/useAppWorkspaceState";
import { useAppWorkspaceTaskActions } from "@/app/useAppWorkspaceTaskActions";

export type AppWorkspaceController = ReturnType<typeof useAppWorkspaceController>;

export function useAppWorkspaceController() {
  const state = useAppWorkspaceState();
  const model = useAppWorkspaceModel(state);
  const taskActions = useAppWorkspaceTaskActions(model);
  const reportActions = useAppWorkspaceReportActions(model);
  const catalogActions = useAppWorkspaceCatalogActions(model);
  const rosterActions = useAppWorkspaceRosterActions(model);

  return {
    ...model,
    ...taskActions,
    ...reportActions,
    ...catalogActions,
    ...rosterActions,
  };
}
