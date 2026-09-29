import type { CSSProperties } from "react";

import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { WorkspaceEmptyState } from "@/features/workspace/shared/ui";
import { EditableHoverIndicator, PaginationControls, TableCell, type useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { formatCurrency } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { ResourceRecordCell } from "@/features/workspace/shared/resourceList/ResourceRecordCell";
import { ResourceColumnHeader, type ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import type { PurchaseColumn, PurchaseColumnFilters } from "./purchaseListModel";

 type PurchasePagination = ReturnType<typeof useWorkspacePagination<PurchaseItemRecord>>;
 const PURCHASE_GRID_TEMPLATE = "minmax(220px, 2.3fr) 0.9fr 0.55fr 0.9fr 0.9fr 0.7fr 0.7fr";

interface PurchaseTableProps {
  bootstrap: BootstrapPayload;
  filteredPurchases: PurchaseItemRecord[];
  filterMotionClass: string;
  hasPurchaseFilters: boolean;
  membersById: MembersById;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  pagination: PurchasePagination;
  subsystemsById: SubsystemsById;
  columnFilters: PurchaseColumnFilters;
  columnOptions: Record<PurchaseColumn, Array<{ id: string; name: string }>>;
  setColumnFilter: (field: PurchaseColumn, value: FilterSelection) => void;
  sortField: PurchaseColumn | null;
  sortDirection: ResourceSortDirection;
  onSort: (field: string) => void;
}

export function PurchaseTable({ bootstrap, filteredPurchases, filterMotionClass, hasPurchaseFilters, membersById, openEditPurchaseModal, pagination, subsystemsById, columnFilters, columnOptions, setColumnFilter, sortField, sortDirection, onSort }: PurchaseTableProps) {
  const header = (field: PurchaseColumn, label: string, allLabel: string) => (
    <ResourceColumnHeader field={field} label={label} onSort={onSort} sortDirection={sortDirection} sortField={sortField}>
      <ColumnFilterDropdown allLabel={allLabel} ariaLabel={`Filter purchases by ${label.toLowerCase()}`} onChange={(value) => setColumnFilter(field, value)} options={columnOptions[field]} value={columnFilters[field] ?? []} />
    </ResourceColumnHeader>
  );

  return (
    <div className={`table-shell ${filterMotionClass}`}>
      <div className="ops-table ops-table-header materials-table" style={{ "--workspace-grid-template": PURCHASE_GRID_TEMPLATE } as CSSProperties}>
        {header("item", "Item", "All items")}
        {header("vendor", "Vendor", "All vendors")}
        {header("quantity", "Qty", "All quantities")}
        {header("status", "Status", "All statuses")}
        {header("mentor", "Mentor", "All approvals")}
        {header("estimated", "Est.", "All estimated costs")}
        {header("final", "Final", "All final costs")}
      </div>
      {pagination.pageItems.map((item) => {
        const part = bootstrap.partDefinitions.find((definition) => definition.id === item.partDefinitionId);
        const subtitle = [item.subsystemId ? subsystemsById[item.subsystemId]?.name : "Unknown subsystem", item.requestedById ? membersById[item.requestedById]?.name : "Unassigned"].join(" / ");
        return (
          <button className="ops-table ops-row materials-table editable-hover-target editable-hover-target-row" data-tutorial-target="edit-purchase-row" key={item.id} onClick={() => openEditPurchaseModal(item)} style={{ "--workspace-grid-template": PURCHASE_GRID_TEMPLATE } as CSSProperties} title={`Edit ${item.title}`} type="button">
            <ResourceRecordCell label="Item" name={item.title} photoUrl={part?.photoUrl} subtitle={subtitle} />
            <TableCell label="Vendor">{item.vendor}</TableCell>
            <TableCell label="Qty">{item.quantity}</TableCell>
            <TableCell label="Status" valueClassName="table-cell-pill"><span className={getStatusPillClassName(item.status)}>{item.status}</span></TableCell>
            <TableCell label="Mentor" valueClassName="table-cell-pill"><span className={getStatusPillClassName(item.approvedByMentor ? "approved" : "waiting")}>{item.approvedByMentor ? "Approved" : "Waiting"}</span></TableCell>
            <TableCell label="Est.">{formatCurrency(item.estimatedCost)}</TableCell>
            <TableCell label="Final">{item.finalCost == null ? "Pending" : formatCurrency(item.finalCost)}</TableCell>
            <EditableHoverIndicator />
          </button>
        );
      })}
      {filteredPurchases.length === 0 ? <WorkspaceEmptyState reason={hasPurchaseFilters ? "The current search, person, status, vendor, or approval filters hide every purchase request in this scope." : "This workspace has not captured any parts, tools, or materials that need purchasing yet."} title={hasPurchaseFilters ? "No purchase requests match these filters" : "Track requested parts and materials here"} /> : null}
      <PaginationControls label="purchases" onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} page={pagination.page} pageSize={pagination.pageSize} pageSizeOptions={pagination.pageSizeOptions} rangeEnd={pagination.rangeEnd} rangeStart={pagination.rangeStart} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
    </div>
  );
}
