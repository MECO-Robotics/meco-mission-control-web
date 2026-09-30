import type { CSSProperties } from "react";

import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { WorkspaceEmptyState } from "@/features/workspace/shared/ui";
import { EditableHoverIndicator, PaginationControls, TableCell, type useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { formatCurrency } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { ResourceRecordCell } from "@/features/workspace/shared/resourceList/ResourceRecordCell";
import { ResourceColumnHeader, type ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import { getPurchaseVendorName, getSelectedPurchaseQuote, type PurchaseColumn, type PurchaseColumnFilters, type PurchaseListContext } from "./purchaseListModel";

type PurchasePagination = ReturnType<typeof useWorkspacePagination<PurchaseItemRecord>>;
const PURCHASE_GRID_TEMPLATE = "minmax(180px, 1.8fr) minmax(180px, 1.6fr) 1fr 0.55fr 0.8fr 0.8fr 0.8fr";

interface PurchaseTableProps {
  bootstrap: BootstrapPayload;
  filteredPurchases: PurchaseItemRecord[];
  filterMotionClass: string;
  hasPurchaseFilters: boolean;
  context: PurchaseListContext;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  pagination: PurchasePagination;
  columnFilters: PurchaseColumnFilters;
  columnOptions: Record<PurchaseColumn, Array<{ id: string; name: string }>>;
  setColumnFilter: (field: PurchaseColumn, value: FilterSelection) => void;
  sortField: PurchaseColumn | null;
  sortDirection: ResourceSortDirection;
  onSort: (field: string) => void;
}

export function PurchaseTable({ bootstrap, filteredPurchases, filterMotionClass, hasPurchaseFilters, context, openEditPurchaseModal, pagination, columnFilters, columnOptions, setColumnFilter, sortField, sortDirection, onSort }: PurchaseTableProps) {
  const header = (field: PurchaseColumn, label: string, allLabel: string) => (
    <ResourceColumnHeader field={field} label={label} onSort={onSort} sortDirection={sortDirection} sortField={sortField}>
      <ColumnFilterDropdown allLabel={allLabel} ariaLabel={`Filter purchases by ${label.toLowerCase()}`} onChange={(value) => setColumnFilter(field, value)} options={columnOptions[field]} value={columnFilters[field] ?? []} />
    </ResourceColumnHeader>
  );

  return (
    <div className={`table-shell ${filterMotionClass}`}>
      <div className="ops-table ops-table-header materials-table" style={{ "--workspace-grid-template": PURCHASE_GRID_TEMPLATE } as CSSProperties}>
        {header("item", "Item", "All items")}
        {header("task", "Procurement task", "All tasks")}
        {header("vendor", "Vendor", "All vendors")}
        {header("quantity", "Qty", "All quantities")}
        {header("approval", "Approval", "All approvals")}
        {header("order", "Order", "All order statuses")}
        {header("final", "Final cost", "All final costs")}
      </div>
      {pagination.pageItems.map((item) => {
        const part = bootstrap.partDefinitions.find((definition) => definition.id === item.partDefinitionId);
        const task = context.tasksById[item.taskId];
        const projectName = bootstrap.projects.find((project) => project.id === task?.projectId)?.name ?? "Unknown project";
        const quote = getSelectedPurchaseQuote(item);
        const finalCost = item.finalCost ? `${formatCurrency(item.finalCost.amount)} ${item.finalCost.currency ?? ""}`.trim() : "Pending";
        return (
          <button className="ops-table ops-row materials-table editable-hover-target editable-hover-target-row" data-tutorial-target="edit-purchase-row" key={item.id} onClick={() => openEditPurchaseModal(item)} style={{ "--workspace-grid-template": PURCHASE_GRID_TEMPLATE } as CSSProperties} title={`Edit ${item.title}`} type="button">
            <ResourceRecordCell label="Item" name={item.title} photoUrl={part?.photoUrl} subtitle={`${item.quantity} · ${item.kind === "cots-goods" ? "COTS goods" : "Manufacturing service"}`} />
            <ResourceRecordCell label="Procurement task" name={task?.title ?? "Missing procurement task"} subtitle={projectName} />
            <TableCell label="Vendor">{getPurchaseVendorName(item, context)}{quote?.amount ? <small>{formatCurrency(quote.amount.amount)} {quote.amount.currency ?? ""}</small> : null}</TableCell>
            <TableCell label="Qty">{item.quantity}</TableCell>
            <TableCell label="Approval" valueClassName="table-cell-pill"><span className={getStatusPillClassName(item.approvalStatus)}>{item.approvalStatus}</span></TableCell>
            <TableCell label="Order" valueClassName="table-cell-pill"><span className={getStatusPillClassName(item.orderStatus)}>{item.orderStatus}</span></TableCell>
            <TableCell label="Final">{finalCost}</TableCell>
            <EditableHoverIndicator />
          </button>
        );
      })}
      {filteredPurchases.length === 0 ? <WorkspaceEmptyState reason={hasPurchaseFilters ? "The current search, project, person, vendor, approval, or order filters hide every purchase line in this scope." : "No task-linked purchase lines have been captured for this project scope."} title={hasPurchaseFilters ? "No purchases match these filters" : "Track commercial acquisition here"} /> : null}
      <PaginationControls label="purchases" onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} page={pagination.page} pageSize={pagination.pageSize} pageSizeOptions={pagination.pageSizeOptions} rangeEnd={pagination.rangeEnd} rangeStart={pagination.rangeStart} totalItems={pagination.totalItems} totalPages={pagination.totalPages} />
    </div>
  );
}
