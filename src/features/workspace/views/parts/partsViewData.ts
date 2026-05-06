import type { BootstrapPayload } from "@/types/bootstrap";
import { formatIterationVersion } from "@/lib/appUtils/common";
import { filterSelectionIncludes } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

export function filterPartDefinitions({
  bootstrap,
  partSearch,
  partStatus,
  partSubsystem,
  showArchivedPartDefinitions = false,
}: {
  bootstrap: BootstrapPayload;
  partSearch: string;
  partStatus: FilterSelection;
  partSubsystem: FilterSelection;
  showArchivedPartDefinitions?: boolean;
}) {
  const search = partSearch.trim().toLowerCase();
  const hasInstanceFilters = partSubsystem.length > 0 || partStatus.length > 0;

  return bootstrap.partDefinitions.filter((partDefinition) => {
    if (!showArchivedPartDefinitions && partDefinition.isArchived) {
      return false;
    }

    const materialName = partDefinition.materialId
      ? bootstrap.materials.find((material) => material.id === partDefinition.materialId)?.name ?? ""
      : "";
    const matchesSearch =
      !search ||
      partDefinition.name.toLowerCase().includes(search) ||
      partDefinition.partNumber.toLowerCase().includes(search) ||
      `iteration ${partDefinition.iteration}`.includes(search) ||
      formatIterationVersion(partDefinition.iteration).toLowerCase().includes(search) ||
      partDefinition.type.toLowerCase().includes(search) ||
      partDefinition.source.toLowerCase().includes(search) ||
      materialName.toLowerCase().includes(search);

    if (!matchesSearch) {
      return false;
    }

    if (!hasInstanceFilters) {
      return true;
    }

    return bootstrap.partInstances.some(
      (partInstance) =>
        partInstance.partDefinitionId === partDefinition.id &&
        filterSelectionIncludes(partSubsystem, partInstance.subsystemId) &&
        filterSelectionIncludes(partStatus, partInstance.status),
    );
  });
}
