import { useMemo, useState } from "react";

import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";

import {
  buildCountsBySubsystemId,
  buildPartDefinitionsById,
  filterSubsystems,
  getInitialSelectedSubsystemId,
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
  const [selectedSubsystemId, setSelectedSubsystemId] = useState(
    getInitialSelectedSubsystemId(bootstrap),
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

  const filteredSubsystems = useMemo(
    () =>
      filterSubsystems({
        bootstrap,
        membersById,
        partDefinitionsById,
        search,
        showArchivedMechanisms,
        showArchivedSubsystems,
      }),
    [
      bootstrap,
      membersById,
      partDefinitionsById,
      search,
      showArchivedMechanisms,
      showArchivedSubsystems,
    ],
  );

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
        />
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Subsystem manager</h2>
        </div>
      </div>

      <WorkspaceFloatingAddButton
        ariaLabel="Add subsystem"
        onClick={openCreateSubsystemModal}
        title="Add subsystem"
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
