import { useMemo, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { buildSingleAddMenuAction } from "@/features/workspace/shared/topbar";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { getResourceFilterOptions } from "@/features/workspace/shared/resourceList/resourceListModel";
import type { ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import { filterPurchaseItems, getPurchaseFilterValue, sortPurchaseItems, type PurchaseColumn, type PurchaseColumnFilters } from "./purchases/purchaseListModel";
import { PurchaseFiltersToolbar } from "./purchases/PurchaseFiltersToolbar";
import { PurchaseTable } from "./purchases/PurchaseTable";

interface PurchasesViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  openCreatePurchaseModal: () => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  subsystemsById: SubsystemsById;
}

export function PurchasesView({ activePersonFilter, bootstrap, membersById, openCreatePurchaseModal, openEditPurchaseModal, subsystemsById }: PurchasesViewProps) {
  const [search, setSearch] = useState("");
  const [subsystem, setSubsystem] = useState<FilterSelection>([]);
  const [requester, setRequester] = useState<FilterSelection>([]);
  const [status, setStatus] = useState<FilterSelection>([]);
  const [vendor, setVendor] = useState<FilterSelection>([]);
  const [approval, setApproval] = useState<FilterSelection>([]);
  const [columnFilters, setColumnFilters] = useState<PurchaseColumnFilters>({});
  const [sortField, setSortField] = useState<PurchaseColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<ResourceSortDirection>("ascending");

  const uniqueVendors = useMemo(() => getResourceFilterOptions(bootstrap.purchaseItems.map((item) => item.vendor).filter(Boolean)), [bootstrap.purchaseItems]);
  const columnOptions = useMemo(() => ({
    item: getResourceFilterOptions(bootstrap.purchaseItems.map((item) => item.title)),
    vendor: uniqueVendors,
    quantity: getResourceFilterOptions(bootstrap.purchaseItems.map((item) => String(item.quantity))),
    status: getResourceFilterOptions(bootstrap.purchaseItems.map((item) => item.status)),
    mentor: getResourceFilterOptions(bootstrap.purchaseItems.map((item) => item.approvedByMentor ? "Approved" : "Waiting")),
    estimated: getResourceFilterOptions(bootstrap.purchaseItems.map((item) => getPurchaseFilterValue(item, "estimated"))),
    final: getResourceFilterOptions(bootstrap.purchaseItems.map((item) => getPurchaseFilterValue(item, "final"))),
  }), [bootstrap.purchaseItems, uniqueVendors]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const purchaseItems = bootstrap.purchaseItems.filter((item) => {
      const searchable = [item.title, item.vendor, item.subsystemId ? subsystemsById[item.subsystemId]?.name : "", item.requestedById ? membersById[item.requestedById]?.name : ""].join(" ").toLowerCase();
      return (!query || searchable.includes(query)) &&
        filterSelectionIncludes(subsystem, item.subsystemId) &&
        filterSelectionIncludes(requester, item.requestedById) &&
        filterSelectionIncludes(status, item.status) &&
        filterSelectionIncludes(vendor, item.vendor) &&
        filterSelectionIncludes(activePersonFilter, item.requestedById) &&
        (approval.length === 0 || approval.includes(item.approvedByMentor ? "approved" : "waiting"));
    });
    return filterPurchaseItems(purchaseItems, columnFilters);
  }, [activePersonFilter, approval, bootstrap.purchaseItems, columnFilters, membersById, requester, search, status, subsystem, subsystemsById, vendor]);
  const sorted = useMemo(() => sortPurchaseItems(filtered, sortField, sortDirection), [filtered, sortDirection, sortField]);
  const pagination = useWorkspacePagination(sorted);
  const filterMotionClass = useFilterChangeMotionClass([activePersonFilter, approval, ...Object.values(columnFilters).flatMap((value) => value ?? []), requester, search, status, subsystem, vendor]);
  const hasFilters = Boolean(search.trim() || subsystem.length || requester.length || status.length || vendor.length || approval.length || activePersonFilter.length || Object.values(columnFilters).some((value) => value?.length));
  const setColumnFilter = (field: PurchaseColumn, value: FilterSelection) => setColumnFilters((current) => ({ ...current, [field]: value }));
  const handleSort = (field: string) => {
    const column = field as PurchaseColumn;
    if (column === sortField) setSortDirection((current) => current === "ascending" ? "descending" : "ascending");
    else { setSortField(column); setSortDirection("ascending"); }
  };

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <PurchaseFiltersToolbar approval={approval} bootstrap={bootstrap} requester={requester} search={search} setApproval={setApproval} setRequester={setRequester} setSearch={setSearch} setStatus={setStatus} setSubsystem={setSubsystem} setVendor={setVendor} status={status} subsystem={subsystem} uniqueVendors={uniqueVendors} vendor={vendor} sortField={sortField} sortDirection={sortDirection} onSortFieldChange={(field) => setSortField(field as PurchaseColumn | null)} onSortDirectionChange={setSortDirection} />
      <WorkspaceTopbarAddMenu actions={buildSingleAddMenuAction({ label: "Add purchase", onSelect: openCreatePurchaseModal })} ariaLabel="Add purchase" title="Add purchase" tutorialTarget="create-purchase-button" />
      <PurchaseTable bootstrap={bootstrap} filteredPurchases={pagination.pageItems} filterMotionClass={filterMotionClass} hasPurchaseFilters={hasFilters} membersById={membersById} openEditPurchaseModal={openEditPurchaseModal} pagination={pagination} subsystemsById={subsystemsById} columnFilters={columnFilters} columnOptions={columnOptions} setColumnFilter={setColumnFilter} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
    </section>
  );
}
