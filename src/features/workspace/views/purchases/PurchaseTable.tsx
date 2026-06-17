import type { CSSProperties } from "react";

import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import {
  PURCHASE_APPROVAL_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
} from "@/features/workspace/shared/model/workspaceOptions";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { WorkspaceEmptyState } from "@/features/workspace/shared/ui";
import {
  EditableHoverIndicator,
  PaginationControls,
  RequestedItemMeta,
  TableCell,
  type useWorkspacePagination,
} from "@/features/workspace/shared/table/workspaceTableChrome";
import { formatCurrency } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemRecord } from "@/types/recordsInventory";

type PurchasePagination = ReturnType<typeof useWorkspacePagination<PurchaseItemRecord>>;

interface PurchaseTableProps {
  bootstrap: BootstrapPayload;
  filteredPurchases: PurchaseItemRecord[];
  filterMotionClass: string;
  hasPurchaseFilters: boolean;
  membersById: MembersById;
  openCreatePurchaseModal: () => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  pagination: PurchasePagination;
  requester: FilterSelection;
  setApproval: (value: FilterSelection) => void;
  setRequester: (value: FilterSelection) => void;
  setStatus: (value: FilterSelection) => void;
  setSubsystem: (value: FilterSelection) => void;
  setVendor: (value: FilterSelection) => void;
  status: FilterSelection;
  subsystem: FilterSelection;
  subsystemsById: SubsystemsById;
  uniqueVendors: Array<{ id: string; name: string }>;
  vendor: FilterSelection;
  approval: FilterSelection;
}

const PURCHASE_GRID_TEMPLATE = "minmax(200px, 2.5fr) 1fr 0.6fr 1fr 1fr 1fr 1fr";

export function PurchaseTable({
  bootstrap,
  filteredPurchases,
  filterMotionClass,
  hasPurchaseFilters,
  membersById,
  openCreatePurchaseModal,
  openEditPurchaseModal,
  pagination,
  requester,
  setApproval,
  setRequester,
  setStatus,
  setSubsystem,
  setVendor,
  status,
  subsystem,
  subsystemsById,
  uniqueVendors,
  vendor,
  approval,
}: PurchaseTableProps) {
  return (
    <div className={`table-shell ${filterMotionClass}`}>
      <div
        className="ops-table ops-table-header purchase-table"
        style={{ "--workspace-grid-template": PURCHASE_GRID_TEMPLATE } as CSSProperties}
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

      {pagination.pageItems.map((item) => (
        <button
          className="ops-table ops-row purchase-table ops-button-row editable-hover-target editable-hover-target-row"
          data-tutorial-target="edit-purchase-row"
          key={item.id}
          onClick={() => openEditPurchaseModal(item)}
          style={{ "--workspace-grid-template": PURCHASE_GRID_TEMPLATE } as CSSProperties}
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
        <WorkspaceEmptyState
          actionLabel={hasPurchaseFilters ? undefined : "Add purchase"}
          onAction={hasPurchaseFilters ? undefined : openCreatePurchaseModal}
          reason={
            hasPurchaseFilters
              ? "The current search, person, status, vendor, or approval filters hide every purchase request in this scope."
              : "This workspace has not captured any parts, tools, or materials that need purchasing yet."
          }
          title={
            hasPurchaseFilters
              ? "No purchase requests match these filters"
              : "Track requested parts and materials here"
          }
        />
      ) : null}

      <PaginationControls
        label="purchases"
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
        page={pagination.page}
        pageSize={pagination.pageSize}
        pageSizeOptions={pagination.pageSizeOptions}
        rangeEnd={pagination.rangeEnd}
        rangeStart={pagination.rangeStart}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
