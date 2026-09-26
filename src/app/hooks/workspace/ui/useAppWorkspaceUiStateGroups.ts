import { useAppWorkspaceUiStatePeople } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStatePeople";
import { useAppWorkspaceUiStateReports } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateReports";
import { useAppWorkspaceUiStateWorkLog } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateWorkLog";

export function useAppWorkspaceUiStateGroups() {
  return {
    ...useAppWorkspaceUiStateWorkLog(),
    ...useAppWorkspaceUiStateReports(),
    ...useAppWorkspaceUiStatePeople(),
  };
}
