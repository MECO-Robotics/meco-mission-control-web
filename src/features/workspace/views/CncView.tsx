import type { BootstrapPayload, ManufacturingItemRecord } from "../../../types";
import type { MembersById, SubsystemsById } from "../shared/workspaceTypes";
import { ManufacturingQueueView } from "./ManufacturingQueueView";

interface CncViewProps {
  activePersonFilter: string;
  bootstrap: BootstrapPayload;
  items: ManufacturingItemRecord[];
  membersById: MembersById;
  onCreate: () => void;
  onEdit: (item: ManufacturingItemRecord) => void;
  subsystemsById: SubsystemsById;
}

export function CncView({
  activePersonFilter,
  bootstrap,
  items,
  membersById,
  onCreate,
  onEdit,
  subsystemsById,
}: CncViewProps) {
  const filteredDescription =
    activePersonFilter === "all"
      ? "All CNC jobs."
      : `Only CNC jobs submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`;

  return (
    <ManufacturingQueueView
      activePersonFilter={activePersonFilter}
      addButtonAriaLabel="Add CNC job"
      bootstrap={bootstrap}
      emptyStateMessage="No CNC jobs match the current filters."
      filteredDescription={filteredDescription}
      items={items}
      membersById={membersById}
      onCreate={onCreate}
      onEdit={onEdit}
      subsystemsById={subsystemsById}
      title="CNC queue"
    />
  );
}
