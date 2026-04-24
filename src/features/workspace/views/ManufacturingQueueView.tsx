import { useMemo, useState, type CSSProperties } from "react";

import { formatDate } from "../../../lib/appUtils";
import type { BootstrapPayload, ManufacturingItemRecord } from "../../../types";
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
import { MANUFACTURING_STATUS_OPTIONS } from "../shared/workspaceOptions";

interface ManufacturingQueueViewProps {
  activePersonFilter: string;
  addButtonAriaLabel: string;
  bootstrap: BootstrapPayload;
  emptyStateMessage: string;
  filteredDescription: string;
  items: ManufacturingItemRecord[];
  membersById: MembersById;
  onCreate: () => void;
  onEdit: (item: ManufacturingItemRecord) => void;
  subsystemsById: SubsystemsById;
  title: string;
}

export function ManufacturingQueueView({
  activePersonFilter,
  addButtonAriaLabel,
  bootstrap,
  emptyStateMessage,
  filteredDescription,
  items,
  membersById,
  onCreate,
  onEdit,
  subsystemsById,
  title,
}: ManufacturingQueueViewProps) {
  const [search, setSearch] = useState("");
  const [subsystem, setSubsystem] = useState("all");
  const [requester, setRequester] = useState("all");
  const [status, setStatus] = useState("all");
  const [material, setMaterial] = useState("all");

  const uniqueMaterials = useMemo(() => {
    const materials =
      bootstrap.materials.length > 0
        ? bootstrap.materials.map((item) => item.name)
        : items.map((item) => item.material);

    return Array.from(new Set(materials))
      .filter(Boolean)
      .sort()
      .map((value) => ({ id: value, name: value }));
  }, [bootstrap.materials, items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
      const matchesSubsystem = subsystem === "all" || item.subsystemId === subsystem;
      const matchesRequester = requester === "all" || item.requestedById === requester;
      const matchesStatus = status === "all" || item.status === status;
      const matchesMaterial = material === "all" || item.material === material;

      return matchesSearch && matchesSubsystem && matchesRequester && matchesStatus && matchesMaterial;
    });
  }, [items, material, requester, search, status, subsystem]);

  const gridTemplate = [
    "minmax(200px, 2.5fr)",
    material === "all" ? "1fr" : null,
    "0.6fr",
    "1fr",
    "1fr",
    status === "all" ? "1fr" : null,
    "1fr",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{title}</h2>
          <p className="section-copy filter-copy">
            {activePersonFilter === "all" ? filteredDescription : filteredDescription}
          </p>
        </div>
        <div className="panel-actions filter-toolbar queue-toolbar">
          <SearchToolbarInput
            ariaLabel={`Search ${title}`}
            onChange={setSearch}
            placeholder="Search parts..."
            value={search}
          />

          <FilterDropdown
            allLabel="All subsystems"
            ariaLabel={`Filter ${title} by subsystem`}
            icon={<IconManufacturing />}
            onChange={setSubsystem}
            options={bootstrap.subsystems}
            value={subsystem}
          />

          <FilterDropdown
            allLabel="All requesters"
            ariaLabel={`Filter ${title} by requester`}
            icon={<IconPerson />}
            onChange={setRequester}
            options={bootstrap.members}
            value={requester}
          />

          <FilterDropdown
            allLabel="All materials"
            ariaLabel={`Filter ${title} by material`}
            icon={<IconManufacturing />}
            onChange={setMaterial}
            options={uniqueMaterials}
            value={material}
          />

          <FilterDropdown
            allLabel="All statuses"
            ariaLabel={`Filter ${title} by status`}
            icon={<IconTasks />}
            onChange={setStatus}
            options={MANUFACTURING_STATUS_OPTIONS}
            value={status}
          />

          <button
            aria-label={addButtonAriaLabel}
            className="primary-action queue-toolbar-action"
            onClick={onCreate}
            title="Add"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div
          className="ops-table ops-table-header manufacturing-table"
          style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
        >
          <span>Part</span>
          {material === "all" ? <span>Material</span> : null}
          <span>Qty</span>
          <span>Batch</span>
          <span>Due</span>
          {status === "all" ? <span>Status</span> : null}
          <span>Mentor</span>
        </div>

        {filteredItems.map((item) => (
          <button
            className="ops-table ops-row manufacturing-table ops-button-row editable-hover-target editable-hover-target-row"
            key={item.id}
            onClick={() => onEdit(item)}
            style={{ "--workspace-grid-template": gridTemplate } as CSSProperties}
            type="button"
          >
            <span className="queue-title table-cell table-cell-primary" data-label="Part">
              <RequestedItemMeta item={item} membersById={membersById} subsystemsById={subsystemsById} />
            </span>
            {material === "all" ? <TableCell label="Material">{item.material}</TableCell> : null}
            <TableCell label="Qty">{item.quantity}</TableCell>
            <TableCell label="Batch">{item.batchLabel ?? "Unbatched"}</TableCell>
            <TableCell label="Due">{formatDate(item.dueDate)}</TableCell>
            {status === "all" ? (
              <TableCell label="Status" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(item.status)}>{item.status.replace("-", " ")}</span>
              </TableCell>
            ) : null}
            <TableCell label="Mentor">{item.mentorReviewed ? "Reviewed" : "Pending"}</TableCell>
            <EditableHoverIndicator />
          </button>
        ))}

        {filteredItems.length === 0 ? <p className="empty-state">{emptyStateMessage}</p> : null}
      </div>
    </section>
  );
}
