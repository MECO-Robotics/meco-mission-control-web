import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
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
  return (
    <ManufacturingQueueView
      activePersonFilter={activePersonFilter}
      addButtonAriaLabel="Add CNC job"
      bootstrap={bootstrap}
      emptyStateMessage="No CNC jobs match the current filters."
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
