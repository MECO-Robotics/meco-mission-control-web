import { useMemo, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { PurchaseItemRecord } from "@/types/recordsInventory";
import { WorkspaceFloatingAddButton } from "@/features/workspace/shared/ui";
import { useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";

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
  const hasPurchaseFilters =
    search.trim().length > 0 ||
    subsystem.length > 0 ||
    requester.length > 0 ||
    status.length > 0 ||
    vendor.length > 0 ||
    approval.length > 0 ||
    activePersonFilter.length > 0;

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <PurchaseFiltersToolbar
        approval={approval}
        bootstrap={bootstrap}
        requester={requester}
        search={search}
        setApproval={setApproval}
        setRequester={setRequester}
        setSearch={setSearch}
        setStatus={setStatus}
        setSubsystem={setSubsystem}
        setVendor={setVendor}
        status={status}
        subsystem={subsystem}
        uniqueVendors={uniqueVendors}
        vendor={vendor}
      />

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

      <PurchaseTable
        approval={approval}
        bootstrap={bootstrap}
        filteredPurchases={filteredPurchases}
        filterMotionClass={purchaseFilterMotionClass}
        hasPurchaseFilters={hasPurchaseFilters}
        membersById={membersById}
        openCreatePurchaseModal={openCreatePurchaseModal}
        openEditPurchaseModal={openEditPurchaseModal}
        pagination={purchasePagination}
        requester={requester}
        setApproval={setApproval}
        setRequester={setRequester}
        setStatus={setStatus}
        setSubsystem={setSubsystem}
        setVendor={setVendor}
        status={status}
        subsystem={subsystem}
        subsystemsById={subsystemsById}
        uniqueVendors={uniqueVendors}
        vendor={vendor}
      />
    </section>
  );
}
