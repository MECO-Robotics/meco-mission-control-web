import type { BootstrapPayload, ManufacturingItemRecord } from "../../../types";
import type { MembersById, SubsystemsById } from "../shared/workspaceTypes";
import { ManufacturingQueueView } from "./ManufacturingQueueView";

interface FabricationViewProps {
  activePersonFilter: string;
  bootstrap: BootstrapPayload;
  items: ManufacturingItemRecord[];
  membersById: MembersById;
  onCreate: () => void;
  onEdit: (item: ManufacturingItemRecord) => void;
  subsystemsById: SubsystemsById;
}

export function FabricationView({
  activePersonFilter,
  bootstrap,
  items,
  membersById,
  onCreate,
  onEdit,
  subsystemsById,
}: FabricationViewProps) {
  const filteredDescription =
    activePersonFilter === "all"
      ? "All fabrication jobs."
      : `Only fabrication jobs submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`;

  return (
    <ManufacturingQueueView
      activePersonFilter={activePersonFilter}
      addButtonAriaLabel="Add fabrication job"
      bootstrap={bootstrap}
      emptyStateMessage="No fabrication jobs match the current filters."
      filteredDescription={filteredDescription}
      items={items}
      membersById={membersById}
      onCreate={onCreate}
      onEdit={onEdit}
      subsystemsById={subsystemsById}
      title="Fabrication queue"
    />
  );
}
