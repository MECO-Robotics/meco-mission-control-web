import { useMemo, useState, type CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { ManufacturingViewTab } from "@/lib/workspaceNavigation";
import {
  IconManufacturing,
  IconPerson,
  IconSearchMinus,
  IconSearchPlus,
  IconTasks,
} from "@/components/shared/Icons";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { PaginationControls, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { MANUFACTURING_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";
import { ManufacturingKanbanBoard } from "./ManufacturingKanbanBoard";
import {
  MANUFACTURING_PROCESS_FILTER_OPTIONS,
  filterManufacturingItemsByProcessView,
} from "./manufacturingProcessFilter";
import {
  clampTaskQueueZoom,
  formatTaskQueueZoomLabel,
  TASK_QUEUE_ZOOM_MAX,
  TASK_QUEUE_ZOOM_MIN,
  TASK_QUEUE_ZOOM_STEP,
} from "../taskQueue/taskQueueViewState";

interface ManufacturingQueueViewProps {
  activePersonFilter: FilterSelection;
  addButtonAriaLabel: string;
  bootstrap: BootstrapPayload;
  emptyStateMessage: string;
  items: ManufacturingItemRecord[];
  membersById: MembersById;
  onCreate: () => void;
  onEdit: (item: ManufacturingItemRecord) => void;
  onProcessFilterChange?: (value: ManufacturingViewTab) => void;
  onQuickStatusChange?: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>;
  processFilterValue?: ManufacturingViewTab;
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
  onProcessFilterChange,
  onQuickStatusChange,
  processFilterValue,
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
  const [manufacturingZoom, setManufacturingZoom] = useState(1);
  const processFilterSelection =
    processFilterValue && processFilterValue !== "all" ? [processFilterValue] : [];

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
    const processItems = processFilterValue
      ? filterManufacturingItemsByProcessView(items, processFilterValue)
      : items;

    return processItems.filter((item) => {
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
  }, [activePersonFilter, items, material, processFilterValue, requester, search, status, subsystem]);
  const manufacturingPagination = useWorkspacePagination(filteredItems);
  const activeFilterCount = [
    processFilterSelection,
    subsystem,
    requester,
    material,
    status,
  ].filter((value) => value.length > 0).length;
  const manufacturingFilterMotionClass = useFilterChangeMotionClass([
    activePersonFilter,
    material,
    processFilterValue,
    requester,
    search,
    status,
    subsystem,
  ]);

  const tutorialTarget = (suffix: string) =>
    tutorialTargetPrefix ? `${tutorialTargetPrefix}-${suffix}` : undefined;
  const manufacturingBoardStyle = {
    "--task-queue-zoom": manufacturingZoom,
    "--task-queue-board-column-width": `calc(15.5rem * ${manufacturingZoom})`,
  } as CSSProperties;
  const handleProcessFilterChange = (value: FilterSelection) => {
    const [nextValue] = value;
    onProcessFilterChange?.(
      nextValue === "cnc" || nextValue === "prints" || nextValue === "fabrication"
        ? nextValue
        : "all",
    );
  };

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`} style={manufacturingBoardStyle}>
      <AppTopbarSlotPortal slot="controls">
        <div className="panel-actions filter-toolbar queue-toolbar">
          <TopbarResponsiveSearch
            actions={
              <CompactFilterMenu
                activeCount={activeFilterCount}
                ariaLabel={`${title} filters`}
                buttonLabel="Filters"
                className="materials-filter-menu"
                items={[
                  {
                    hidden: !onProcessFilterChange,
                    label: "Process",
                    content: (
                      <FilterDropdown
                        allLabel="All processes"
                        ariaLabel={`Filter ${title} by process`}
                        className="task-queue-filter-menu-submenu manufacturing-process-filter"
                        icon={<IconManufacturing />}
                        onChange={handleProcessFilterChange}
                        options={MANUFACTURING_PROCESS_FILTER_OPTIONS}
                        selectedAllLabel="All"
                        singleSelect
                        value={processFilterSelection}
                      />
                    ),
                  },
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
                        selectedAllLabel="All"
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
                        selectedAllLabel="All"
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
                        selectedAllLabel="All"
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
                        selectedAllLabel="All"
                        value={status}
                      />
                    ),
                  },
                ]}
              />
            }
            ariaLabel={`Search ${title}`}
            compactPlaceholder="Search"
            onChange={setSearch}
            placeholder="Search parts..."
            tutorialTarget={tutorialTarget("search-input")}
            value={search}
          />
          <div className="task-queue-toolbar-inline-actions">
            <div aria-label="Manufacturing zoom" className="task-queue-zoom-controls" role="group">
              <button
                aria-label="Zoom out manufacturing"
                className="icon-button task-queue-zoom-button"
                disabled={manufacturingZoom <= TASK_QUEUE_ZOOM_MIN}
                onClick={() =>
                  setManufacturingZoom((current) => clampTaskQueueZoom(current - TASK_QUEUE_ZOOM_STEP))
                }
                title="Zoom out manufacturing"
                type="button"
              >
                <IconSearchMinus />
              </button>
              <span className="task-queue-zoom-label">{formatTaskQueueZoomLabel(manufacturingZoom)}</span>
              <button
                aria-label="Zoom in manufacturing"
                className="icon-button task-queue-zoom-button"
                disabled={manufacturingZoom >= TASK_QUEUE_ZOOM_MAX}
                onClick={() =>
                  setManufacturingZoom((current) => clampTaskQueueZoom(current + TASK_QUEUE_ZOOM_STEP))
                }
                title="Zoom in manufacturing"
                type="button"
              >
                <IconSearchPlus />
              </button>
            </div>
          </div>
          <WorkspaceTopbarAddMenu
            actions={[{ label: addButtonAriaLabel, onSelect: onCreate }]}
            ariaLabel={addButtonAriaLabel}
            title={addButtonAriaLabel}
            tutorialTarget={tutorialTarget("create-job-button")}
          />
        </div>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{title}</h2>
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
