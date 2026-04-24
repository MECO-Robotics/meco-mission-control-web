import type { BootstrapPayload, ManufacturingItemRecord } from "../../../types";
import type { MembersById, SubsystemsById } from "../shared/workspaceTypes";
import { ManufacturingQueueView } from "./ManufacturingQueueView";

interface PrintsViewProps {
  activePersonFilter: string;
  bootstrap: BootstrapPayload;
  items: ManufacturingItemRecord[];
  membersById: MembersById;
  onCreate: () => void;
  onEdit: (item: ManufacturingItemRecord) => void;
  subsystemsById: SubsystemsById;
}

export function PrintsView({
  activePersonFilter,
  bootstrap,
  items,
  membersById,
  onCreate,
  onEdit,
  subsystemsById,
}: PrintsViewProps) {
  const filteredDescription =
    activePersonFilter === "all"
      ? "All 3D print jobs."
      : `Only print jobs submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`;

  return (
    <ManufacturingQueueView
      activePersonFilter={activePersonFilter}
      addButtonAriaLabel="Add print job"
      bootstrap={bootstrap}
      emptyStateMessage="No 3D print jobs match the current filters."
      filteredDescription={filteredDescription}
      items={items}
      membersById={membersById}
      onCreate={onCreate}
      onEdit={onEdit}
      subsystemsById={subsystemsById}
      title="3D print queue"
    />
  );
}
