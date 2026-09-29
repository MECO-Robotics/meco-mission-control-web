import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MaterialRecord } from "@/types/recordsInventory";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import { IconManufacturing, IconTasks } from "@/components/shared/Icons";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceEmptyState, WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { EditableHoverIndicator, PaginationControls, TableCell, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import {
  WorkspaceTopbarControls,
  buildSingleAddMenuAction,
  buildTopbarSearchProps,
} from "@/features/workspace/shared/topbar";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/model/workspaceTypes";
import { MATERIAL_CATEGORY_OPTIONS, MATERIAL_STOCK_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import {
  filterMaterialInventory,
  isMaterialBelowReorder,
  sortMaterialInventory,
  type MaterialSortDirection,
  type MaterialSortField,
} from "./materialsInventoryModel";

interface MaterialsViewProps {
  bootstrap: BootstrapPayload;
  openCreateMaterialModal: () => void;
  openEditMaterialModal: (item: MaterialRecord) => void;
}

const MATERIALS_GRID_TEMPLATE = "minmax(220px, 2.3fr) 0.75fr 1.05fr 1fr 1fr 0.8fr";

function SortableMaterialHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  children,
}: {
  label: string;
  field: MaterialSortField;
  sortField: MaterialSortField | null;
  sortDirection: MaterialSortDirection;
  onSort: (field: MaterialSortField) => void;
  children?: ReactNode;
}) {
  const isSorted = sortField === field;
  const directionLabel = isSorted ? sortDirection : "ascending";

  return (
    <span
      aria-sort={isSorted ? sortDirection : "none"}
      className="table-column-header-cell"
      role="columnheader"
    >
      <button
        aria-label={`Sort by ${label} ${directionLabel}`}
        className="table-sort-button"
        onClick={() => onSort(field)}
        type="button"
      >
        <span className="table-column-title">{label}</span>
        <span aria-hidden="true" className="table-sort-arrow">
          {isSorted ? (sortDirection === "ascending" ? "↑" : "↓") : "↕"}
        </span>
      </button>
      {children}
    </span>
  );
}

