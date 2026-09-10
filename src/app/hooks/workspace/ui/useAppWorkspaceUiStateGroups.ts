import { useAppWorkspaceUiStateManufacturing } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateManufacturing";
import { useAppWorkspaceUiStateStructure } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateStructure";
import { useAppWorkspaceUiStatePeople } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStatePeople";
import { useAppWorkspaceUiStatePurchase } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStatePurchase";
import { useAppWorkspaceUiStateReports } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateReports";
import { useAppWorkspaceUiStateTasks } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateTasks";
import { useAppWorkspaceUiStateWorkLog } from "@/app/hooks/workspace/ui/useAppWorkspaceUiStateWorkLog";

export function useAppWorkspaceUiStateGroups() {
  return {
    ...useAppWorkspaceUiStateTasks(),
    ...useAppWorkspaceUiStateWorkLog(),
    ...useAppWorkspaceUiStateReports(),
    ...useAppWorkspaceUiStatePurchase(),
    ...useAppWorkspaceUiStateManufacturing(),
    ...useAppWorkspaceUiStateStructure(),
    ...useAppWorkspaceUiStatePeople(),
  };
}
