import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { PaginationControls, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { SearchToolbarInput } from "@/features/workspace/shared/filters/workspaceSearchToolbarInput";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { MANUFACTURING_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";
import { ManufacturingKanbanBoard } from "./ManufacturingKanbanBoard";

interface ManufacturingQueueViewProps {
  activePersonFilter: FilterSelection;
  addButtonAriaLabel: string;
  bootstrap: BootstrapPayload;
  emptyStateMessage: string;
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

  const tutorialTarget = (suffix: string) =>
    tutorialTargetPrefix ? `${tutorialTargetPrefix}-${suffix}` : undefined;

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{title}</h2>
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
            className="primary-action queue-toolbar-action queue-toolbar-action-round"
            data-tutorial-target={tutorialTarget("create-job-button")}
            onClick={onCreate}
            title="Add"
            type="button"
          >
            <Plus size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      <KanbanScrollFrame motionClassName={manufacturingFilterMotionClass}>
        <>
          {filteredItems.length === 0 ? (
            <p className="empty-state">{emptyStateMessage}</p>
          ) : (
            <ManufacturingKanbanBoard
              items={manufacturingPagination.pageItems}
              membersById={membersById}
              onEdit={onEdit}
              onQuickStatusChange={onQuickStatusChange}
              showInHouseDetails={showInHouseColumn}
              showMentorQuickActions={showMentorQuickActions}
              subsystemsById={subsystemsById}
              tutorialTarget={tutorialTargetPrefix ? tutorialTarget : undefined}
            />
          )}
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
        </>
      </KanbanScrollFrame>
    </section>
  );
}
