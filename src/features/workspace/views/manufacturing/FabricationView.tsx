import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { ManufacturingViewTab } from "@/lib/workspaceNavigation";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { ManufacturingQueueView } from "./ManufacturingQueueView";

interface FabricationViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  items: ManufacturingItemRecord[];
  membersById: MembersById;
  onCreate: () => void;
  onEdit: (item: ManufacturingItemRecord) => void;
  onProcessFilterChange?: (value: ManufacturingViewTab) => void;
  processFilterValue?: ManufacturingViewTab;
  subsystemsById: SubsystemsById;
}

export function FabricationView({
  activePersonFilter,
  bootstrap,
  items,
  membersById,
  onCreate,
  onEdit,
  onProcessFilterChange,
  processFilterValue,
  subsystemsById,
}: FabricationViewProps) {
  return (
    <ManufacturingQueueView
      activePersonFilter={activePersonFilter}
      addButtonAriaLabel="Add fabrication job"
      bootstrap={bootstrap}
      emptyStateMessage="No fabrication jobs match the current filters."
      items={items}
      membersById={membersById}
      onCreate={onCreate}
      onEdit={onEdit}
      onProcessFilterChange={onProcessFilterChange}
      processFilterValue={processFilterValue}
      subsystemsById={subsystemsById}
      title="Fabrication queue"
      tutorialTargetPrefix="fabrication"
    />
  );
}
