import { useMemo, useState } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";

import { filterPartDefinitions } from "./parts/partsViewData";
import { PartsDefinitionSection } from "./parts/PartsDefinitionSection";
import { PartsInstanceSection } from "./parts/PartsInstanceSection";
import { PartsToolbar } from "./parts/PartsToolbar";
import type { PartsViewProps } from "./parts/partsViewTypes";

export { filterPartDefinitions } from "./parts/partsViewData";

export function PartsView({
  bootstrap,
  openCreatePartDefinitionModal,
  openEditPartDefinitionModal,
  mechanismsById,
  partDefinitionsById,
  subsystemsById,
}: PartsViewProps) {
  const [partSearch, setPartSearch] = useState("");
  const [showArchivedPartDefinitions, setShowArchivedPartDefinitions] = useState(false);
  const [partSubsystem, setPartSubsystem] = useState<string[]>([]);
  const [partMechanism, setPartMechanism] = useState<string[]>([]);
  const [partStatus, setPartStatus] = useState<string[]>([]);

  const filteredPartDefinitions = useMemo(
    () =>
      filterPartDefinitions({
        bootstrap,
        partSearch,
        partStatus,
        partSubsystem,
        showArchivedPartDefinitions,
      }),
    [bootstrap, partSearch, partStatus, partSubsystem, showArchivedPartDefinitions],
  );

  const filteredPartInstances = useMemo(() => {
    const search = partSearch.toLowerCase();
    return bootstrap.partInstances.filter((partInstance) => {
      const definition = partDefinitionsById[partInstance.partDefinitionId];
      const mechanismName = partInstance.mechanismId
        ? mechanismsById[partInstance.mechanismId]?.name ?? ""
        : "";
      const matchesSearch =
        !search ||
        partInstance.name.toLowerCase().includes(search) ||
        definition?.name.toLowerCase().includes(search) ||
        definition?.partNumber.toLowerCase().includes(search) ||
        mechanismName.toLowerCase().includes(search);
      const matchesSubsystem = partSubsystem.length === 0 || partSubsystem.includes(partInstance.subsystemId);
      const matchesMechanism =
        partMechanism.length === 0 || (partInstance.mechanismId ? partMechanism.includes(partInstance.mechanismId) : false);
      const matchesStatus = partStatus.length === 0 || partStatus.includes(partInstance.status);
      return matchesSearch && matchesSubsystem && matchesMechanism && matchesStatus;
    });
  }, [
    bootstrap.partInstances,
    mechanismsById,
    partDefinitionsById,
    partMechanism,
    partSearch,
    partStatus,
    partSubsystem,
  ]);

  const partDefinitionPagination = useWorkspacePagination(filteredPartDefinitions);
  const partInstancePagination = useWorkspacePagination(filteredPartInstances);
  const partDefinitionFilterMotionClass = useFilterChangeMotionClass([
    partSearch,
    partStatus,
    partSubsystem,
    showArchivedPartDefinitions,
  ]);
  const partInstanceFilterMotionClass = useFilterChangeMotionClass([
    partMechanism,
    partSearch,
    partStatus,
    partSubsystem,
  ]);

  const partDefinitionPage = {
    onPageChange: partDefinitionPagination.setPage,
    onPageSizeChange: partDefinitionPagination.setPageSize,
    page: partDefinitionPagination.page,
    pageSize: partDefinitionPagination.pageSize,
    pageSizeOptions: partDefinitionPagination.pageSizeOptions,
    rangeEnd: partDefinitionPagination.rangeEnd,
    rangeStart: partDefinitionPagination.rangeStart,
    totalItems: partDefinitionPagination.totalItems,
    totalPages: partDefinitionPagination.totalPages,
  };

  const partInstancePage = {
    onPageChange: partInstancePagination.setPage,
    onPageSizeChange: partInstancePagination.setPageSize,
    page: partInstancePagination.page,
    pageSize: partInstancePagination.pageSize,
    pageSizeOptions: partInstancePagination.pageSizeOptions,
    rangeEnd: partInstancePagination.rangeEnd,
    rangeStart: partInstancePagination.rangeStart,
    totalItems: partInstancePagination.totalItems,
    totalPages: partInstancePagination.totalPages,
  };

  return (
    <section className={`panel dense-panel part-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <PartsToolbar
          bootstrap={bootstrap}
          partSearch={partSearch}
          partStatus={partStatus}
          partSubsystem={partSubsystem}
          setPartSearch={setPartSearch}
          setPartStatus={setPartStatus}
          setPartSubsystem={setPartSubsystem}
          setShowArchivedPartDefinitions={setShowArchivedPartDefinitions}
          showArchivedPartDefinitions={showArchivedPartDefinitions}
        />
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Part manager</h2>
          <p className="section-copy">
            Reusable part definitions and subsystem-specific part instances for traceability.
          </p>
        </div>
      </div>

      <WorkspaceFloatingAddButton
        ariaLabel="Add part definition"
        onClick={openCreatePartDefinitionModal}
        title="Add part definition"
        tutorialTarget="create-part-button"
      />

      <PartsDefinitionSection
        bootstrap={bootstrap}
        filteredPartDefinitions={partDefinitionPagination.pageItems}
        onEditPartDefinition={openEditPartDefinitionModal}
        partDefinitionFilterMotionClass={partDefinitionFilterMotionClass}
        pageChangeHandlers={partDefinitionPage}
      />

      <PartsInstanceSection
        bootstrap={bootstrap}
        filteredPartInstances={partInstancePagination.pageItems}
        mechanismsById={mechanismsById}
        partDefinitionsById={partDefinitionsById}
        partInstanceFilterMotionClass={partInstanceFilterMotionClass}
        partMechanism={partMechanism}
        partStatus={partStatus}
        partSubsystem={partSubsystem}
        setPartMechanism={setPartMechanism}
        setPartStatus={setPartStatus}
        setPartSubsystem={setPartSubsystem}
        subsystemsById={subsystemsById}
        pageChangeHandlers={partInstancePage}
      />
    </section>
  );
}
