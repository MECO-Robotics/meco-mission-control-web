import { useAppWorkspaceUiStateManufacturing } from "@/app/hooks/useAppWorkspaceUiStateManufacturing";
import { useAppWorkspaceUiStateMaterialAndStructure } from "@/app/hooks/useAppWorkspaceUiStateMaterialAndStructure";
import { useAppWorkspaceUiStatePeople } from "@/app/hooks/useAppWorkspaceUiStatePeople";
import { useAppWorkspaceUiStatePurchase } from "@/app/hooks/useAppWorkspaceUiStatePurchase";
import { useAppWorkspaceUiStateReports } from "@/app/hooks/useAppWorkspaceUiStateReports";
import { useAppWorkspaceUiStateTasks } from "@/app/hooks/useAppWorkspaceUiStateTasks";
import { useAppWorkspaceUiStateWorkLog } from "@/app/hooks/useAppWorkspaceUiStateWorkLog";

export function useAppWorkspaceUiStateGroups() {
  return {
    ...useAppWorkspaceUiStateTasks(),
    ...useAppWorkspaceUiStateWorkLog(),
    ...useAppWorkspaceUiStateReports(),
    ...useAppWorkspaceUiStatePurchase(),
    ...useAppWorkspaceUiStateManufacturing(),
    ...useAppWorkspaceUiStateMaterialAndStructure(),
    ...useAppWorkspaceUiStatePeople(),
  };
}
