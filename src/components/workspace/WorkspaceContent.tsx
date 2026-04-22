import { useState, useMemo, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { RosterView } from "./RosterView";
import { TimelineView } from "./TimelineView";
import { IconManufacturing, IconPerson, IconTasks } from "../shared/Icons";
import { formatCurrency, formatDate } from "../../lib/appUtils";
import type {
  BootstrapPayload,
  ManufacturingItemRecord,
  MemberPayload,
  PurchaseItemRecord,
  TaskRecord,
} from "../../types";

interface WorkspaceContentProps {
  activePersonFilter: string;
  activeTab: string;
  bootstrap: BootstrapPayload;
  cncItems: ManufacturingItemRecord[];
  dataMessage: string | null;
  handleCreateMember: (event: FormEvent<HTMLFormElement>) => void;
  handleDeleteMember: (id: string) => void;
  handleUpdateMember: (event: FormEvent<HTMLFormElement>) => void;
  isAddPersonOpen: boolean;
  isDeletingMember: boolean;
  isEditPersonOpen: boolean;
  isLoadingData: boolean;
  isSavingMember: boolean;
  memberEditDraft: MemberPayload | null;
  memberForm: MemberPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openCreateManufacturingModal: (process: "cnc" | "3d-print" | "fabrication") => void;
  openCreatePurchaseModal: () => void;
  openCreateTaskModal: () => void;
  openEditManufacturingModal: (item: ManufacturingItemRecord) => void;
  openEditPurchaseModal: (item: PurchaseItemRecord) => void;
  openEditTaskModal: (task: TaskRecord) => void;
  printItems: ManufacturingItemRecord[];
  purchaseSummary: {
    delivered: number;
    totalEstimated: number;
  };
  renderItemMeta: (
    item: PurchaseItemRecord | ManufacturingItemRecord,
    membersById: Record<string, BootstrapPayload["members"][number]>,
    subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
  ) => ReactNode;
  rosterMentors: BootstrapPayload["members"];
  selectMember: (id: string | null, payload: BootstrapPayload) => void;
  selectedMemberId: string | null;
  setIsAddPersonOpen: (open: boolean) => void;
  setIsEditPersonOpen: (open: boolean) => void;
  setMemberEditDraft: Dispatch<SetStateAction<MemberPayload | null>>;
  setMemberForm: Dispatch<SetStateAction<MemberPayload>>;
  students: BootstrapPayload["members"];
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

/**
 * Reusable component for the "dropdown styled as label" pattern.
 */
function FilterDropdown({
  icon,
  value,
  onChange,
  options,
  allLabel,
}: {
  icon: ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
  allLabel: string;
}) {
  const isActive = value !== "all";
  return (
    <label
      className="toolbar-filter toolbar-filter-compact"
      style={isActive ? { background: "var(--meco-soft-blue)", borderColor: "var(--meco-blue)" } : { background: "var(--bg-row-alt)", border: "1px solid var(--border-base)" }}
    >
      <span className="toolbar-filter-icon" style={isActive ? { color: "var(--meco-blue)" } : { color: "var(--text-copy)" }}>{icon}</span>
      <select
        onChange={(e) => onChange(e.target.value)}
        value={value}
        style={{
          color: isActive ? "var(--text-title)" : "var(--text-copy)",
          fontWeight: isActive ? "600" : "400",
          background: "inherit",
        }}
      >
        <option value="all">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
    </label>
  );
}

export function WorkspaceContent({
  activePersonFilter,
  activeTab,
  bootstrap,
  cncItems,
  dataMessage,
  handleCreateMember,
  handleDeleteMember,
  handleUpdateMember,
  isAddPersonOpen,
  isDeletingMember,
  isEditPersonOpen,
  isLoadingData,
  isSavingMember,
  memberEditDraft,
  memberForm,
  membersById,
  openCreateManufacturingModal,
  openCreatePurchaseModal,
  openCreateTaskModal,
  openEditManufacturingModal,
  openEditPurchaseModal,
  openEditTaskModal,
  printItems,
  purchaseSummary,
  renderItemMeta,
  rosterMentors,
  selectMember,
  selectedMemberId,
  setIsAddPersonOpen,
  setIsEditPersonOpen,
  setMemberEditDraft,
  setMemberForm,
  students,
  subsystemsById,
}: WorkspaceContentProps) {
  const [queueSortField, setQueueSortField] = useState<string>("dueDate");
  const [queueSortOrder, setQueueSortOrder] = useState<"asc" | "desc">("asc");
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>("all");
  const [queueSubsystemFilter, setQueueSubsystemFilter] = useState<string>("all");
  const [queueOwnerFilter, setQueueOwnerFilter] = useState<string>("all");
  const [queuePriorityFilter, setQueuePriorityFilter] = useState<string>("all");
  const [queueSearchFilter, setQueueSearchFilter] = useState<string>("");

  // Purchase Filters
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [purchaseSubsystem, setPurchaseSubsystem] = useState("all");
  const [purchaseRequester, setPurchaseRequester] = useState("all");
  const [purchaseStatus, setPurchaseStatus] = useState("all");
  const [purchaseVendor, setPurchaseVendor] = useState("all");
  const [purchaseApproval, setPurchaseApproval] = useState("all");

  // Manufacturing Filters (CNC & Prints)
  const [mfgSearch, setMfgSearch] = useState("");
  const [mfgSubsystem, setMfgSubsystem] = useState("all");
  const [mfgRequester, setMfgRequester] = useState("all");
  const [mfgStatus, setMfgStatus] = useState("all");
  const [mfgMaterial, setMfgMaterial] = useState("all");
  const [materialSearch, setMaterialSearch] = useState("");

  const uniqueMaterials = useMemo(() => {
    const materials = bootstrap.manufacturingItems.map((item) => item.material);
    return Array.from(new Set(materials)).sort();
  }, [bootstrap.manufacturingItems]);

  const uniqueVendors = useMemo(() => {
    const vendors = bootstrap.purchaseItems.map((item) => item.vendor);
    return Array.from(new Set(vendors)).sort();
  }, [bootstrap.purchaseItems]);

  // Visibility logic for columns based on active filters
  const showSubsystemCol = queueSubsystemFilter === "all";
  const showOwnerCol = queueOwnerFilter === "all";
  const showStatusCol = queueStatusFilter === "all";
  const showPriorityCol = queuePriorityFilter === "all";

  const queueGridTemplate = [
    "minmax(200px, 2.5fr)", // Task column (always visible)
    showSubsystemCol ? "1fr" : null,
    showOwnerCol ? "1fr" : null,
    showStatusCol ? "1fr" : null,
    "1fr",                  // Due column (always visible)
    showPriorityCol ? "1fr" : null,
  ].filter(Boolean).join(" ");

  const purchaseGridTemplate = [
    "minmax(200px, 2.5fr)", // Item column
    purchaseVendor === "all" ? "1fr" : null, // Vendor
    "0.6fr",                // Qty
    purchaseStatus === "all" ? "1fr" : null,
    purchaseApproval === "all" ? "1fr" : null, // Mentor
    "1fr",                  // Est
    "1fr",                  // Final
  ].filter(Boolean).join(" ");

  const mfgGridTemplate = [
    "minmax(200px, 2.5fr)", // Part column
    mfgMaterial === "all" ? "1fr" : null,
    "0.6fr",                // Qty
    "1fr",                  // Batch
    "1fr",                  // Due
    mfgStatus === "all" ? "1fr" : null,
    "1fr",                  // Mentor
  ].filter(Boolean).join(" ");

  const getPillStyle = (value: string) => {
    const success = ["complete", "delivered", "approved", "low"];
    const info = ["in-progress", "shipped", "purchased", "medium"];
    const warning = ["waiting-for-qa", "qa", "requested", "high", "waiting"];
    const danger = ["not-started", "critical"];

    let prefix = "--status-neutral";
    if (success.includes(value)) prefix = "--status-success";
    else if (info.includes(value)) prefix = "--status-info";
    else if (warning.includes(value)) prefix = "--status-warning";
    else if (danger.includes(value)) prefix = "--status-danger";

    return {
      background: `var(${prefix}-bg)`,
      color: `var(${prefix}-text)`,
      border: "none",
      fontWeight: "600",
      fontSize: "0.7rem",
      padding: "2px 8px",
      borderRadius: "4px",
      textTransform: "capitalize" as const,
      width: "fit-content",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    };
  };

  const toggleSort = (field: string) => {
    if (queueSortField === field) {
      setQueueSortOrder(queueSortOrder === "asc" ? "desc" : "asc");
    } else {
      setQueueSortField(field);
      setQueueSortOrder("asc");
    }
  };

  const processedTasks = useMemo(() => {
    let result = [...bootstrap.tasks];

    if (queueStatusFilter !== "all") {
      result = result.filter((t) => t.status === queueStatusFilter);
    }
    if (queueSubsystemFilter !== "all") {
      result = result.filter((t) => t.subsystemId === queueSubsystemFilter);
    }
    if (queueOwnerFilter !== "all") {
      result = result.filter((t) => t.ownerId === queueOwnerFilter);
    }
    if (queuePriorityFilter !== "all") {
      result = result.filter((t) => t.priority === queuePriorityFilter);
    }
    if (queueSearchFilter.trim() !== "") {
      const search = queueSearchFilter.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.summary.toLowerCase().includes(search)
      );
    }

    const PRIORITY_VALS: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const STATUS_VALS: Record<string, number> = { "not-started": 1, "in-progress": 2, "waiting-for-qa": 3, complete: 4 };

    return result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (queueSortField === "priority") {
        aVal = PRIORITY_VALS[a.priority] || 0;
        bVal = PRIORITY_VALS[b.priority] || 0;
      } else if (queueSortField === "status") {
        aVal = STATUS_VALS[a.status] || 0;
        bVal = STATUS_VALS[b.status] || 0;
      } else if (queueSortField === "subsystemId") {
        aVal = subsystemsById[a.subsystemId ?? ""]?.name ?? "";
        bVal = subsystemsById[b.subsystemId ?? ""]?.name ?? "";
      } else if (queueSortField === "ownerId") {
        aVal = membersById[a.ownerId ?? ""]?.name ?? "";
        bVal = membersById[b.ownerId ?? ""]?.name ?? "";
      } else {
        aVal = (a as any)[queueSortField] ?? "";
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        bVal = (b as any)[queueSortField] ?? "";
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return queueSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return queueSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [bootstrap.tasks, queueStatusFilter, queueSubsystemFilter, queueOwnerFilter, queuePriorityFilter, queueSearchFilter, queueSortField, queueSortOrder, subsystemsById, membersById]);

  const filteredPurchases = useMemo(() => {
    return bootstrap.purchaseItems.filter((item) => {
      const matchesSearch = !purchaseSearch ||
        item.title.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        item.vendor.toLowerCase().includes(purchaseSearch.toLowerCase());
      const matchesSubsystem = purchaseSubsystem === "all" || item.subsystemId === purchaseSubsystem;
      const matchesRequester = purchaseRequester === "all" || item.requestedById === purchaseRequester;
      const matchesStatus = purchaseStatus === "all" || item.status === purchaseStatus;
      const matchesVendor = purchaseVendor === "all" || item.vendor === purchaseVendor;
      const matchesApproval = purchaseApproval === "all" ||
        (purchaseApproval === "approved" ? item.approvedByMentor : !item.approvedByMentor);
      return matchesSearch && matchesSubsystem && matchesRequester && matchesStatus && matchesVendor && matchesApproval;
    });
  }, [bootstrap.purchaseItems, purchaseSearch, purchaseSubsystem, purchaseRequester, purchaseStatus, purchaseVendor, purchaseApproval]);

  const filteredCnc = useMemo(() => {
    return cncItems.filter((item) => {
      const matchesSearch = !mfgSearch || item.title.toLowerCase().includes(mfgSearch.toLowerCase());
      const matchesSubsystem = mfgSubsystem === "all" || item.subsystemId === mfgSubsystem;
      const matchesRequester = mfgRequester === "all" || item.requestedById === mfgRequester;
      const matchesStatus = mfgStatus === "all" || item.status === mfgStatus;
      const matchesMaterial = mfgMaterial === "all" || item.material === mfgMaterial;
      return matchesSearch && matchesSubsystem && matchesRequester && matchesStatus && matchesMaterial;
    });
  }, [cncItems, mfgSearch, mfgSubsystem, mfgRequester, mfgStatus, mfgMaterial]);

  const filteredPrints = useMemo(() => {
    return printItems.filter((item) => {
      const matchesSearch = !mfgSearch || item.title.toLowerCase().includes(mfgSearch.toLowerCase());
      const matchesSubsystem = mfgSubsystem === "all" || item.subsystemId === mfgSubsystem;
      const matchesRequester = mfgRequester === "all" || item.requestedById === mfgRequester;
      const matchesStatus = mfgStatus === "all" || item.status === mfgStatus;
      const matchesMaterial = mfgMaterial === "all" || item.material === mfgMaterial;
      return matchesSearch && matchesSubsystem && matchesRequester && matchesStatus && matchesMaterial;
    });
  }, [printItems, mfgSearch, mfgSubsystem, mfgRequester, mfgStatus, mfgMaterial]);

  const filteredMaterials = useMemo(() => {
    return uniqueMaterials.filter(m => !materialSearch || m.toLowerCase().includes(materialSearch.toLowerCase()));
  }, [uniqueMaterials, materialSearch]);

  const renderSearchInput = (value: string, onChange: (val: string) => void, placeholder: string) => {
    const isActive = value.trim() !== "";
    return (
      <div
        className="toolbar-filter toolbar-filter-compact"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          background: isActive ? "var(--meco-soft-blue)" : "var(--bg-row-alt)",
          border: isActive ? "1px solid var(--meco-blue)" : "1px solid var(--border-base)",
          borderRadius: "6px"
        }}
      >
        <span style={{ color: isActive ? "var(--meco-blue)" : "var(--text-copy)", display: "flex", alignItems: "center", marginRight: "4px" }}><IconTasks /></span>
        <input onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ border: "none", outline: "none", fontSize: "0.85rem", padding: "6px 0", width: "120px", background: "inherit", color: isActive ? "var(--text-title)" : "var(--text-copy)" }} type="text" value={value} />
      </div>
    );
  };

  const getSortIcon = (field: string) => {
    if (queueSortField !== field) return null;
    return queueSortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div
      className="dense-shell with-sidebar"
      style={{
        padding: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        minHeight: "100%",
      }}
    >
      {dataMessage ? <p className="banner banner-error">{dataMessage}</p> : null}
      {isLoadingData ? <p className="banner">Refreshing workspace data...</p> : null}

      {activeTab === "timeline" ? (
        <TimelineView
          activePersonFilter={activePersonFilter}
          bootstrap={bootstrap}
          membersById={membersById}
          openCreateTaskModal={openCreateTaskModal}
          openEditTaskModal={openEditTaskModal}
        />
      ) : null}

      {activeTab === "queue" ? (
        <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none", background: "var(--bg-panel)" }}>
          <div className="panel-header compact-header">
            <div>
              <h2 style={{ color: "var(--text-title)" }}>Task queue</h2>
              <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
                {activePersonFilter === "all"
                  ? "All tasks in queue."
                  : `Only tasks owned by or mentored by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
              </p>
            </div>
            <div
              className="panel-actions"
              style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}
            >
              {renderSearchInput(queueSearchFilter, setQueueSearchFilter, "Search tasks...")}

              <FilterDropdown
                allLabel="All subsystems"
                icon={<IconManufacturing />}
                onChange={setQueueSubsystemFilter}
                options={bootstrap.subsystems}
                value={queueSubsystemFilter}
              />

              <FilterDropdown
                allLabel="All owners"
                icon={<IconPerson />}
                onChange={setQueueOwnerFilter}
                options={bootstrap.members}
                value={queueOwnerFilter}
              />

              <FilterDropdown
                allLabel="All statuses"
                icon={<IconTasks />}
                onChange={setQueueStatusFilter}
                options={[
                  { id: "not-started", name: "Not started" },
                  { id: "in-progress", name: "In progress" },
                  { id: "waiting-for-qa", name: "Waiting for QA" },
                  { id: "complete", name: "Complete" },
                ]}
                value={queueStatusFilter}
              />

              <FilterDropdown
                allLabel="All priorities"
                icon={<IconTasks />}
                onChange={setQueuePriorityFilter}
                options={["critical", "high", "medium", "low"].map(p => ({ id: p, name: p }))}
                value={queuePriorityFilter}
              />

              <button className="primary-action" onClick={openCreateTaskModal} type="button">
                New task
              </button>
            </div>
          </div>
          <div className="table-shell">
            <div className="queue-table queue-table-header" style={{ gridTemplateColumns: queueGridTemplate, borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)" }}>
              <span onClick={() => toggleSort("title")} style={{ cursor: "pointer" }}>Task{getSortIcon("title")}</span>
              {showSubsystemCol && <span onClick={() => toggleSort("subsystemId")} style={{ cursor: "pointer" }}>Subsystem{getSortIcon("subsystemId")}</span>}
              {showOwnerCol && <span onClick={() => toggleSort("ownerId")} style={{ cursor: "pointer" }}>Owner{getSortIcon("ownerId")}</span>}
              {showStatusCol && <span onClick={() => toggleSort("status")} style={{ cursor: "pointer" }}>Status{getSortIcon("status")}</span>}
              <span onClick={() => toggleSort("dueDate")} style={{ cursor: "pointer" }}>Due{getSortIcon("dueDate")}</span>
              {showPriorityCol && <span onClick={() => toggleSort("priority")} style={{ cursor: "pointer" }}>Priority{getSortIcon("priority")}</span>}
            </div>
            {processedTasks.map((task) => (
              <button
                className="queue-table queue-row"
                key={task.id}
                onClick={() => openEditTaskModal(task)}
                style={{ gridTemplateColumns: queueGridTemplate, borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)", background: "var(--bg-row-alt)", marginBottom: "1px" }}
                type="button"
              >
                <span className="queue-title" style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                  <strong style={{ color: "var(--text-title)" }}>{task.title}</strong>
                  <small style={{ color: "var(--text-copy)" }}>{task.summary}</small>
                </span>
                {showSubsystemCol && <span style={{ color: "var(--text-copy)" }}>{(task.subsystemId ? subsystemsById[task.subsystemId]?.name : null) ?? "Unknown"}</span>}
                {showOwnerCol && <span style={{ color: "var(--text-copy)" }}>{(task.ownerId ? membersById[task.ownerId]?.name : null) ?? "Unassigned"}</span>}
                {showStatusCol && <span style={getPillStyle(task.status)}>{task.status.replace("-", " ")}</span>}
                <span>{formatDate(task.dueDate)}</span>
                {showPriorityCol && <span style={getPillStyle(task.priority)}>{task.priority}</span>}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "purchases" ? (
        <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none", background: "var(--bg-panel)" }}>
          <div className="panel-header compact-header">
            <div>
              <h2 style={{ color: "var(--text-title)" }}>Purchase list</h2>
              <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
                {activePersonFilter === "all"
                  ? "All purchase requests."
                  : `Only requests submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
              </p>
            </div>
            <div className="panel-actions" style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
              {renderSearchInput(purchaseSearch, setPurchaseSearch, "Search items...")}

              <FilterDropdown
                allLabel="All subsystems"
                icon={<IconManufacturing />}
                onChange={setPurchaseSubsystem}
                options={bootstrap.subsystems}
                value={purchaseSubsystem}
              />

              <FilterDropdown
                allLabel="All requesters"
                icon={<IconPerson />}
                onChange={setPurchaseRequester}
                options={bootstrap.members}
                value={purchaseRequester}
              />

              <FilterDropdown
                allLabel="All statuses"
                icon={<IconTasks />}
                onChange={setPurchaseStatus}
                options={[
                  { id: "requested", name: "Requested" },
                  { id: "approved", name: "Approved" },
                  { id: "purchased", name: "Purchased" },
                  { id: "shipped", name: "Shipped" },
                  { id: "delivered", name: "Delivered" },
                ]}
                value={purchaseStatus}
              />

              <FilterDropdown
                allLabel="All vendors"
                icon={<IconManufacturing />}
                onChange={setPurchaseVendor}
                options={uniqueVendors.map(v => ({ id: v, name: v }))}
                value={purchaseVendor}
              />

              <FilterDropdown
                allLabel="All approvals"
                icon={<IconTasks />}
                onChange={setPurchaseApproval}
                options={[
                  { id: "approved", name: "Approved" },
                  { id: "waiting", name: "Waiting" },
                ]}
                value={purchaseApproval}
              />

              <div className="mini-summary-row" style={{ gap: "8px" }}>
                <div className="mini-chip" style={{ background: "var(--meco-soft-blue)", border: "1px solid var(--meco-blue)" }}>
                  <span style={{ color: "var(--meco-blue)" }}>Estimated</span>
                  <strong style={{ color: "var(--text-title)" }}>{formatCurrency(purchaseSummary.totalEstimated)}</strong>
                </div>
                <div className="mini-chip" style={{ background: "var(--bg-row-alt)", border: "1px solid var(--border-base)" }}>
                  <span style={{ color: "var(--text-copy)" }}>Delivered</span>
                  <strong style={{ color: "var(--text-title)" }}>{purchaseSummary.delivered}</strong>
                </div>
              </div>
              <button
                className="primary-action"
                onClick={openCreatePurchaseModal}
                type="button"
              >
                Add purchase
              </button>
            </div>
          </div>
          <div className="table-shell">
            <div className="ops-table ops-table-header purchase-table" style={{ gridTemplateColumns: purchaseGridTemplate, borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)" }}>
              <span style={{ textAlign: "left" }}>Item</span>
              {purchaseVendor === "all" && <span>Vendor</span>}
              <span>Qty</span>
              {purchaseStatus === "all" && <span>Status</span>}
              {purchaseApproval === "all" && <span>Mentor</span>}
              <span>Est.</span>
              <span>Final</span>
            </div>
            {filteredPurchases.map((item) => (
              <button
                className="ops-table ops-row purchase-table ops-button-row"
                key={item.id}
                onClick={() => openEditPurchaseModal(item)}
                style={{ gridTemplateColumns: purchaseGridTemplate, borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)", background: "var(--bg-row-alt)", marginBottom: "1px" }}
                type="button"
              >
                <span className="queue-title" style={{ textAlign: "left" }}>
                  {renderItemMeta(item, membersById, subsystemsById)}
                </span>
                {purchaseVendor === "all" && <span style={{ color: "var(--text-copy)" }}>{item.vendor}</span>}
                <span style={{ color: "var(--text-copy)" }}>{item.quantity}</span>
                {purchaseStatus === "all" && <span style={getPillStyle(item.status)}>{item.status}</span>}
                {purchaseApproval === "all" && <span style={getPillStyle(item.approvedByMentor ? "approved" : "waiting")}>{item.approvedByMentor ? "Approved" : "Waiting"}</span>}
                <span>{formatCurrency(item.estimatedCost)}</span>
                <span>{formatCurrency(item.finalCost)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "cnc" ? (
        <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none", background: "var(--bg-panel)" }}>
          <div className="panel-header compact-header">
            <div>
              <h2 style={{ color: "var(--text-title)" }}>CNC queue</h2>
              <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
                {activePersonFilter === "all"
                  ? "All CNC jobs."
                  : `Only CNC jobs submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
              </p>
            </div>
            <div className="panel-actions" style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
              {renderSearchInput(mfgSearch, setMfgSearch, "Search parts...")}

              <FilterDropdown
                allLabel="All subsystems"
                icon={<IconManufacturing />}
                onChange={setMfgSubsystem}
                options={bootstrap.subsystems}
                value={mfgSubsystem}
              />

              <FilterDropdown
                allLabel="All materials"
                icon={<IconManufacturing />}
                onChange={setMfgMaterial}
                options={uniqueMaterials.map(m => ({ id: m, name: m }))}
                value={mfgMaterial}
              />

              <FilterDropdown
                allLabel="All statuses"
                icon={<IconTasks />}
                onChange={setMfgStatus}
                options={[
                  { id: "requested", name: "Requested" },
                  { id: "approved", name: "Approved" },
                  { id: "in-progress", name: "In progress" },
                  { id: "qa", name: "QA" },
                  { id: "complete", name: "Complete" },
                ]}
                value={mfgStatus}
              />

              <div className="mini-summary-row">
                <div className="mini-chip" style={{ background: "var(--meco-soft-blue)", border: "1px solid var(--meco-blue)" }}>
                  <span style={{ color: "var(--meco-blue)" }}>Open jobs</span>
                  <strong style={{ color: "var(--text-title)" }}>{cncItems.length}</strong>
                </div>
              </div>
              <button
                className="primary-action"
                onClick={() => openCreateManufacturingModal("cnc")}
                type="button"
              >
                Add CNC job
              </button>
            </div>
          </div>
          <div className="table-shell">
            <div className="ops-table ops-table-header manufacturing-table" style={{ gridTemplateColumns: mfgGridTemplate, borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)" }}>
              <span style={{ textAlign: "left" }}>Part</span>
              {mfgMaterial === "all" && <span>Material</span>}
              <span>Qty</span>
              <span>Batch</span>
              <span>Due</span>
              {mfgStatus === "all" && <span>Status</span>}
              <span>Mentor</span>
            </div>
            {filteredCnc.map((item) => (
              <button
                className="ops-table ops-row manufacturing-table ops-button-row"
                key={item.id}
                onClick={() => openEditManufacturingModal(item)}
                style={{ gridTemplateColumns: mfgGridTemplate, borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)", background: "var(--bg-row-alt)", marginBottom: "1px" }}
                type="button"
              >
                <span className="queue-title" style={{ textAlign: "left" }}>
                  {renderItemMeta(item, membersById, subsystemsById)}
                </span>
                {mfgMaterial === "all" && <span style={{ color: "var(--text-copy)" }}>{item.material}</span>}
                <span style={{ color: "var(--text-copy)" }}>{item.quantity}</span>
                <span style={{ color: "var(--text-copy)" }}>{item.batchLabel ?? "Unbatched"}</span>
                <span style={{ color: "var(--text-copy)" }}>{formatDate(item.dueDate)}</span>
                {mfgStatus === "all" && <span style={getPillStyle(item.status)}>{item.status.replace("-", " ")}</span>}
                <span style={{ color: "var(--text-copy)" }}>{item.mentorReviewed ? "Reviewed" : "Pending"}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "prints" ? (
        <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none", background: "var(--bg-panel)" }}>
          <div className="panel-header compact-header">
            <div>
              <h2 style={{ color: "var(--text-title)" }}>3D print queue</h2>
              <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
                {activePersonFilter === "all"
                  ? "All 3D print jobs."
                  : `Only print jobs submitted by ${membersById[activePersonFilter]?.name ?? "selected person"}.`}
              </p>
            </div>
            <div className="panel-actions" style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
              {renderSearchInput(mfgSearch, setMfgSearch, "Search parts...")}

              <FilterDropdown
                allLabel="All subsystems"
                icon={<IconManufacturing />}
                onChange={setMfgSubsystem}
                options={bootstrap.subsystems}
                value={mfgSubsystem}
              />

              <FilterDropdown
                allLabel="All materials"
                icon={<IconManufacturing />}
                onChange={setMfgMaterial}
                options={uniqueMaterials.map(m => ({ id: m, name: m }))}
                value={mfgMaterial}
              />

              <FilterDropdown
                allLabel="All statuses"
                icon={<IconTasks />}
                onChange={setMfgStatus}
                options={[
                  { id: "requested", name: "Requested" },
                  { id: "approved", name: "Approved" },
                  { id: "in-progress", name: "In progress" },
                  { id: "qa", name: "QA" },
                  { id: "complete", name: "Complete" },
                ]}
                value={mfgStatus}
              />

              <div className="mini-summary-row">
                <div className="mini-chip" style={{ background: "var(--meco-soft-blue)", border: "1px solid var(--meco-blue)" }}>
                  <span style={{ color: "var(--meco-blue)" }}>Open jobs</span>
                  <strong style={{ color: "var(--text-title)" }}>{printItems.length}</strong>
                </div>
              </div>
              <button
                className="primary-action"
                onClick={() => openCreateManufacturingModal("3d-print")}
                type="button"
              >
                Add print job
              </button>
            </div>
          </div>
          <div className="table-shell">
            <div className="ops-table ops-table-header manufacturing-table" style={{ gridTemplateColumns: mfgGridTemplate, borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)" }}>
              <span style={{ textAlign: "left" }}>Part</span>
              {mfgMaterial === "all" && <span>Material</span>}
              <span>Qty</span>
              <span>Batch</span>
              <span>Due</span>
              {mfgStatus === "all" && <span>Status</span>}
              <span>Mentor</span>
            </div>
            {filteredPrints.map((item) => (
              <button
                className="ops-table ops-row manufacturing-table ops-button-row"
                key={item.id}
                onClick={() => openEditManufacturingModal(item)}
                style={{ gridTemplateColumns: mfgGridTemplate, borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)", background: "var(--bg-row-alt)", marginBottom: "1px" }}
                type="button"
              >
                <span className="queue-title" style={{ textAlign: "left" }}>
                  {renderItemMeta(item, membersById, subsystemsById)}
                </span>
                {mfgMaterial === "all" && <span style={{ color: "var(--text-copy)" }}>{item.material}</span>}
                <span style={{ color: "var(--text-copy)" }}>{item.quantity}</span>
                <span style={{ color: "var(--text-copy)" }}>{item.batchLabel ?? "Unbatched"}</span>
                <span style={{ color: "var(--text-copy)" }}>{formatDate(item.dueDate)}</span>
                {mfgStatus === "all" && <span style={getPillStyle(item.status)}>{item.status.replace("-", " ")}</span>}
                <span style={{ color: "var(--text-copy)" }}>{item.mentorReviewed ? "Reviewed" : "Pending"}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "roster" ? (
        <RosterView
          bootstrap={bootstrap}
          handleCreateMember={handleCreateMember}
          handleDeleteMember={handleDeleteMember}
          handleUpdateMember={handleUpdateMember}
          isAddPersonOpen={isAddPersonOpen}
          isDeletingMember={isDeletingMember}
          isEditPersonOpen={isEditPersonOpen}
          isSavingMember={isSavingMember}
          memberEditDraft={memberEditDraft}
          memberForm={memberForm}
          rosterMentors={rosterMentors}
          selectMember={selectMember}
          selectedMemberId={selectedMemberId}
          setIsAddPersonOpen={setIsAddPersonOpen}
          setIsEditPersonOpen={setIsEditPersonOpen}
          setMemberEditDraft={setMemberEditDraft}
          setMemberForm={setMemberForm}
          students={students}
        />
      ) : null}

      {activeTab === "materials" ? (
        <section className="panel dense-panel" style={{ margin: 0, borderRadius: 0, border: "none", background: "var(--bg-panel)" }}>
          <div className="panel-header compact-header">
            <div>
              <h2 style={{ color: "var(--text-title)" }}>Materials inventory</h2>
              <p className="section-copy" style={{ color: "var(--text-copy)" }}>Tracking materials currently assigned to manufacturing jobs.</p>
            </div>
            <div className="panel-actions">
              {renderSearchInput(materialSearch, setMaterialSearch, "Search materials...")}
            </div>
          </div>
          <div className="table-shell">
            <div className="ops-table ops-table-header" style={{ gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)" }}>
              <span>Material Name</span>
              <span>Job usage</span>
              <span>Status</span>
            </div>
            {filteredMaterials.map((material) => {
              const jobCount = bootstrap.manufacturingItems.filter(i => i.material === material).length;
              return (
                <div
                  className="ops-table ops-row"
                  key={material}
                  style={{ gridTemplateColumns: "1fr 1fr 1fr", padding: "12px 16px", borderBottom: "1px solid var(--border-base)", color: "var(--text-copy)", background: "var(--bg-row-alt)" }}
                >
                  <strong style={{ color: "var(--text-title)" }}>{material}</strong>
                  <span style={{ color: "var(--text-copy)" }}>{jobCount} active jobs</span>
                  <span style={getPillStyle("complete")}>
                    Available
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
