import { useMemo, useState, type CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MaterialRecord } from "@/types/recordsInventory";
import { AppTopbarSlotPortal } from "@/components/layout/AppTopbarSlotPortal";
import { WorkspaceEmptyState, WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { ColumnFilterDropdown } from "@/features/workspace/shared/filters/ColumnFilterDropdown";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { EditableHoverIndicator, PaginationControls, TableCell, useWorkspacePagination } from "@/features/workspace/shared/table/workspaceTableChrome";
import { useFilterChangeMotionClass } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TopbarResponsiveSearch } from "@/features/workspace/shared/filters/TopbarResponsiveSearch";
import {
  WorkspaceTopbarControls,
  buildSingleAddMenuAction,
  buildTopbarSearchProps,
} from "@/features/workspace/shared/topbar";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { ResourceRecordCell } from "@/features/workspace/shared/resourceList/ResourceRecordCell";
import { ResourceColumnHeader } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";
import { ResourceSortMenu } from "@/features/workspace/shared/resourceList/ResourceSortMenu";
import { getResourceFilterOptions } from "@/features/workspace/shared/resourceList/resourceListModel";
import { createResourceFilterMenuItem } from "@/features/workspace/shared/resourceList/ResourceFilterMenuItem";
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
  const [sortField, setSortField] = useState<MaterialSortField>("name");
  const [sortDirection, setSortDirection] = useState<MaterialSortDirection>("ascending");

  const columnOptions = useMemo(() => {
    const uniqueOptions = (getValue: (material: MaterialRecord) => string) =>
      getResourceFilterOptions(bootstrap.materials.map(getValue));

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
    () => sortMaterialInventory(filteredMaterials, sortField, sortDirection),
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
                <>
                  <CompactFilterMenu
                    activeCount={[name, category, quantity, location, vendor, stock].filter((value) => value.length > 0).length}
                    ariaLabel="Material filters"
                    buttonLabel="Filters"
                    className="materials-filter-menu"
                    items={[
                      createResourceFilterMenuItem({ allLabel: "All materials", ariaLabel: "Filter materials by name", label: "Material", onChange: setName, options: columnOptions.name, value: name }),
                      createResourceFilterMenuItem({ allLabel: "All categories", ariaLabel: "Filter materials by category", label: "Category", onChange: setCategory, options: MATERIAL_CATEGORY_OPTIONS, value: category }),
                      createResourceFilterMenuItem({ allLabel: "All quantities", ariaLabel: "Filter materials by on-hand and reorder quantities", label: "On hand / reorder", onChange: setQuantity, options: columnOptions.quantity, value: quantity }),
                      createResourceFilterMenuItem({ allLabel: "All locations", ariaLabel: "Filter materials by location", label: "Location", onChange: setLocation, options: columnOptions.location, value: location }),
                      createResourceFilterMenuItem({ allLabel: "All vendors", ariaLabel: "Filter materials by vendor", label: "Vendor", onChange: setVendor, options: columnOptions.vendor, value: vendor }),
                      createResourceFilterMenuItem({ allLabel: "All stock", ariaLabel: "Filter materials by stock level", label: "Status", onChange: setStock, options: MATERIAL_STOCK_OPTIONS, value: stock }),
                    ]}
                  />
                  <ResourceSortMenu
                    direction={sortDirection}
                    field={sortField}
                    label="materials"
                    onDirectionChange={setSortDirection}
                    onFieldChange={(field) => setSortField(field as MaterialSortField)}
                    options={[{ label: "Material", value: "name" }, { label: "Category", value: "category" }, { label: "On hand / reorder", value: "quantity" }, { label: "Location", value: "location" }, { label: "Vendor", value: "vendor" }, { label: "Status", value: "status" }]}
                  />
                </>
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
          <ResourceColumnHeader field="name" label="Material" onSort={(field) => handleSort(field as MaterialSortField)} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All materials"
              ariaLabel="Filter materials by name"
              onChange={setName}
              options={columnOptions.name}
              value={name}
            />
          </ResourceColumnHeader>
          <ResourceColumnHeader field="category" label="Category" onSort={(field) => handleSort(field as MaterialSortField)} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All categories"
              ariaLabel="Filter materials by category"
              onChange={setCategory}
              options={MATERIAL_CATEGORY_OPTIONS}
              value={category}
            />
          </ResourceColumnHeader>
          <ResourceColumnHeader field="quantity" label="On hand / reorder" onSort={(field) => handleSort(field as MaterialSortField)} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All quantities"
              ariaLabel="Filter materials by on-hand and reorder quantities"
              onChange={setQuantity}
              options={columnOptions.quantity}
              value={quantity}
            />
          </ResourceColumnHeader>
          <ResourceColumnHeader field="location" label="Location" onSort={(field) => handleSort(field as MaterialSortField)} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All locations"
              ariaLabel="Filter materials by location"
              onChange={setLocation}
              options={columnOptions.location}
              value={location}
            />
          </ResourceColumnHeader>
          <ResourceColumnHeader field="vendor" label="Vendor" onSort={(field) => handleSort(field as MaterialSortField)} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All vendors"
              ariaLabel="Filter materials by vendor"
              onChange={setVendor}
              options={columnOptions.vendor}
              value={vendor}
            />
          </ResourceColumnHeader>
          <ResourceColumnHeader field="status" label="Status" onSort={(field) => handleSort(field as MaterialSortField)} sortDirection={sortDirection} sortField={sortField}>
            <ColumnFilterDropdown
              allLabel="All stock"
              ariaLabel="Filter materials by stock level"
              onChange={setStock}
              options={MATERIAL_STOCK_OPTIONS}
              value={stock}
            />
          </ResourceColumnHeader>
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
              <ResourceRecordCell label="Material" photoUrl={material.photoUrl} name={material.name} subtitle={materialSubtitle} />
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
