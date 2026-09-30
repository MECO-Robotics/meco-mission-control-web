import { IconTasks } from "@/components/shared/Icons";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu, compactFilterDropdownMenuItem } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import { ResourceSortMenu } from "@/features/workspace/shared/resourceList/ResourceSortMenu";
import type { ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import { WorkspaceTopbarControls, buildTopbarSearchProps } from "@/features/workspace/shared/topbar";
import { PURCHASE_APPROVAL_STATUS_OPTIONS, PURCHASE_COLUMNS, PURCHASE_ORDER_STATUS_OPTIONS, type PurchaseColumn } from "./purchaseListModel";

interface PurchaseFiltersToolbarProps {
  approval: FilterSelection;
  bootstrap: BootstrapPayload;
  search: string;
  setApproval: (value: FilterSelection) => void;
  setSearch: (value: string) => void;
  setOrderStatus: (value: FilterSelection) => void;
  setProject: (value: FilterSelection) => void;
  setVendor: (value: FilterSelection) => void;
  orderStatus: FilterSelection;
  project: FilterSelection;
  uniqueVendors: Array<{ id: string; name: string }>;
  vendor: FilterSelection;
  sortField: PurchaseColumn;
  sortDirection: ResourceSortDirection;
  onSortFieldChange: (field: string) => void;
  onSortDirectionChange: (direction: ResourceSortDirection) => void;
}

export function PurchaseFiltersToolbar({ approval, bootstrap, search, setApproval, setSearch, setOrderStatus, setProject, setVendor, orderStatus, project, uniqueVendors, vendor, sortField, sortDirection, onSortFieldChange, onSortDirectionChange }: PurchaseFiltersToolbarProps) {
  const activeFilterCount = [project, orderStatus, vendor, approval].filter((value) => value.length > 0).length;
  return (
    <AppTopbarSlotPortal slot="controls">
      <WorkspaceTopbarControls className="materials-toolbar purchase-toolbar">
        <TopbarResponsiveSearch {...buildTopbarSearchProps("purchases", {
          actions: <>
            <CompactFilterMenu activeCount={activeFilterCount} ariaLabel="Purchase filters" buttonLabel="Filters" className="materials-filter-menu" items={[
              compactFilterDropdownMenuItem({ allLabel: "All projects", ariaLabel: "Filter purchases by project", label: "Project", icon: <IconTasks />, onChange: setProject, options: bootstrap.projects, value: project }),
              compactFilterDropdownMenuItem({ allLabel: "All order statuses", ariaLabel: "Filter purchases by order status", label: "Order", icon: <IconTasks />, onChange: setOrderStatus, options: PURCHASE_ORDER_STATUS_OPTIONS, value: orderStatus }),
              compactFilterDropdownMenuItem({ allLabel: "All vendors", ariaLabel: "Filter purchases by vendor", label: "Vendor", icon: <IconTasks />, onChange: setVendor, options: uniqueVendors, value: vendor }),
              compactFilterDropdownMenuItem({ allLabel: "All approvals", ariaLabel: "Filter purchases by approval status", label: "Approval", icon: <IconTasks />, onChange: setApproval, options: PURCHASE_APPROVAL_STATUS_OPTIONS, value: approval }),
            ]} />
            <ResourceSortMenu direction={sortDirection} field={sortField} label="purchases" onDirectionChange={onSortDirectionChange} onFieldChange={onSortFieldChange} options={PURCHASE_COLUMNS.map(({ field, label }) => ({ value: field, label }))} />
          </>,
          ariaLabel: "Search purchase items and procurement tasks",
          onChange: setSearch,
          placeholder: "Search purchases...",
          tutorialTarget: "purchases-search-input",
          value: search,
        })} />
      </WorkspaceTopbarControls>
    </AppTopbarSlotPortal>
  );
}
