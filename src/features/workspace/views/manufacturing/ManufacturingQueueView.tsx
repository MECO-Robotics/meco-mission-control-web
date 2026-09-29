import { useMemo, useState, type CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { ManufacturingViewTab } from "@/lib/workspaceNavigation";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionIncludes, useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import {
  WorkspaceTopbarControls,
  WorkspaceTopbarZoom,
  buildSingleAddMenuAction,
  buildTopbarSearchProps,
} from "@/features/workspace/shared/topbar";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";
import { ManufacturingKanbanBoard } from "./ManufacturingKanbanBoard";
import { ManufacturingQueueFilters } from "./ManufacturingQueueFilters";
import { ManufacturingSortMenu } from "./ManufacturingSortMenu";
import { sortManufacturingItems, type ManufacturingSortField } from "./manufacturingSort";
import {
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
  const [sortField, setSortField] = useState<ManufacturingSortField>("dueDate");
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
  const sortedItems = useMemo(
    () => sortManufacturingItems(filteredItems, sortField, membersById, subsystemsById),
    [filteredItems, membersById, sortField, subsystemsById],
  );
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
        <WorkspaceTopbarControls
          className="queue-toolbar"
          search={
            <TopbarResponsiveSearch
              {...buildTopbarSearchProps("manufacturing", {
                actions: (
                  <ManufacturingQueueFilters
                    activeCount={activeFilterCount}
                    bootstrap={bootstrap}
                    onMaterialChange={setMaterial}
                    onProcessChange={onProcessFilterChange ? handleProcessFilterChange : undefined}
                    onRequesterChange={setRequester}
                    onStatusChange={setStatus}
                    onSubsystemChange={setSubsystem}
                    processSelection={processFilterSelection}
                    requester={requester}
                    material={material}
                    status={status}
                    subsystem={subsystem}
                    title={title}
                    uniqueMaterials={uniqueMaterials}
                  />
                  <ManufacturingSortMenu onChange={setSortField} sortField={sortField} />
                ),
                ariaLabel: `Search ${title}`,
                onChange: setSearch,
                placeholder: "Search parts...",
                tutorialTarget: tutorialTarget("search-input"),
                value: search,
              })}
            />
          }
          addMenu={
            <WorkspaceTopbarAddMenu
              actions={buildSingleAddMenuAction({
                label: addButtonAriaLabel,
                onSelect: onCreate,
              })}
              ariaLabel={addButtonAriaLabel}
              title={addButtonAriaLabel}
              tutorialTarget={tutorialTarget("create-job-button")}
            />
          }
        >
          <WorkspaceTopbarZoom
            ariaLabel="Manufacturing zoom"
            canZoomIn={manufacturingZoom < TASK_QUEUE_ZOOM_MAX}
            canZoomOut={manufacturingZoom > TASK_QUEUE_ZOOM_MIN}
            decreaseLabel="Zoom out manufacturing"
            increaseLabel="Zoom in manufacturing"
            onZoomIn={() => setManufacturingZoom((current) => clampTaskQueueZoom(current + TASK_QUEUE_ZOOM_STEP))}
            onZoomOut={() => setManufacturingZoom((current) => clampTaskQueueZoom(current - TASK_QUEUE_ZOOM_STEP))}
            toolbarClassName="workspace-topbar-zoom-slot-actions"
            value={formatTaskQueueZoomLabel(manufacturingZoom)}
          />
        </WorkspaceTopbarControls>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>{title}</h2>
        </div>
      </div>

      <KanbanScrollFrame motionClassName={manufacturingFilterMotionClass}>
        <>
          {sortedItems.length === 0 ? (
            <p className="empty-state">{emptyStateMessage}</p>
          ) : (
            <ManufacturingKanbanBoard
              items={sortedItems}
              membersById={membersById}
              onEdit={onEdit}
              onQuickStatusChange={onQuickStatusChange}
              showInHouseDetails={showInHouseColumn}
              showMentorQuickActions={showMentorQuickActions}
              subsystemsById={subsystemsById}
              tutorialTarget={tutorialTargetPrefix ? tutorialTarget : undefined}
            />
          )}
        </>
      </KanbanScrollFrame>
    </section>
  );
}
