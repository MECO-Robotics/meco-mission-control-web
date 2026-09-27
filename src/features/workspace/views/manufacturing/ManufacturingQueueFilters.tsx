import type { BootstrapPayload } from "@/types/bootstrap";
import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared/Icons";
import {
  CompactFilterMenu,
  compactFilterDropdownMenuItem,
} from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { MANUFACTURING_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import { MANUFACTURING_PROCESS_FILTER_OPTIONS } from "./manufacturingProcessFilter";

interface ManufacturingQueueFiltersProps {
  activeCount: number;
  bootstrap: BootstrapPayload;
  onMaterialChange: (value: FilterSelection) => void;
  onProcessChange?: (value: FilterSelection) => void;
  onRequesterChange: (value: FilterSelection) => void;
  onStatusChange: (value: FilterSelection) => void;
  onSubsystemChange: (value: FilterSelection) => void;
  processSelection: FilterSelection;
  requester: FilterSelection;
  material: FilterSelection;
  status: FilterSelection;
  subsystem: FilterSelection;
  title: string;
  uniqueMaterials: Array<{ id: string; name: string }>;
}

export function ManufacturingQueueFilters(props: ManufacturingQueueFiltersProps) {
  return (
    <CompactFilterMenu
      activeCount={props.activeCount}
      ariaLabel={`${props.title} filters`}
      buttonLabel="Filters"
      className="materials-filter-menu"
      items={[
        compactFilterDropdownMenuItem({
          allLabel: "All processes",
          ariaLabel: `Filter ${props.title} by process`,
          hidden: !props.onProcessChange,
          label: "Process",
          icon: <IconManufacturing />,
          onChange: (value) => props.onProcessChange?.(value),
          options: MANUFACTURING_PROCESS_FILTER_OPTIONS,
          selectedAllLabel: "All",
          singleSelect: true,
          value: props.processSelection,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All subsystems",
          ariaLabel: `Filter ${props.title} by subsystem`,
          label: "Subsystem",
          icon: <IconManufacturing />,
          onChange: props.onSubsystemChange,
          options: props.bootstrap.subsystems,
          selectedAllLabel: "All",
          value: props.subsystem,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All requesters",
          ariaLabel: `Filter ${props.title} by requester`,
          label: "Requester",
          icon: <IconPerson />,
          onChange: props.onRequesterChange,
          options: props.bootstrap.members,
          selectedAllLabel: "All",
          value: props.requester,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All materials",
          ariaLabel: `Filter ${props.title} by material`,
          label: "Material",
          icon: <IconManufacturing />,
          onChange: props.onMaterialChange,
          options: props.uniqueMaterials,
          selectedAllLabel: "All",
          value: props.material,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All statuses",
          ariaLabel: `Filter ${props.title} by status`,
          label: "Status",
          icon: <IconTasks />,
          onChange: props.onStatusChange,
          options: MANUFACTURING_STATUS_OPTIONS,
          selectedAllLabel: "All",
          value: props.status,
        }),
      ]}
    />
  );
}
