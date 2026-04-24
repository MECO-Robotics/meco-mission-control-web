import { useMemo, useState, type CSSProperties } from "react";

import { formatCurrency } from "../../../lib/appUtils";
import type { BootstrapPayload, PurchaseItemRecord } from "../../../types";
import { IconManufacturing, IconPerson, IconTasks } from "../../../components/shared/Icons";
import {
  EditableHoverIndicator,
  FilterDropdown,
  RequestedItemMeta,
  SearchToolbarInput,
  TableCell,
} from "../shared/WorkspaceViewShared";
import { getStatusPillClassName } from "../shared/workspaceUtils";
import type { MembersById, SubsystemsById } from "../shared/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "../shared/workspaceTypes";
import { PURCHASE_APPROVAL_OPTIONS, PURCHASE_STATUS_OPTIONS } from "../shared/workspaceOptions";

interface PurchasesViewProps {
  activePersonFilter: string;
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
  const [subsystem, setSubsystem] = useState("all");
  const [requester, setRequester] = useState("all");
  const [status, setStatus] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [approval, setApproval] = useState("all");

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
      const matchesSubsystem = subsystem === "all" || item.subsystemId === subsystem;
      const matchesRequester = requester === "all" || item.requestedById === requester;
      const matchesStatus = status === "all" || item.status === status;
      const matchesVendor = vendor === "all" || item.vendor === vendor;
      const matchesApproval =
        approval === "all" ||
        (approval === "approved" ? item.approvedByMentor : !item.approvedByMentor);

      return (
        matchesSearch &&
        matchesSubsystem &&
        matchesRequester &&
        matchesStatus &&
        matchesVendor &&
        matchesApproval
      );
    });
  }, [approval, bootstrap.purchaseItems, requester, search, status, subsystem, vendor]);

  const gridTemplate = [
    "minmax(200px, 2.5fr)",
    vendor === "all" ? "1fr" : null,
    "0.6fr",
    status === "all" ? "1fr" : null,
    approval === "all" ? "1fr" : null,
    "1fr",
    "1fr",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Purchase list</h2>
          <p className="section-copy filter-copy">
            {activePersonFilter === "all"
              ? "All purchase requests."
              : `Only requests submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
          </p>
        </div>
        <div className="panel-actions filter-toolbar queue-toolbar purchase-toolbar">
          <SearchToolbarInput
            ariaLabel="Search purchase items"
            onChange={setSearch}
            placeholder="Search items..."
            value={search}
          />

          <FilterDropdown
            allLabel="All subsystems"
            ariaLabel="Filter purchases by subsystem"
            icon={<IconManufacturing />}
            onChange={setSubsystem}
            options={bootstrap.subsystems}
            value={subsystem}
          />

          <FilterDropdown
            allLabel="All requesters"
            ariaLabel="Filter purchases by requester"
            icon={<IconPerson />}
            onChange={setRequester}
            options={bootstrap.members}
            value={requester}
          />

          <FilterDropdown
            allLabel="All statuses"
            ariaLabel="Filter purchases by status"
            icon={<IconTasks />}
            onChange={setStatus}
            options={PURCHASE_STATUS_OPTIONS}
            value={status}
          />

          <FilterDropdown
            allLabel="All vendors"
            ariaLabel="Filter purchases by vendor"
            icon={<IconTasks />}
            onChange={setVendor}
            options={uniqueVendors}
            value={vendor}
          />

          <FilterDropdown
            allLabel="All approvals"
            ariaLabel="Filter purchases by approval status"
            icon={<IconTasks />}
            onChange={setApproval}
            options={PURCHASE_APPROVAL_OPTIONS}
            value={approval}
          />

          <button
            aria-label="Add purchase"
            className="primary-action queue-toolbar-action"
            onClick={openCreatePurchaseModal}
            title="Add purchase"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div
          className="ops-table ops-table-header purchase-table"
          style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
        >
          <span>Item</span>
          {vendor === "all" ? <span>Vendor</span> : null}
          <span>Qty</span>
          {status === "all" ? <span>Status</span> : null}
          {approval === "all" ? <span>Mentor</span> : null}
          <span>Est.</span>
          <span>Final</span>
        </div>

        {filteredPurchases.map((item) => (
          <button
            className="ops-table ops-row purchase-table ops-button-row editable-hover-target editable-hover-target-row"
            key={item.id}
            onClick={() => openEditPurchaseModal(item)}
            style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
            type="button"
          >
            <span className="queue-title table-cell table-cell-primary" data-label="Item">
              <RequestedItemMeta item={item} membersById={membersById} subsystemsById={subsystemsById} />
            </span>
            {vendor === "all" ? <TableCell label="Vendor">{item.vendor}</TableCell> : null}
            <TableCell label="Qty">{item.quantity}</TableCell>
            {status === "all" ? (
              <TableCell label="Status" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(item.status)}>{item.status}</span>
              </TableCell>
            ) : null}
            {approval === "all" ? (
              <TableCell label="Mentor" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(item.approvedByMentor ? "approved" : "waiting")}>
                  {item.approvedByMentor ? "Approved" : "Waiting"}
                </span>
              </TableCell>
            ) : null}
            <TableCell label="Est.">{formatCurrency(item.estimatedCost)}</TableCell>
            <TableCell label="Final">{formatCurrency(item.finalCost)}</TableCell>
            <EditableHoverIndicator />
          </button>
        ))}

        {filteredPurchases.length === 0 ? (
          <p className="empty-state">No purchase requests match the current filters.</p>
        ) : null}
      </div>
    </section>
  );
}
