import type { BootstrapPayload, ManufacturingItemRecord } from "@/types";
import {
  formatFilterSelectionLabel,
  type FilterSelection,
  type MembersById,
  type SubsystemsById,
} from "@/features/workspace/shared";
import { ManufacturingQueueView } from "./ManufacturingQueueView";

interface FabricationViewProps {
  activePersonFilter: FilterSelection;
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
  const personFilterLabel = formatFilterSelectionLabel(
    "All roster",
    bootstrap.members,
    activePersonFilter,
  );
  const filteredDescription =
    activePersonFilter.length === 0
      ? "All fabrication jobs."
      : `Only fabrication jobs submitted by ${personFilterLabel}.`;

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
      tutorialTargetPrefix="fabrication"
    />
  );
}
