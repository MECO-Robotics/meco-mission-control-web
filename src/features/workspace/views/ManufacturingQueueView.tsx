import {
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import { formatDate } from "@/lib/appUtils";
import type { BootstrapPayload, ManufacturingItemRecord } from "@/types";
import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared";
import {
  ColumnFilterDropdown,
  CompactFilterMenu,
  EditableHoverIndicator,
  type FilterSelection,
  FilterDropdown,
  PaginationControls,
  RequestedItemMeta,
  SearchToolbarInput,
  TableCell,
  filterSelectionIncludes,
  useFilterChangeMotionClass,
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
  onQuickStatusChange?: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>;
  showMentorQuickActions?: boolean;
  showInHouseColumn?: boolean;
  subsystemsById: SubsystemsById;
  title: string;
  tutorialTargetPrefix?: string;
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
  onQuickStatusChange,
  showMentorQuickActions = false,
  showInHouseColumn = false,
  subsystemsById,
  title,
  tutorialTargetPrefix,
}: ManufacturingQueueViewProps) {
  const [search, setSearch] = useState("");
  const [subsystem, setSubsystem] = useState<FilterSelection>([]);
  const [requester, setRequester] = useState<FilterSelection>([]);
  const [status, setStatus] = useState<FilterSelection>([]);
  const [material, setMaterial] = useState<FilterSelection>([]);
  const [pendingQuickActionKey, setPendingQuickActionKey] = useState<string | null>(null);

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
  const manufacturingFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    material,
    requester,
    search,
    status,
    subsystem,
  ]);

  const gridTemplate = showInHouseColumn
    ? "minmax(200px, 2.5fr) 1fr 0.6fr 1fr 1fr 1fr 1fr 1fr"
    : "minmax(200px, 2.5fr) 1fr 0.6fr 1fr 1fr 1fr 1fr";
  const canShowMentorQuickActions = Boolean(showMentorQuickActions && onQuickStatusChange);

  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    item: ManufacturingItemRecord,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEdit(item);
    }
  };

  const handleQuickStatusChange = async (
    event: MouseEvent<HTMLButtonElement>,
    item: ManufacturingItemRecord,
    nextStatus: ManufacturingItemRecord["status"],
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!onQuickStatusChange) {
      return;
    }

    const actionKey = `${item.id}:${nextStatus}`;
    if (pendingQuickActionKey) {
      return;
    }

    setPendingQuickActionKey(actionKey);
    try {
      await onQuickStatusChange(item, nextStatus);
    } finally {
      setPendingQuickActionKey(null);
    }
  };

  const tutorialTarget = (suffix: string) =>
    tutorialTargetPrefix ? `${tutorialTargetPrefix}-${suffix}` : undefined;

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
          <div data-tutorial-target={tutorialTarget("search-input")}>
            <SearchToolbarInput
              ariaLabel={`Search ${title}`}
              onChange={setSearch}
              placeholder="Search parts..."
              value={search}
            />
          </div>

          <CompactFilterMenu
            activeCount={[subsystem, requester, material, status].filter((value) => value.length > 0).length}
            ariaLabel={`${title} filters`}
            buttonLabel="Filters"
            className="materials-filter-menu"
            items={[
              {
                label: "Subsystem",
                content: (
                  <FilterDropdown
                    allLabel="All subsystems"
                    ariaLabel={`Filter ${title} by subsystem`}
                    className="task-queue-filter-menu-submenu"
                    icon={<IconManufacturing />}
                    onChange={setSubsystem}
                    options={bootstrap.subsystems}
                    value={subsystem}
                  />
                ),
              },
              {
                label: "Requester",
                content: (
                  <FilterDropdown
                    allLabel="All requesters"
                    ariaLabel={`Filter ${title} by requester`}
                    className="task-queue-filter-menu-submenu"
                    icon={<IconPerson />}
                    onChange={setRequester}
                    options={bootstrap.members}
                    value={requester}
                  />
                ),
              },
              {
                label: "Material",
                content: (
                  <FilterDropdown
                    allLabel="All materials"
                    ariaLabel={`Filter ${title} by material`}
                    className="task-queue-filter-menu-submenu"
                    icon={<IconManufacturing />}
                    onChange={setMaterial}
                    options={uniqueMaterials}
                    value={material}
                  />
                ),
              },
              {
                label: "Status",
                content: (
                  <FilterDropdown
                    allLabel="All statuses"
                    ariaLabel={`Filter ${title} by status`}
                    className="task-queue-filter-menu-submenu"
                    icon={<IconTasks />}
                    onChange={setStatus}
                    options={MANUFACTURING_STATUS_OPTIONS}
                    value={status}
                  />
                ),
              },
            ]}
          />

          <button
            aria-label={addButtonAriaLabel}
            className="primary-action queue-toolbar-action"
            data-tutorial-target={tutorialTarget("create-job-button")}
            onClick={onCreate}
            title="Add"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className={`table-shell ${manufacturingFilterMotionClass}`}>
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
          {showInHouseColumn ? <span>Source</span> : null}
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

        {manufacturingPagination.pageItems.map((item) => {
          const approveActionKey = `${item.id}:approved`;
          const completeActionKey = `${item.id}:complete`;
          const isApprovePending = pendingQuickActionKey === approveActionKey;
          const isCompletePending = pendingQuickActionKey === completeActionKey;
          const isAnyActionPending = Boolean(pendingQuickActionKey);

          const rowContent = (
            <>
              <span className="queue-title table-cell table-cell-primary" data-label="Part">
                <RequestedItemMeta item={item} membersById={membersById} subsystemsById={subsystemsById} />
              </span>
              <TableCell label="Material">{item.material}</TableCell>
              <TableCell label="Qty">{item.quantity}</TableCell>
              <TableCell label="Batch">{item.batchLabel ?? "Unbatched"}</TableCell>
              {showInHouseColumn ? (
                <TableCell label="Source">{item.inHouse ? "In-house" : "Outsourced"}</TableCell>
              ) : null}
              <TableCell label="Due">{formatDate(item.dueDate)}</TableCell>
              <TableCell label="Status" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(item.status)}>{item.status.replace("-", " ")}</span>
              </TableCell>
              <TableCell label="Mentor">
                {canShowMentorQuickActions ? (
                  <span
                    style={{
                      alignItems: "center",
                      display: "inline-flex",
                      flexWrap: "wrap",
                      gap: "0.35rem",
                    }}
                  >
                    <span>{item.mentorReviewed ? "Reviewed" : "Pending"}</span>
                    <button
                      className="icon-button"
                      data-tutorial-target={tutorialTarget("approve-job-button")}
                      disabled={isAnyActionPending || item.status !== "requested"}
                      onClick={(event) => handleQuickStatusChange(event, item, "approved")}
                      style={{ padding: "0.15rem 0.4rem" }}
                      type="button"
                    >
                      {isApprovePending ? "Approving..." : "Approve"}
                    </button>
                    <button
                      className="icon-button"
                      data-tutorial-target={tutorialTarget("complete-job-button")}
                      disabled={isAnyActionPending || item.status === "complete"}
                      onClick={(event) => handleQuickStatusChange(event, item, "complete")}
                      style={{ padding: "0.15rem 0.4rem" }}
                      type="button"
                    >
                      {isCompletePending ? "Completing..." : "Complete"}
                    </button>
                  </span>
                ) : (
                  item.mentorReviewed ? "Reviewed" : "Pending"
                )}
              </TableCell>
              <EditableHoverIndicator />
            </>
          );

          const rowStyle = {
            "--workspace-grid-template": gridTemplate,
          } as CSSProperties;
          const rowClassName =
            "ops-table ops-row manufacturing-table ops-button-row editable-hover-target editable-hover-target-row";

          return canShowMentorQuickActions ? (
            <div
              className={rowClassName}
              data-tutorial-target={tutorialTarget("edit-job-row")}
              key={item.id}
              onClick={() => onEdit(item)}
              onKeyDown={(event) => handleRowKeyDown(event, item)}
              role="button"
              style={rowStyle}
              tabIndex={0}
            >
              {rowContent}
            </div>
          ) : (
            <button
              className={rowClassName}
              data-tutorial-target={tutorialTarget("edit-job-row")}
              key={item.id}
              onClick={() => onEdit(item)}
              style={rowStyle}
              type="button"
            >
              {rowContent}
            </button>
          );
        })}

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
