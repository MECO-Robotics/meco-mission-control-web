import { useMemo, useState } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { buildTopbarAddMenuActions, makeAddMenuAction } from "@/features/workspace/shared/topbar";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { getDefaultSubsystemId } from "@/lib/appUtils/common";

import {
  buildCountsBySubsystemId,
  buildPartDefinitionsById,
  filterSubsystems,
} from "./subsystems/subsystemsViewData";
import { SubsystemsTableSection } from "./subsystems/SubsystemsTableSection";
import { SubsystemsToolbar } from "./subsystems/SubsystemsToolbar";
import type { SubsystemsViewProps } from "./subsystems/subsystemsViewTypes";

export function SubsystemsView({
  bootstrap,
  membersById,
  openCreateMechanismModal,
  openCreatePartInstanceModal,
  openCreateSubsystemModal,
  openEditMechanismModal,
  openEditSubsystemModal,
}: SubsystemsViewProps) {
  const [search, setSearch] = useState("");
  const [showArchivedSubsystems, setShowArchivedSubsystems] = useState(false);
  const [showArchivedMechanisms, setShowArchivedMechanisms] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedSubsystemId, setSelectedSubsystemId] = useState(
    getDefaultSubsystemId(bootstrap),
  );

  const handleSubsystemSelection = (subsystemId: string) => {
    setSelectedSubsystemId((currentSubsystemId) =>
      currentSubsystemId === subsystemId ? "" : subsystemId,
    );
  };

  const countsBySubsystemId = useMemo(
    () => buildCountsBySubsystemId(bootstrap, showArchivedMechanisms),
    [
      bootstrap,
      showArchivedMechanisms,
    ],
  );

  const partDefinitionsById = useMemo(() => buildPartDefinitionsById(bootstrap), [bootstrap]);

  const filteredSubsystems = useMemo(() => {
    const subsystems = filterSubsystems({
        bootstrap,
        membersById,
        partDefinitionsById,
        search,
        showArchivedMechanisms,
        showArchivedSubsystems,
    });
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...subsystems].sort((a, b) => {
      const valueA = sortField === "iteration"
        ? a.iteration
        : sortField === "openTasks"
          ? countsBySubsystemId[a.id]?.openTasks ?? 0
          : a.name;
      const valueB = sortField === "iteration"
        ? b.iteration
        : sortField === "openTasks"
          ? countsBySubsystemId[b.id]?.openTasks ?? 0
          : b.name;
      return (typeof valueA === "number" && typeof valueB === "number"
        ? valueA - valueB
        : String(valueA ?? "").localeCompare(String(valueB ?? ""))) * direction;
    });
  }, [
    bootstrap,
    countsBySubsystemId,
    membersById,
    partDefinitionsById,
    search,
    showArchivedMechanisms,
    showArchivedSubsystems,
    sortDirection,
    sortField,
  ]);

  const subsystemFilterMotionClass = useFilterChangeMotionClass([
    search,
    showArchivedSubsystems,
    showArchivedMechanisms,
  ]);

  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <SubsystemsToolbar
          search={search}
          setSearch={setSearch}
          setShowArchivedMechanisms={setShowArchivedMechanisms}
          setShowArchivedSubsystems={setShowArchivedSubsystems}
          showArchivedMechanisms={showArchivedMechanisms}
          showArchivedSubsystems={showArchivedSubsystems}
          sortDirection={sortDirection}
          sortField={sortField}
          setSortDirection={setSortDirection}
          setSortField={setSortField}
        />
      </AppTopbarSlotPortal>
      <WorkspaceTopbarAddMenu
        actions={buildTopbarAddMenuActions(
          makeAddMenuAction("Add subsystem", openCreateSubsystemModal),
          makeAddMenuAction("Add mechanism", () => openCreateMechanismModal(selectedSubsystemId || undefined)),
        )}
        ariaLabel="Add subsystem or mechanism"
        title="Add to subsystems"
        tutorialTarget="create-subsystem-button"
      />

      <SubsystemsTableSection
        bootstrap={bootstrap}
        countsBySubsystemId={countsBySubsystemId}
        filteredSubsystems={filteredSubsystems}
        handleSubsystemSelection={handleSubsystemSelection}
        membersById={membersById}
        openCreateMechanismModal={openCreateMechanismModal}
        openCreatePartInstanceModal={openCreatePartInstanceModal}
        openEditMechanismModal={openEditMechanismModal}
        openEditSubsystemModal={openEditSubsystemModal}
        selectedSubsystemId={selectedSubsystemId}
        showArchivedMechanisms={showArchivedMechanisms}
        subsystemFilterMotionClass={subsystemFilterMotionClass}
      />
    </section>
  );
}
