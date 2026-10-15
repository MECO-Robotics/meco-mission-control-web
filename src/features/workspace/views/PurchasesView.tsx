import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { filterSelectionIncludes, filterSelectionMatchesTaskPeople, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { getResourceFilterOptions } from "@/features/workspace/shared/resourceList/resourceListModel";
import type { ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import { filterPurchaseItems, getPurchaseFilterValue, getPurchaseVendorName, getSelectedPurchaseQuote, sortPurchaseItems, type PurchaseColumn, type PurchaseColumnFilters, type PurchaseListContext } from "./purchases/purchaseListModel";
import { PurchaseFiltersToolbar } from "./purchases/PurchaseFiltersToolbar";
import { PurchaseTable } from "./purchases/PurchaseTable";
import { ModalDialog } from "@/components/ModalDialog";
import { receivePurchaseItemRecord } from "@/lib/auth/records/production";
import { toErrorMessage } from "@/lib/appUtils/common";
import { submitPurchaseReceipt } from "./purchases/submitPurchaseReceipt";

interface PurchasesViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  openCreatePurchaseModal: () => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  canReceivePurchases?: boolean;
  handleUnauthorized?: () => void;
  loadWorkspace?: () => Promise<unknown>;
  setDataMessage?: (message: string | null) => void;
}

export function PurchasesView({ activePersonFilter, bootstrap, openCreatePurchaseModal, openEditPurchaseModal, canReceivePurchases = false, handleUnauthorized, loadWorkspace, setDataMessage }: PurchasesViewProps) {
  const [search, setSearch] = useState("");
  const [project, setProject] = useState<FilterSelection>([]);
  const [orderStatus, setOrderStatus] = useState<FilterSelection>([]);
  const [vendor, setVendor] = useState<FilterSelection>([]);
  const [approval, setApproval] = useState<FilterSelection>([]);
  const [columnFilters, setColumnFilters] = useState<PurchaseColumnFilters>({});
  const [sortField, setSortField] = useState<PurchaseColumn>("item");
  const [sortDirection, setSortDirection] = useState<ResourceSortDirection>("ascending");
  const [receivingItem, setReceivingItem] = useState<PurchaseItemRecord | null>(null);
  const [receiptQuantity, setReceiptQuantity] = useState("1");
  const [receiptLocation, setReceiptLocation] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);
  const [acknowledgedReceipt, setAcknowledgedReceipt] = useState<{ id: string; received: number } | null>(null);
  useEffect(() => {
    if (!acknowledgedReceipt) return;
    const refreshedItem = bootstrap.purchaseItems.find((item) => item.id === acknowledgedReceipt.id);
    const received = (refreshedItem?.receipts ?? []).reduce((total, receipt) => total + receipt.quantity, 0);
    if (received > acknowledgedReceipt.received) setAcknowledgedReceipt(null);
  }, [acknowledgedReceipt, bootstrap.purchaseItems]);
  const context = useMemo<PurchaseListContext>(() => ({
    tasksById: Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task])),
    vendorsById: Object.fromEntries(bootstrap.vendors.map((item) => [item.id, item])),
  }), [bootstrap.tasks, bootstrap.vendors]);

  const uniqueVendors = useMemo(() => getResourceFilterOptions(bootstrap.vendors.filter((item) => !item.isArchived).map((item) => item.name)), [bootstrap.vendors]);
  const columnOptions = useMemo(() => Object.fromEntries([
    ["item", getResourceFilterOptions(bootstrap.purchaseItems.map((item) => item.title))],
    ["task", getResourceFilterOptions(bootstrap.purchaseItems.map((item) => getPurchaseFilterValue(item, "task", context)))],
    ["vendor", getResourceFilterOptions(bootstrap.purchaseItems.map((item) => getPurchaseVendorName(item, context)))],
    ["quantity", getResourceFilterOptions(bootstrap.purchaseItems.map((item) => String(item.quantity)))],
    ["approval", getResourceFilterOptions(bootstrap.purchaseItems.map((item) => item.approvalStatus))],
    ["order", getResourceFilterOptions(bootstrap.purchaseItems.map((item) => item.orderStatus))],
    ["final", getResourceFilterOptions(bootstrap.purchaseItems.map((item) => getPurchaseFilterValue(item, "final", context)))],
  ]), [bootstrap.purchaseItems, context]) as Record<PurchaseColumn, Array<{ id: string; name: string }>>;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const purchaseItems = bootstrap.purchaseItems.filter((item) => {
      const task = context.tasksById[item.taskId];
      const selectedQuote = getSelectedPurchaseQuote(item);
      const searchable = [item.title, task?.title ?? "", bootstrap.vendors.find((candidate) => candidate.id === selectedQuote?.vendorId)?.name ?? ""].join(" ").toLowerCase();
      return (!query || searchable.includes(query)) &&
        filterSelectionIncludes(project, task?.projectId ?? null) &&
        filterSelectionIncludes(orderStatus, item.orderStatus) &&
        filterSelectionIncludes(vendor, selectedQuote ? context.vendorsById[selectedQuote.vendorId]?.name ?? "Unknown vendor" : "No selected quote") &&
        filterSelectionIncludes(approval, item.approvalStatus) &&
        (!activePersonFilter.length || (task !== undefined && filterSelectionMatchesTaskPeople(activePersonFilter, task)));
    });
    return filterPurchaseItems(purchaseItems, columnFilters, context);
  }, [activePersonFilter, approval, bootstrap.purchaseItems, bootstrap.vendors, columnFilters, context, orderStatus, project, search, vendor]);
  const sorted = useMemo(() => sortPurchaseItems(filtered, sortField, sortDirection, context), [context, filtered, sortDirection, sortField]);
  const pagination = useWorkspacePagination(sorted);
  const filterMotionClass = useFilterChangeMotionClass([activePersonFilter, approval, orderStatus, project, vendor, ...Object.values(columnFilters).flatMap((value) => value ?? []), search]);
  const hasFilters = Boolean(search.trim() || project.length || orderStatus.length || vendor.length || approval.length || activePersonFilter.length || Object.values(columnFilters).some((value) => value?.length));
  const setColumnFilter = (field: PurchaseColumn, value: FilterSelection) => setColumnFilters((current) => ({ ...current, [field]: value }));
  const handleSort = (field: string) => {
    const column = field as PurchaseColumn;
    if (column === sortField) setSortDirection((current) => current === "ascending" ? "descending" : "ascending");
    else { setSortField(column); setSortDirection("ascending"); }
  };
  const openReceipt = (item: PurchaseItemRecord) => {
    setReceiptQuantity("1");
    setReceiptLocation("");
    setReceivingItem(item);
  };
  const submitReceipt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receivingItem || isReceiving) return;
    const quantity = Number(receiptQuantity);
    const location = receiptLocation.trim();
    const received = (receivingItem.receipts ?? []).reduce((total, receipt) => total + receipt.quantity, 0);
    if (!Number.isInteger(quantity) || quantity < 1 || !location || quantity > receivingItem.quantity - received) return;
    setIsReceiving(true);
    await submitPurchaseReceipt({
      write: () => receivePurchaseItemRecord(receivingItem.id, { quantity, location }, handleUnauthorized),
      acknowledge: () => {
        setReceivingItem(null);
        setAcknowledgedReceipt({ id: receivingItem.id, received });
      },
      refresh: () => loadWorkspace?.() ?? Promise.resolve(),
      reportError: (error) => setDataMessage?.(toErrorMessage(error)),
    });
    setIsReceiving(false);
  };

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <PurchaseFiltersToolbar approval={approval} bootstrap={bootstrap} search={search} setApproval={setApproval} setSearch={setSearch} setOrderStatus={setOrderStatus} setProject={setProject} setVendor={setVendor} orderStatus={orderStatus} project={project} uniqueVendors={uniqueVendors} vendor={vendor} sortField={sortField} sortDirection={sortDirection} onSortFieldChange={(field) => setSortField(field as PurchaseColumn)} onSortDirectionChange={setSortDirection} />
      <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add purchase", onSelect: openCreatePurchaseModal })} ariaLabel="Add purchase" title="Add purchase" tutorialTarget="create-purchase-button" />
      <PurchaseTable bootstrap={bootstrap} filteredPurchases={pagination.pageItems} filterMotionClass={filterMotionClass} hasPurchaseFilters={hasFilters} context={context} openEditPurchaseModal={openEditPurchaseModal} canReceivePurchases={canReceivePurchases} onReceive={openReceipt} acknowledgedReceiptId={acknowledgedReceipt?.id ?? null} pagination={pagination} columnFilters={columnFilters} columnOptions={columnOptions} setColumnFilter={setColumnFilter} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
      {receivingItem ? <ModalDialog label={`Receive ${receivingItem.title}`} onClose={() => setReceivingItem(null)} dismissOnBackdrop><form className="modal-card" onSubmit={submitReceipt}>
        <div className="panel-header compact-header"><h2>Receive {receivingItem.title}</h2><button className="secondary-action" type="button" onClick={() => setReceivingItem(null)}>Close</button></div>
        <label className="field"><span>Quantity received</span><input autoFocus min="1" max={receivingItem.quantity - (receivingItem.receipts ?? []).reduce((total, receipt) => total + receipt.quantity, 0)} step="1" required type="number" value={receiptQuantity} onChange={(event) => setReceiptQuantity(event.target.value)} /></label>
        <label className="field"><span>Location</span><input required value={receiptLocation} onChange={(event) => setReceiptLocation(event.target.value)} /></label>
        <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setReceivingItem(null)}>Cancel</button><button className="primary-action" disabled={isReceiving || !receiptLocation.trim()} type="submit">{isReceiving ? "Receiving…" : "Record receipt"}</button></div>
      </form></ModalDialog> : null}
    </section>
  );
}
