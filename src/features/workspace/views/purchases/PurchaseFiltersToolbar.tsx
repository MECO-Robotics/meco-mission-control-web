import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared/Icons";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu, compactFilterDropdownMenuItem } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { PURCHASE_APPROVAL_OPTIONS, PURCHASE_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { BootstrapPayload } from "@/types/bootstrap";
import { ResourceSortMenu } from "@/features/workspace/shared/resourceList/ResourceSortMenu";
import type { ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import { WorkspaceTopbarControls, buildTopbarSearchProps } from "@/features/workspace/shared/topbar";
import { PURCHASE_COLUMNS, type PurchaseColumn } from "./purchaseListModel";

interface PurchaseFiltersToolbarProps {
  approval: FilterSelection;
  bootstrap: BootstrapPayload;
  requester: FilterSelection;
  search: string;
  setApproval: (value: FilterSelection) => void;
  setRequester: (value: FilterSelection) => void;
  setSearch: (value: string) => void;
  setStatus: (value: FilterSelection) => void;
  setSubsystem: (value: FilterSelection) => void;
  setVendor: (value: FilterSelection) => void;
  status: FilterSelection;
  subsystem: FilterSelection;
  uniqueVendors: Array<{ id: string; name: string }>;
  vendor: FilterSelection;
  sortField: PurchaseColumn;
  sortDirection: ResourceSortDirection;
  onSortFieldChange: (field: string) => void;
  onSortDirectionChange: (direction: ResourceSortDirection) => void;
}

export function PurchaseFiltersToolbar({ approval, bootstrap, requester, search, setApproval, setRequester, setSearch, setStatus, setSubsystem, setVendor, status, subsystem, uniqueVendors, vendor, sortField, sortDirection, onSortFieldChange, onSortDirectionChange }: PurchaseFiltersToolbarProps) {
  const activeFilterCount = [subsystem, requester, status, vendor, approval].filter((value) => value.length > 0).length;
  return (
    <AppTopbarSlotPortal slot="controls">
      <WorkspaceTopbarControls className="materials-toolbar purchase-toolbar">
        <TopbarResponsiveSearch {...buildTopbarSearchProps("purchases", {
          actions: <>
            <CompactFilterMenu activeCount={activeFilterCount} ariaLabel="Purchase filters" buttonLabel="Filters" className="materials-filter-menu" items={[
              compactFilterDropdownMenuItem({ allLabel: "All subsystems", ariaLabel: "Filter purchases by subsystem", label: "Subsystem", icon: <IconManufacturing />, onChange: setSubsystem, options: bootstrap.subsystems, value: subsystem }),
              compactFilterDropdownMenuItem({ allLabel: "All requesters", ariaLabel: "Filter purchases by requester", label: "Requester", icon: <IconPerson />, onChange: setRequester, options: bootstrap.members, value: requester }),
              compactFilterDropdownMenuItem({ allLabel: "All statuses", ariaLabel: "Filter purchases by status", label: "Status", icon: <IconTasks />, onChange: setStatus, options: PURCHASE_STATUS_OPTIONS, value: status }),
              compactFilterDropdownMenuItem({ allLabel: "All vendors", ariaLabel: "Filter purchases by vendor", label: "Vendor", icon: <IconTasks />, onChange: setVendor, options: uniqueVendors, value: vendor }),
              compactFilterDropdownMenuItem({ allLabel: "All approvals", ariaLabel: "Filter purchases by approval status", label: "Approval", icon: <IconTasks />, onChange: setApproval, options: PURCHASE_APPROVAL_OPTIONS, value: approval }),
            ]} />
            <ResourceSortMenu direction={sortDirection} field={sortField} label="purchases" onDirectionChange={onSortDirectionChange} onFieldChange={onSortFieldChange} options={PURCHASE_COLUMNS.map(({ field, label }) => ({ value: field, label }))} />
          </>,
          ariaLabel: "Search purchase items",
          onChange: setSearch,
          placeholder: "Search purchases...",
          tutorialTarget: "purchases-search-input",
          value: search,
        })} />
      </WorkspaceTopbarControls>
    </AppTopbarSlotPortal>
  );
}
