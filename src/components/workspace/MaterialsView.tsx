import { useMemo, useState } from "react";

import type { BootstrapPayload, MaterialRecord } from "../../types";
import { IconManufacturing, IconTasks } from "../shared/Icons";
import {
  EditableHoverIndicator,
  FilterDropdown,
  SearchToolbarInput,
  TableCell,
} from "./WorkspaceViewShared";
import { getStatusPillStyle } from "./workspaceUtils";
import { WORKSPACE_PANEL_STYLE } from "./workspaceTypes";
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
    <section className="panel dense-panel" style={WORKSPACE_PANEL_STYLE}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>Materials manager</h2>
          <p className="section-copy" style={{ color: "var(--text-copy)" }}>
            Live inventory for stock, reorder thresholds, vendors, and shop locations.
          </p>
        </div>
        <div className="panel-actions filter-toolbar materials-toolbar" style={{ justifyContent: "flex-end" }}>
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
          style={{
            gridTemplateColumns: MATERIALS_GRID_TEMPLATE,
            borderBottom: "1px solid var(--border-base)",
            color: "var(--text-copy)",
          }}
        >
          <span style={{ textAlign: "left" }}>Material</span>
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
              style={{
                gridTemplateColumns: MATERIALS_GRID_TEMPLATE,
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-base)",
                color: "var(--text-copy)",
                background: "var(--bg-row-alt)",
                textAlign: "left",
              }}
              title={`Edit ${material.name}`}
              type="button"
            >
              <TableCell label="Material">
                <strong style={{ color: "var(--text-title)" }}>{material.name}</strong>
                {material.notes ? <small style={{ color: "var(--text-copy)" }}>{material.notes}</small> : null}
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
                <span style={getStatusPillStyle(isLow ? "critical" : "complete")}>
                  {isLow ? "Low stock" : "Stock OK"}
                </span>
              </TableCell>
              <TableCell label="Actions" valueClassName="table-cell-actions">
                <span className="editable-action-reveal" style={{ display: "inline-flex", gap: "0.35rem" }}>
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
