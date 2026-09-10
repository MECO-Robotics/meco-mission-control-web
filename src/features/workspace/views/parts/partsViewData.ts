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
    const matchingInstances = bootstrap.partInstances.filter((instance) =>
      instance.partDefinitionId === partDefinition.id &&
      filterSelectionIncludes(partSubsystem, instance.subsystemId) &&
      filterSelectionIncludes(partStatus, instance.status),
    );
    const matchesSearch =
      !search ||
      partDefinition.name.toLowerCase().includes(search) ||
      partDefinition.partNumber.toLowerCase().includes(search) ||
      `iteration ${partDefinition.iteration}`.includes(search) ||
      formatIterationVersion(partDefinition.iteration).toLowerCase().includes(search) ||
      partDefinition.type.toLowerCase().includes(search) ||
      partDefinition.source.toLowerCase().includes(search) ||
      materialName.toLowerCase().includes(search) ||
      matchingInstances.some((instance) => instance.name.toLowerCase().includes(search) ||
        bootstrap.mechanisms.some((mechanism) => mechanism.id === instance.mechanismId && mechanism.name.toLowerCase().includes(search)),
      );

    if (!matchesSearch) {
      return false;
    }

    if (!hasInstanceFilters) {
      return true;
    }

    return matchingInstances.length > 0;
  });
}
