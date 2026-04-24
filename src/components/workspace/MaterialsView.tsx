import { useMemo, useState, type CSSProperties } from "react";

import type { BootstrapPayload, MaterialRecord } from "../../types";
import { IconManufacturing, IconTasks } from "../shared/Icons";
import {
  EditableHoverIndicator,
  FilterDropdown,
  SearchToolbarInput,
  TableCell,
} from "./WorkspaceViewShared";
import { getStatusPillClassName } from "./workspaceUtils";
import { WORKSPACE_PANEL_CLASS } from "./workspaceTypes";
import { MATERIAL_CATEGORY_OPTIONS, MATERIAL_STOCK_OPTIONS } from "./workspaceOptions";

interface MaterialsViewProps {
  bootstrap: BootstrapPayload;
  openCreateMaterialModal: () => void;
  openEditMaterialModal: (item: MaterialRecord) => void;
}

const MATERIALS_GRID_TEMPLATE = "minmax(180px, 1.8fr) 0.8fr 0.8fr 0.8fr 1fr 1fr 0.8fr 0.6fr";

export function MaterialsView({
  bootstrap,
  openCreateMaterialModal,
  openEditMaterialModal,
}: MaterialsViewProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState("all");

  const filteredMaterials = useMemo(() => {
    return bootstrap.materials.filter((material) => {
      const normalizedSearch = search.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        material.name.toLowerCase().includes(normalizedSearch) ||
        material.vendor.toLowerCase().includes(normalizedSearch) ||
        material.location.toLowerCase().includes(normalizedSearch);
      const matchesCategory = category === "all" || material.category === category;
      const matchesStock =
        stock === "all" ||
        (stock === "low"
          ? material.onHandQuantity <= material.reorderPoint
          : material.onHandQuantity > material.reorderPoint);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [bootstrap.materials, category, search, stock]);

  return (
    <section className={`panel dense-panel ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Materials manager</h2>
          <p className="section-copy">
            Live inventory for stock, reorder thresholds, vendors, and shop locations.
          </p>
        </div>
        <div className="panel-actions filter-toolbar materials-toolbar">
          <SearchToolbarInput
            ariaLabel="Search materials"
            onChange={setSearch}
            placeholder="Search materials..."
            value={search}
          />

          <FilterDropdown
            allLabel="All categories"
            ariaLabel="Filter materials by category"
            icon={<IconManufacturing />}
            onChange={setCategory}
            options={MATERIAL_CATEGORY_OPTIONS}
            value={category}
          />

          <FilterDropdown
            allLabel="All stock"
            ariaLabel="Filter materials by stock level"
            icon={<IconTasks />}
            onChange={setStock}
            options={MATERIAL_STOCK_OPTIONS}
            value={stock}
          />

          <button
            aria-label="Add material"
            className="primary-action queue-toolbar-action"
            onClick={openCreateMaterialModal}
            title="Add material"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div className="table-shell">
        <div
          className="ops-table ops-table-header materials-table"
          style={{ "--workspace-grid-template": MATERIALS_GRID_TEMPLATE } as CSSProperties}
        >
          <span>Material</span>
          <span>Category</span>
          <span>On hand</span>
          <span>Reorder</span>
          <span>Location</span>
          <span>Vendor</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filteredMaterials.map((material) => {
          const isLow = material.onHandQuantity <= material.reorderPoint;

          return (
            <button
              className="ops-table ops-row materials-table editable-action-host"
              key={material.id}
              onClick={() => openEditMaterialModal(material)}
              style={{ "--workspace-grid-template": MATERIALS_GRID_TEMPLATE } as CSSProperties}
              title={`Edit ${material.name}`}
              type="button"
            >
              <TableCell label="Material">
                <strong>{material.name}</strong>
                {material.notes ? <small>{material.notes}</small> : null}
              </TableCell>
              <TableCell label="Category">{material.category}</TableCell>
              <TableCell label="On hand">
                {material.onHandQuantity} {material.unit}
              </TableCell>
              <TableCell label="Reorder">
                {material.reorderPoint} {material.unit}
              </TableCell>
              <TableCell label="Location">{material.location || "Unassigned"}</TableCell>
              <TableCell label="Vendor">{material.vendor || "Unknown"}</TableCell>
              <TableCell label="Status" valueClassName="table-cell-pill">
                <span className={getStatusPillClassName(isLow ? "critical" : "complete")}>
                  {isLow ? "Low stock" : "Stock OK"}
                </span>
              </TableCell>
              <TableCell label="Actions" valueClassName="table-cell-actions">
                <span className="editable-action-reveal editable-action-reveal-inline">
                  <EditableHoverIndicator className="editable-hover-indicator-inline" />
                </span>
              </TableCell>
            </button>
          );
        })}

        {filteredMaterials.length === 0 ? (
          <p className="empty-state">No materials match the current filters.</p>
        ) : null}
      </div>
    </section>
  );
}
