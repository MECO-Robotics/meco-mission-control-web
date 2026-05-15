import { useMemo, useState, type CSSProperties } from "react";

import { formatCurrency } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared/Icons";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";
import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { EditableHoverIndicator, PaginationControls, RequestedItemMeta, TableCell, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { PURCHASE_APPROVAL_OPTIONS, PURCHASE_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";

interface PurchasesViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openCreatePurchaseModal: () => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  subsystemsById: SubsystemsById;
}

export function PurchasesView({
  activePersonFilter,
  bootstrap,
  membersById,
  openCreatePurchaseModal,
  openEditPurchaseModal,
  subsystemsById,
}: PurchasesViewProps) {
  const [search, setSearch] = useState("");
  const [subsystem, setSubsystem] = useState<FilterSelection>([]);
  const [requester, setRequester] = useState<FilterSelection>([]);
  const [status, setStatus] = useState<FilterSelection>([]);
  const [vendor, setVendor] = useState<FilterSelection>([]);
  const [approval, setApproval] = useState<FilterSelection>([]);

  const uniqueVendors = useMemo(() => {
    const vendors = bootstrap.purchaseItems.map((item) => item.vendor).filter(Boolean);
    return Array.from(new Set(vendors)).sort().map((value) => ({ id: value, name: value }));
  }, [bootstrap.purchaseItems]);

  const filteredPurchases = useMemo(() => {
    return bootstrap.purchaseItems.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.vendor.toLowerCase().includes(search.toLowerCase());
      const matchesSubsystem = filterSelectionIncludes(subsystem, item.subsystemId);
      const matchesRequester = filterSelectionIncludes(requester, item.requestedById);
      const matchesStatus = filterSelectionIncludes(status, item.status);
      const matchesVendor = filterSelectionIncludes(vendor, item.vendor);
      const matchesPerson = filterSelectionIncludes(activePersonFilter, item.requestedById);
      const matchesApproval =
        approval.length === 0 ||
        approval.includes(item.approvedByMentor ? "approved" : "waiting");

      return (
        matchesSearch &&
        matchesSubsystem &&
        matchesRequester &&
        matchesStatus &&
        matchesVendor &&
        matchesPerson &&
        matchesApproval
      );
    });
  }, [
    activePersonFilter,
    approval,
    bootstrap.purchaseItems,
    requester,
    search,
    status,
    subsystem,
    vendor,
  ]);
  const purchasePagination = useWorkspacePagination(filteredPurchases);
  const purchaseFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    approval,
    requester,
    search,
    status,
    subsystem,
    vendor,
  ]);
  const gridTemplate = "minmax(200px, 2.5fr) 1fr 0.6fr 1fr 1fr 1fr 1fr";

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar queue-toolbar purchase-toolbar">
          <TopbarResponsiveSearch
            actions={
              <CompactFilterMenu
                activeCount={[subsystem, requester, status, vendor, approval].filter((value) => value.length > 0).length}
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

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Purchase list</h2>
        </div>
      </div>

      <WorkspaceFloatingAddButton
        ariaLabel="Add purchase"
        onClick={openCreatePurchaseModal}
        title="Add purchase"
        tutorialTarget="create-purchase-button"
      />

      <div className={`table-shell ${purchaseFilterMotionClass}`}>
        <div
          className="ops-table ops-table-header purchase-table"
          style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
        >
          <span className="table-column-header-cell">
            <span className="table-column-title">Item</span>
            <ColumnFilterDropdown
              allLabel="All subsystems"
              ariaLabel="Filter purchases by subsystem"
              onChange={setSubsystem}
              options={bootstrap.subsystems}
              value={subsystem}
            />
            <ColumnFilterDropdown
              allLabel="All requesters"
              ariaLabel="Filter purchases by requester"
              onChange={setRequester}
              options={bootstrap.members}
              value={requester}
            />
          </span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Vendor</span>
            <ColumnFilterDropdown
              allLabel="All vendors"
              ariaLabel="Filter purchases by vendor"
              onChange={setVendor}
              options={uniqueVendors}
              value={vendor}
            />
          </span>
          <span>Qty</span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Status</span>
            <ColumnFilterDropdown
              allLabel="All statuses"
              ariaLabel="Filter purchases by status"
              onChange={setStatus}
              options={PURCHASE_STATUS_OPTIONS}
              value={status}
            />
          </span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Mentor</span>
            <ColumnFilterDropdown
              allLabel="All approvals"
              ariaLabel="Filter purchases by approval status"
              onChange={setApproval}
              options={PURCHASE_APPROVAL_OPTIONS}
              value={approval}
            />
          </span>
          <span>Est.</span>
          <span>Final</span>
        </div>

        {purchasePagination.pageItems.map((item) => (
          <button
            className="ops-table ops-row purchase-table ops-button-row editable-hover-target editable-hover-target-row"
            data-tutorial-target="edit-purchase-row"
            key={item.id}
            onClick={() => openEditPurchaseModal(item)}
            style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
            type="button"
          >
            <span className="queue-title table-cell table-cell-primary" data-label="Item">
              <RequestedItemMeta item={item} membersById={membersById} subsystemsById={subsystemsById} />
            </span>
            <TableCell label="Vendor">{item.vendor}</TableCell>
            <TableCell label="Qty">{item.quantity}</TableCell>
            <TableCell label="Status" valueClassName="table-cell-pill">
              <span className={getStatusPillClassName(item.status)}>{item.status}</span>
            </TableCell>
            <TableCell label="Mentor" valueClassName="table-cell-pill">
              <span className={getStatusPillClassName(item.approvedByMentor ? "approved" : "waiting")}>
                {item.approvedByMentor ? "Approved" : "Waiting"}
              </span>
            </TableCell>
            <TableCell label="Est.">{formatCurrency(item.estimatedCost)}</TableCell>
            <TableCell label="Final">{formatCurrency(item.finalCost)}</TableCell>
            <EditableHoverIndicator />
          </button>
        ))}

        {filteredPurchases.length === 0 ? (
          <p className="empty-state">No purchase requests match the current filters.</p>
        ) : null}
        <PaginationControls
          label="purchases"
          onPageChange={purchasePagination.setPage}
          onPageSizeChange={purchasePagination.setPageSize}
          page={purchasePagination.page}
          pageSize={purchasePagination.pageSize}
          pageSizeOptions={purchasePagination.pageSizeOptions}
          rangeEnd={purchasePagination.rangeEnd}
          rangeStart={purchasePagination.rangeStart}
          totalItems={purchasePagination.totalItems}
          totalPages={purchasePagination.totalPages}
        />
      </div>
    </section>
  );
}
