import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { ManufacturingViewTab } from "@/lib/workspaceNavigation";
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
  onProcessFilterChange?: (value: ManufacturingViewTab) => void;
  onQuickStatusChange?: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>;
  processFilterValue?: ManufacturingViewTab;
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
  onProcessFilterChange,
  onQuickStatusChange,
  processFilterValue,
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
      onProcessFilterChange={onProcessFilterChange}
      onQuickStatusChange={onQuickStatusChange}
      processFilterValue={processFilterValue}
      showMentorQuickActions={showMentorQuickActions}
      showInHouseColumn
      subsystemsById={subsystemsById}
      title="cnc"
      tutorialTargetPrefix="cnc"
    />
  );
}
