import { useAppWorkspaceUiStatePeople } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStatePeople";
import { useAppWorkspaceUiStateReports } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateReports";
import { useAppWorkspaceUiStateTasks } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateTasks";
import { useAppWorkspaceUiStateWorkLog } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateWorkLog";

export function useAppWorkspaceUiStateGroups() {
  return {
    ...useAppWorkspaceUiStateTasks(),
    ...useAppWorkspaceUiStateWorkLog(),
    ...useAppWorkspaceUiStateReports(),
    ...useAppWorkspaceUiStatePeople(),
  };
}
