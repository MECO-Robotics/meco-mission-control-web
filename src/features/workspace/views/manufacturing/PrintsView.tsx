import type { BootstrapPayload, ManufacturingItemRecord } from "@/types";
import {
  formatFilterSelectionLabel,
  type FilterSelection,
  type MembersById,
  type SubsystemsById,
} from "@/features/workspace/shared";
import { ManufacturingQueueView } from "./ManufacturingQueueView";

interface PrintsViewProps {
  activePersonFilter: FilterSelection;
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
  const personFilterLabel = formatFilterSelectionLabel(
    "All roster",
    bootstrap.members,
    activePersonFilter,
  );
  const filteredDescription =
    activePersonFilter.length === 0
      ? "All 3D print jobs."
      : `Only print jobs submitted by ${personFilterLabel}.`;

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
      tutorialTargetPrefix="prints"
    />
  );
}
