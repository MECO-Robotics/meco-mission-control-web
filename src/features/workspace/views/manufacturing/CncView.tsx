import type { BootstrapPayload, ManufacturingItemRecord } from "@/types";
import {
  formatFilterSelectionLabel,
  type FilterSelection,
  type MembersById,
  type SubsystemsById,
} from "@/features/workspace/shared";
import { ManufacturingQueueView } from "./ManufacturingQueueView";

interface CncViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  items: ManufacturingItemRecord[];
  membersById: MembersById;
  onCreate: () => void;
  onEdit: (item: ManufacturingItemRecord) => void;
  onQuickStatusChange?: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>;
  showMentorQuickActions?: boolean;
  subsystemsById: SubsystemsById;
}

export function CncView({
  activePersonFilter,
  bootstrap,
  items,
  membersById,
  onCreate,
  onEdit,
  onQuickStatusChange,
  showMentorQuickActions = false,
  subsystemsById,
}: CncViewProps) {
  const personFilterLabel = formatFilterSelectionLabel(
    "All roster",
    bootstrap.members,
    activePersonFilter,
  );
  const filteredDescription =
    activePersonFilter.length === 0
      ? "All CNC jobs."
      : `Only CNC jobs submitted by ${personFilterLabel}.`;

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
      onQuickStatusChange={onQuickStatusChange}
      showMentorQuickActions={showMentorQuickActions}
      showInHouseColumn
      subsystemsById={subsystemsById}
      title="cnc"
      tutorialTargetPrefix="cnc"
    />
  );
}