export function MaterialsView({
  bootstrap,
  openCreateMaterialModal,
  openEditMaterialModal,
}: MaterialsViewProps) {
  const [search, setSearch] = useState("");
  const [name, setName] = useState<FilterSelection>([]);
  const [category, setCategory] = useState<FilterSelection>([]);
  const [quantity, setQuantity] = useState<FilterSelection>([]);
  const [location, setLocation] = useState<FilterSelection>([]);
  const [vendor, setVendor] = useState<FilterSelection>([]);
  const [stock, setStock] = useState<FilterSelection>([]);
  const [sortField, setSortField] = useState<MaterialSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<MaterialSortDirection>("ascending");

  const columnOptions = useMemo(() => {
    const uniqueOptions = (getValue: (material: MaterialRecord) => string): DropdownOption[] =>
      [...new Set(bootstrap.materials.map(getValue))]
        .sort((left, right) => left.localeCompare(right))
        .map((value) => ({ id: value, name: value }));

    return {
      name: uniqueOptions((material) => material.name),
      quantity: uniqueOptions((material) => `${material.onHandQuantity} / ${material.reorderPoint}`),
      location: uniqueOptions((material) => material.location || "Unassigned"),
      vendor: uniqueOptions((material) => material.vendor || "Unknown"),
    };
  }, [bootstrap.materials]);

  const filteredMaterials = useMemo(() => {
    return filterMaterialInventory(bootstrap.materials, {
      search,
      name,
      category,
      quantity,
      location,
      vendor,
      stock,
    });
  }, [bootstrap.materials, category, location, name, quantity, search, stock, vendor]);
  const sortedMaterials = useMemo(
    () => sortField ? sortMaterialInventory(filteredMaterials, sortField, sortDirection) : filteredMaterials,
    [filteredMaterials, sortDirection, sortField],
  );
  const materialPagination = useWorkspacePagination(sortedMaterials);
  const materialsFilterMotionClass = useFilterChangeMotionClass([
    category,
    location,
    name,
    quantity,
    search,
    stock,
    vendor,
  ]);
  const hasMaterialFilters =
    search.trim().length > 0 ||
    name.length > 0 ||
    category.length > 0 ||
    quantity.length > 0 ||
    location.length > 0 ||
    vendor.length > 0 ||
    stock.length > 0;
  const handleSort = (field: MaterialSortField) => {
    if (field === sortField) {
      setSortDirection((current) => current === "ascending" ? "descending" : "ascending");
      return;
    }
    setSortField(field);
    setSortDirection("ascending");
  };

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <AppTopbarSlotPortal slot="controls">
        <WorkspaceTopbarControls className="materials-toolbar">
          <TopbarResponsiveSearch
            {...buildTopbarSearchProps("materials", {
              actions: (
                <CompactFilterMenu
                  activeCount={[name, category, quantity, location, vendor, stock].filter((value) => value.length > 0).length}
                  ariaLabel="Material filters"
                  buttonLabel="Filters"
                  className="materials-filter-menu"
                  items={[
                    {
                      label: "Category",
                      content: (
                        <FilterDropdown
                          allLabel="All categories"
                          ariaLabel="Filter materials by category"
                          className="task-queue-filter-menu-submenu"
                          icon={<IconManufacturing />}
                          onChange={setCategory}
                          options={MATERIAL_CATEGORY_OPTIONS}
                          value={category}
                        />
                      ),
                    },
                    {
                      label: "Stock",
                      content: (
                        <FilterDropdown
                          allLabel="All stock"
                          ariaLabel="Filter materials by stock level"
                          className="task-queue-filter-menu-submenu"
                          icon={<IconTasks />}
                          onChange={setStock}
                          options={MATERIAL_STOCK_OPTIONS}
                          value={stock}
                        />
                      ),
                    },
                   ]}
                  />
                ),
               ariaLabel: "Search materials",
              onChange: setSearch,
              placeholder: "Search materials...",
              tutorialTarget: "materials-search-input",
              value: search,
            })}
          />
          <WorkspaceTopbarAddMenu
            actions={buildSingleAddMenuAction({ label: "Add material", onSelect: openCreateMaterialModal })}
            ariaLabel="Add material"
            title="Add material"
            tutorialTarget="create-material-button"
          />
        </WorkspaceTopbarControls>
      </AppTopbarSlotPortal>

      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Materials manager</h2>
        </div>
      </div>

      <div className={`table-shell ${materialsFilterMotionClass}`}>
        <div
          className="ops-table ops-table-header materials-table"
          style={{ "--workspace-grid-template": MATERIALS_GRID_TEMPLATE } as CSSProperties}
        >
          <SortableMaterialHeader field="name" label="Material" onSort={handleSort} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All materials"
              ariaLabel="Filter materials by name"
              onChange={setName}
              options={columnOptions.name}
              value={name}
            />
          </SortableMaterialHeader>
          <SortableMaterialHeader field="category" label="Category" onSort={handleSort} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All categories"
              ariaLabel="Filter materials by category"
              onChange={setCategory}
              options={MATERIAL_CATEGORY_OPTIONS}
              value={category}
            />
          </SortableMaterialHeader>
          <SortableMaterialHeader field="quantity" label="On hand / reorder" onSort={handleSort} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All quantities"
              ariaLabel="Filter materials by on-hand and reorder quantities"
              onChange={setQuantity}
              options={columnOptions.quantity}
              value={quantity}
            />
          </SortableMaterialHeader>
          <SortableMaterialHeader field="location" label="Location" onSort={handleSort} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All locations"
              ariaLabel="Filter materials by location"
              onChange={setLocation}
              options={columnOptions.location}
              value={location}
            />
          </SortableMaterialHeader>
          <SortableMaterialHeader field="vendor" label="Vendor" onSort={handleSort} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All vendors"
              ariaLabel="Filter materials by vendor"
              onChange={setVendor}
              options={columnOptions.vendor}
              value={vendor}
            />
          </SortableMaterialHeader>
          <SortableMaterialHeader field="status" label="Status" onSort={handleSort} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All stock"
              ariaLabel="Filter materials by stock level"
              onChange={setStock}
              options={MATERIAL_STOCK_OPTIONS}
              value={stock}
            />
          </SortableMaterialHeader>
        </div>

        {materialPagination.pageItems.map((material) => {
          const isBelowReorder = isMaterialBelowReorder(material);
          const isLow = material.onHandQuantity <= material.reorderPoint;
          const materialSubtitle =
            material.notes.trim().length > 0
              ? material.notes
              : `Vendor: ${material.vendor || "Unknown"} | Location: ${material.location || "Unassigned"}`;

          return (
            <button
              className="ops-table ops-row materials-table editable-hover-target editable-hover-target-row"
              data-tutorial-target="edit-material-row"
              key={material.id}
              onClick={() => openEditMaterialModal(material)}
              style={{ "--workspace-grid-template": MATERIALS_GRID_TEMPLATE } as CSSProperties}
              title={`Edit ${material.name}`}
              type="button"
            >
              <span className="queue-title table-cell table-cell-primary material-primary-cell" data-label="Material">
                <span className="requested-item-meta">
                  <strong className="requested-item-title">{material.name}</strong>
                  <small className="requested-item-subtitle" title={materialSubtitle}>
                    {materialSubtitle}
                  </small>
                </span>
              </span>
              <TableCell label="Category">{material.category}</TableCell>
              <TableCell label="On hand / reorder" valueClassName={isBelowReorder ? "materials-stock-below-reorder" : undefined}>
                {material.onHandQuantity} / {material.reorderPoint}
              </TableCell>
              <TableCell label="Location">{material.location || "Unassigned"}</TableCell>
              <TableCell label="Vendor">{material.vendor || "Unknown"}</TableCell>
              <TableCell label="Status" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(isLow ? "critical" : "complete")}>
                  {isLow ? "Low stock" : "Stock OK"}
                </span>
              </TableCell>
              <EditableHoverIndicator />
            </button>
          );
        })}

        {filteredMaterials.length === 0 ? (
          <WorkspaceEmptyState
            actionLabel={hasMaterialFilters ? undefined : "Add material"}
            onAction={hasMaterialFilters ? undefined : openCreateMaterialModal}
            reason={
              hasMaterialFilters
                ? "The current search or filters hide every material record in this scope."
                : "No stock, vendor, location, or reorder threshold records have been added for this workspace yet."
            }
            title={
              hasMaterialFilters
                ? "No materials match these filters"
                : "Manage consumable and raw material inventory here"
            }
          />
        ) : null}
        <PaginationControls
          label="materials"
          onPageChange={materialPagination.setPage}
          onPageSizeChange={materialPagination.setPageSize}
          page={materialPagination.page}
          pageSize={materialPagination.pageSize}
          pageSizeOptions={materialPagination.pageSizeOptions}
          rangeEnd={materialPagination.rangeEnd}
          rangeStart={materialPagination.rangeStart}
          totalItems={materialPagination.totalItems}
          totalPages={materialPagination.totalPages}
        />
      </div>
    </section>
  );
}
