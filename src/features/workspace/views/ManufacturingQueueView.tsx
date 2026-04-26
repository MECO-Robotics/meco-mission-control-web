import { useMemo, useState, type CSSProperties } from "react";

import { formatDate } from "@/lib/appUtils";
import type { BootstrapPayload, ManufacturingItemRecord } from "@/types";
import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared";
import {
  ColumnFilterDropdown,
  EditableHoverIndicator,
  type FilterSelection,
  FilterDropdown,
  PaginationControls,
  RequestedItemMeta,
  SearchToolbarInput,
  TableCell,
  filterSelectionIncludes,
  useWorkspacePagination,
} from "@/features/workspace/shared";
import { getStatusPillClassName } from "@/features/workspace/shared";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import { MANUFACTURING_STATUS_OPTIONS } from "@/features/workspace/shared";

interface ManufacturingQueueViewProps {
  activePersonFilter: FilterSelection;
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
  const [subsystem, setSubsystem] = useState<FilterSelection>([]);
  const [requester, setRequester] = useState<FilterSelection>([]);
  const [status, setStatus] = useState<FilterSelection>([]);
  const [material, setMaterial] = useState<FilterSelection>([]);

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
      const matchesSubsystem = filterSelectionIncludes(subsystem, item.subsystemId);
      const matchesRequester = filterSelectionIncludes(requester, item.requestedById);
      const matchesStatus = filterSelectionIncludes(status, item.status);
      const matchesMaterial = filterSelectionIncludes(material, item.material);
      const matchesPerson = filterSelectionIncludes(activePersonFilter, item.requestedById);

      return (
        matchesSearch &&
        matchesSubsystem &&
        matchesRequester &&
        matchesStatus &&
        matchesMaterial &&
        matchesPerson
      );
    });
  }, [activePersonFilter, items, material, requester, search, status, subsystem]);
  const manufacturingPagination = useWorkspacePagination(filteredItems);

  const gridTemplate = "minmax(200px, 2.5fr) 1fr 0.6fr 1fr 1fr 1fr 1fr";

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{title}</h2>
          <p className="section-copy filter-copy">
            {filteredDescription}
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
            className="mobile-filter-control"
            icon={<IconManufacturing />}
            onChange={setSubsystem}
            options={bootstrap.subsystems}
            value={subsystem}
          />

          <FilterDropdown
            allLabel="All requesters"
            ariaLabel={`Filter ${title} by requester`}
            className="mobile-filter-control"
            icon={<IconPerson />}
            onChange={setRequester}
            options={bootstrap.members}
            value={requester}
          />

          <FilterDropdown
            allLabel="All materials"
            ariaLabel={`Filter ${title} by material`}
            className="mobile-filter-control"
            icon={<IconManufacturing />}
            onChange={setMaterial}
            options={uniqueMaterials}
            value={material}
          />

          <FilterDropdown
            allLabel="All statuses"
            ariaLabel={`Filter ${title} by status`}
            className="mobile-filter-control"
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
          <span className="table-column-header-cell">
            <span className="table-column-title">Part</span>
            <ColumnFilterDropdown
              allLabel="All subsystems"
              ariaLabel={`Filter ${title} by subsystem`}
              onChange={setSubsystem}
              options={bootstrap.subsystems}
              value={subsystem}
            />
            <ColumnFilterDropdown
              allLabel="All requesters"
              ariaLabel={`Filter ${title} by requester`}
              onChange={setRequester}
              options={bootstrap.members}
              value={requester}
            />
          </span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Material</span>
            <ColumnFilterDropdown
              allLabel="All materials"
              ariaLabel={`Filter ${title} by material`}
              onChange={setMaterial}
              options={uniqueMaterials}
              value={material}
            />
          </span>
          <span>Qty</span>
          <span>Batch</span>
          <span>Due</span>
          <span className="table-column-header-cell">
            <span className="table-column-title">Status</span>
            <ColumnFilterDropdown
              allLabel="All statuses"
              ariaLabel={`Filter ${title} by status`}
              onChange={setStatus}
              options={MANUFACTURING_STATUS_OPTIONS}
              value={status}
            />
          </span>
          <span>Mentor</span>
        </div>

        {manufacturingPagination.pageItems.map((item) => (
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
            <TableCell label="Material">{item.material}</TableCell>
            <TableCell label="Qty">{item.quantity}</TableCell>
            <TableCell label="Batch">{item.batchLabel ?? "Unbatched"}</TableCell>
            <TableCell label="Due">{formatDate(item.dueDate)}</TableCell>
            <TableCell label="Status" valueClassName="table-cell-pill">
              <span className={getStatusPillClassName(item.status)}>{item.status.replace("-", " ")}</span>
            </TableCell>
            <TableCell label="Mentor">{item.mentorReviewed ? "Reviewed" : "Pending"}</TableCell>
            <EditableHoverIndicator />
          </button>
        ))}

        {filteredItems.length === 0 ? <p className="empty-state">{emptyStateMessage}</p> : null}
        <PaginationControls
          label={title}
          onPageChange={manufacturingPagination.setPage}
          onPageSizeChange={manufacturingPagination.setPageSize}
          page={manufacturingPagination.page}
          pageSize={manufacturingPagination.pageSize}
          pageSizeOptions={manufacturingPagination.pageSizeOptions}
          rangeEnd={manufacturingPagination.rangeEnd}
          rangeStart={manufacturingPagination.rangeStart}
          totalItems={manufacturingPagination.totalItems}
          totalPages={manufacturingPagination.totalPages}
        />
      </div>
    </section>
  );
}




