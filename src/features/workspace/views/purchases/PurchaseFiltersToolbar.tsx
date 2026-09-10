import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared/Icons";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  PURCHASE_APPROVAL_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
} from "@/features/workspace/shared/model/workspaceOptions";
import type { BootstrapPayload } from "@/types/bootstrap";

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
}

export function PurchaseFiltersToolbar({
  approval,
  bootstrap,
  requester,
  search,
  setApproval,
  setRequester,
  setSearch,
  setStatus,
  setSubsystem,
  setVendor,
  status,
  subsystem,
  uniqueVendors,
  vendor,
}: PurchaseFiltersToolbarProps) {
  const activeFilterCount = [subsystem, requester, status, vendor, approval].filter(
    (value) => value.length > 0,
  ).length;

  return (
    <AppTopbarSlotPortal slot="controls">
      <div className="panel-actions filter-toolbar queue-toolbar purchase-toolbar">
        <TopbarResponsiveSearch
          actions={
            <CompactFilterMenu
              activeCount={activeFilterCount}
              ariaLabel="Purchase filters"
              buttonLabel="Filters"
              className="materials-filter-menu"
              items={[
                {
                  label: "Subsystem",
                  content: (
                    <FilterDropdown
                      allLabel="All subsystems"
                      ariaLabel="Filter purchases by subsystem"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconManufacturing />}
                      onChange={setSubsystem}
                      options={bootstrap.subsystems}
                      value={subsystem}
                    />
                  ),
                },
                {
                  label: "Requester",
                  content: (
                    <FilterDropdown
                      allLabel="All requesters"
                      ariaLabel="Filter purchases by requester"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconPerson />}
                      onChange={setRequester}
                      options={bootstrap.members}
                      value={requester}
                    />
                  ),
                },
                {
                  label: "Status",
                  content: (
                    <FilterDropdown
                      allLabel="All statuses"
                      ariaLabel="Filter purchases by status"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconTasks />}
                      onChange={setStatus}
                      options={PURCHASE_STATUS_OPTIONS}
                      value={status}
                    />
                  ),
                },
                {
                  label: "Vendor",
                  content: (
                    <FilterDropdown
                      allLabel="All vendors"
                      ariaLabel="Filter purchases by vendor"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconTasks />}
                      onChange={setVendor}
                      options={uniqueVendors}
                      value={vendor}
                    />
                  ),
                },
                {
                  label: "Approval",
                  content: (
                    <FilterDropdown
                      allLabel="All approvals"
                      ariaLabel="Filter purchases by approval status"
                      className="task-queue-filter-menu-submenu"
                      icon={<IconTasks />}
                      onChange={setApproval}
                      options={PURCHASE_APPROVAL_OPTIONS}
                      value={approval}
                    />
                  ),
                },
              ]}
            />
          }
          ariaLabel="Search purchase items"
          compactPlaceholder="Search"
          onChange={setSearch}
          placeholder="Search items..."
          tutorialTarget="purchases-search-input"
          value={search}
        />
      </div>
    </AppTopbarSlotPortal>
  );
}
