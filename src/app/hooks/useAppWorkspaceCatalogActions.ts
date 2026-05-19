import { useArtifactActions } from "@/app/workspaceCatalog/artifactActions";
import { useManufacturingActions } from "@/app/workspaceCatalog/manufacturingActions";
import { useMaterialActions } from "@/app/workspaceCatalog/materialActions";
import { useMechanismActions } from "@/app/workspaceCatalog/mechanismActions";
import { usePartDefinitionActions } from "@/app/workspaceCatalog/partDefinitionActions";
import { usePartInstanceActions } from "@/app/workspaceCatalog/partInstanceActions";
import { usePartMappingSyncActions } from "@/app/workspaceCatalog/partMappingSyncActions";
import { usePurchaseActions } from "@/app/workspaceCatalog/purchaseActions";
import { useSubsystemActions } from "@/app/workspaceCatalog/subsystemActions";
import { useWorkstreamActions } from "@/app/workspaceCatalog/workstreamActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";

export type AppWorkspaceCatalogActions = ReturnType<typeof useAppWorkspaceCatalogActions>;

export function useAppWorkspaceCatalogActions(model: AppWorkspaceModel) {
  return {
    ...usePurchaseActions(model),
    ...useManufacturingActions(model),
    ...useMaterialActions(model),
    ...useArtifactActions(model),
    ...useWorkstreamActions(model),
    ...usePartDefinitionActions(model),
    ...usePartInstanceActions(model),
    ...usePartMappingSyncActions(model),
    ...useSubsystemActions(model),
    ...useMechanismActions(model),
  };
}
