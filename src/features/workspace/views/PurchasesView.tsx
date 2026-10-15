import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

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
import { createClientOperationId } from "@/lib/appUtils/clientOperationId";
import { createStableReceiptOperation, isDiscretePurchaseReceipt, isValidReceiptQuantity, receiptOperationStorageKey, restoreReceiptOperation, submitPersistedPurchaseReceipt, sumReceiptQuantities } from "./purchases/submitPurchaseReceipt";

interface PurchasesViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  receiptOperationScope?: string;
  openCreatePurchaseModal: () => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  canReceivePurchases?: boolean;
  handleUnauthorized?: () => void;
  loadWorkspace?: () => Promise<unknown>;
  setDataMessage?: (message: string | null) => void;
}

export function PurchasesView({ activePersonFilter, bootstrap, receiptOperationScope = "local-anonymous", openCreatePurchaseModal, openEditPurchaseModal, canReceivePurchases = false, handleUnauthorized, loadWorkspace, setDataMessage }: PurchasesViewProps) {
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
  const [receiptOutcomeUnknown, setReceiptOutcomeUnknown] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptStorageBlocked, setReceiptStorageBlocked] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [acknowledgedReceipt, setAcknowledgedReceipt] = useState<{ id: string; received: number } | null>(null);
  const bootstrapRef = useRef(bootstrap);
  const [receiptOperations] = useState(() => new Map<string, ReturnType<typeof createStableReceiptOperation>>());
  const receiptScopeRef = useRef(receiptOperationScope);
  useEffect(() => {
    if (receiptScopeRef.current === receiptOperationScope) return;
    receiptScopeRef.current = receiptOperationScope;
    receiptOperations.clear();
    setReceivingItem(null);
    setReceiptOutcomeUnknown(false);
    setReceiptStorageBlocked(false);
    setReceiptError(null);
    setIsReceiving(false);
    setAcknowledgedReceipt(null);
  }, [receiptOperationScope, receiptOperations]);
  const getReceiptStorage = () => {
    try { return globalThis.localStorage; } catch { return undefined; }
  };
  const clearSavedReceiptOperation = (scope: string, itemId: string) => {
    try { getReceiptStorage()?.removeItem(receiptOperationStorageKey(scope, itemId)); } catch { /* The request outcome is already confirmed. */ }
  };
  const operationMapKey = (scope: string, itemId: string) => `${scope}\u0000${itemId}`;
  bootstrapRef.current = bootstrap;
  useEffect(() => {
    if (!acknowledgedReceipt) return;
    const refreshedItem = bootstrap.purchaseItems.find((item) => item.id === acknowledgedReceipt.id);
    const received = sumReceiptQuantities((refreshedItem?.receipts ?? []).map((receipt) => receipt.quantity));
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
    const storage = getReceiptStorage();
    const mapKey = operationMapKey(receiptOperationScope, item.id);
    let operation = receiptOperations.get(mapKey);
    let invalidSavedOperation = false;
    if (!operation) {
      const restored = restoreReceiptOperation(storage, receiptOperationScope, item.id);
      invalidSavedOperation = restored.kind === "invalid";
      operation = createStableReceiptOperation(createClientOperationId, restored.kind === "valid" ? { payload: restored.payload, outcomeUnknown: true } : undefined);
      receiptOperations.set(mapKey, operation);
    }
    const savedPayload = operation.currentPayload();
    setReceiptQuantity(savedPayload ? String(savedPayload.quantity) : "1");
    setReceiptLocation(savedPayload?.location ?? "");
    setReceiptStorageBlocked(invalidSavedOperation);
    setReceiptOutcomeUnknown(operation.isOutcomeUnknown() || invalidSavedOperation);
    setReceiptError(invalidSavedOperation
      ? "Saved receipt details could not be read. Check the purchase history before trying again."
      : operation.isOutcomeUnknown() ? "We couldn't confirm whether this receipt was recorded. Choose Check again to confirm it safely with the same details." : null);
    setReceivingItem(item);
  };
  const submitReceipt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receivingItem || isReceiving) return;
    const quantity = Number(receiptQuantity);
    const location = receiptLocation.trim();
    const received = sumReceiptQuantities((receivingItem.receipts ?? []).map((receipt) => receipt.quantity));
    const discretePart = isDiscretePurchaseReceipt(receivingItem);
    const remaining = receivingItem.quantity - received;
    if (receiptStorageBlocked || !isValidReceiptQuantity(quantity, remaining, discretePart) || !location || location.length > 200) return;
    const mapKey = operationMapKey(receiptOperationScope, receivingItem.id);
    const receiptOperation = receiptOperations.get(mapKey) ?? createStableReceiptOperation(createClientOperationId);
    receiptOperations.set(mapKey, receiptOperation);
    const operation = receiptOperation.payloadFor(quantity, location);
    setIsReceiving(true);
    const outcome = await submitPersistedPurchaseReceipt({
      storage: getReceiptStorage(),
      scope: receiptOperationScope,
      itemId: receivingItem.id,
      payload: operation,
      write: () => receivePurchaseItemRecord(receivingItem.id, operation, handleUnauthorized),
      acknowledge: () => {
        receiptOperations.delete(mapKey);
        clearSavedReceiptOperation(receiptOperationScope, receivingItem.id);
        if (receiptScopeRef.current === receiptOperationScope) {
          setReceivingItem(null);
          setAcknowledgedReceipt({ id: receivingItem.id, received });
        }
      },
      refresh: () => receiptScopeRef.current === receiptOperationScope ? loadWorkspace?.() ?? Promise.resolve() : Promise.resolve(),
      hasReceipt: () => bootstrapRef.current.purchaseItems.find((item) => item.id === receivingItem.id)?.receipts?.some((receipt) => receipt.operationId === operation.operationId) ?? false,
      reportError: (message) => {
        if (receiptScopeRef.current === receiptOperationScope) {
          setReceiptError(message);
          setDataMessage?.(message);
        }
      },
    });
    if (outcome === "not-sent") {
      receiptOperation.reset();
      if (receiptScopeRef.current === receiptOperationScope) {
        setIsReceiving(false);
        setReceiptError("We couldn't save this receipt safely. Check your browser storage settings and try again.");
      }
      return;
    }
    if (outcome === "unknown") receiptOperation.markOutcomeUnknown();
    if (outcome === "rejected") {
      receiptOperation.reset();
      clearSavedReceiptOperation(receiptOperationScope, receivingItem.id);
    }
    if (receiptScopeRef.current === receiptOperationScope) {
      setReceiptOutcomeUnknown(outcome === "unknown");
      setIsReceiving(false);
    }
  };

  const isDiscreteReceipt = receivingItem !== null && isDiscretePurchaseReceipt(receivingItem);
  const receiptUnit = isDiscreteReceipt
    ? "parts"
    : receivingItem?.materialId
    ? bootstrap.materials.find((material) => material.id === receivingItem.materialId)?.unit ?? "material units"
    : "service units";
  const beginNewReceiptOperation = () => {
    if (receivingItem) {
      receiptOperations.get(operationMapKey(receiptOperationScope, receivingItem.id))?.reset();
      clearSavedReceiptOperation(receiptOperationScope, receivingItem.id);
    }
    setReceiptError(null);
  };

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <PurchaseFiltersToolbar approval={approval} bootstrap={bootstrap} search={search} setApproval={setApproval} setSearch={setSearch} setOrderStatus={setOrderStatus} setProject={setProject} setVendor={setVendor} orderStatus={orderStatus} project={project} uniqueVendors={uniqueVendors} vendor={vendor} sortField={sortField} sortDirection={sortDirection} onSortFieldChange={(field) => setSortField(field as PurchaseColumn)} onSortDirectionChange={setSortDirection} />
      <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add purchase", onSelect: openCreatePurchaseModal })} ariaLabel="Add purchase" title="Add purchase" tutorialTarget="create-purchase-button" />
      <PurchaseTable bootstrap={bootstrap} filteredPurchases={pagination.pageItems} filterMotionClass={filterMotionClass} hasPurchaseFilters={hasFilters} context={context} openEditPurchaseModal={openEditPurchaseModal} canReceivePurchases={canReceivePurchases} onReceive={openReceipt} acknowledgedReceiptId={acknowledgedReceipt?.id ?? null} pagination={pagination} columnFilters={columnFilters} columnOptions={columnOptions} setColumnFilter={setColumnFilter} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
      {receivingItem ? <ModalDialog label={`Receive ${receivingItem.title}`} onClose={() => setReceivingItem(null)} dismissOnBackdrop><form className="modal-card" onSubmit={submitReceipt}>
        <div className="panel-header compact-header"><h2>Receive {receivingItem.title}</h2><button className="secondary-action" type="button" onClick={() => setReceivingItem(null)}>Close</button></div>
        <label className="field"><span>Quantity received ({receiptUnit})</span><input autoFocus disabled={isReceiving || receiptOutcomeUnknown || receiptStorageBlocked} min={isDiscreteReceipt ? 1 : undefined} max={Math.min(1000, sumReceiptQuantities([receivingItem.quantity - sumReceiptQuantities((receivingItem.receipts ?? []).map((receipt) => receipt.quantity))]))} step={isDiscreteReceipt ? "1" : "any"} required type="number" value={receiptQuantity} onChange={(event) => { setReceiptQuantity(event.target.value); beginNewReceiptOperation(); }} /></label>
        <label className="field"><span>Location</span><input disabled={isReceiving || receiptOutcomeUnknown || receiptStorageBlocked} maxLength={200} required value={receiptLocation} onChange={(event) => { setReceiptLocation(event.target.value); beginNewReceiptOperation(); }} /></label>
        {receiptError ? <p role="alert">{receiptError}</p> : null}
        {receiptOutcomeUnknown ? <p>These details are held so Check again can confirm the delivery safely.</p> : null}
        <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setReceivingItem(null)}>Cancel</button><button className="primary-action" disabled={isReceiving || receiptStorageBlocked || !receiptLocation.trim()} type="submit">{isReceiving ? "Receiving…" : receiptOutcomeUnknown ? "Check again" : "Record receipt"}</button></div>
      </form></ModalDialog> : null}
    </section>
  );
}
