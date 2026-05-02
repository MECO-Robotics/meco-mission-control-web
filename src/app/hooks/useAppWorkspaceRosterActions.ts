import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";
import { useAppWorkspaceRosterMemberActions } from "@/app/hooks/useAppWorkspaceRosterMemberActions";
import { useAppWorkspaceRosterRobotActions } from "@/app/hooks/useAppWorkspaceRosterRobotActions";
import { useAppWorkspaceRosterSeasonActions } from "@/app/hooks/useAppWorkspaceRosterSeasonActions";

export type AppWorkspaceRosterActions = ReturnType<typeof useAppWorkspaceRosterActions>;

export function useAppWorkspaceRosterActions(model: AppWorkspaceModel) {
  return {
    ...useAppWorkspaceRosterMemberActions(model),
    ...useAppWorkspaceRosterRobotActions(model),
    ...useAppWorkspaceRosterSeasonActions(model),
  };
}
