/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { MATERIAL_STOCK_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import { MaterialsView } from "@/features/workspace/views/MaterialsView";
import {
  filterMaterialInventory,
  isMaterialBelowReorder,
  matchesMaterialStockFilter,
  sortMaterialInventory,
} from "@/features/workspace/views/materialsInventoryModel";
import type { MaterialRecord } from "@/types/recordsInventory";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("MaterialsView stock presentation", () => {
  const material: MaterialRecord = {
    id: "polycarbonate",
    name: "Polycarbonate Sheet",
    category: "plastic",
    onHandQuantity: 2,
    reorderPoint: 3,
    location: "Shelf B2",
    preferredVendorId: "vendor-mcmaster",
    unit: "sheet",
    notes: "",
  };

  it("combines on-hand and reorder quantities and highlights stock below the threshold", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MaterialsView, {
        bootstrap: { ...EMPTY_BOOTSTRAP, materials: [material] },
        openCreateMaterialModal: jest.fn(),
        openEditMaterialModal: jest.fn(),
      }),
    );

    expect(markup).toContain("On hand / reorder");
    expect(markup).toContain('resource-list-primary-cell" data-label="Material"');
    expect(markup).toContain("2 / 3");
    expect(markup).toContain("materials-stock-below-reorder");
    expect(markup).not.toContain('data-label="Reorder"');
  });

  it("defaults to ascending Material sort and marks only that column active", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MaterialsView, {
        bootstrap: {
          ...EMPTY_BOOTSTRAP,
          materials: [
            { ...material, id: "zinc", name: "Zinc Sheet" },
            { ...material, id: "aluminum", name: "Aluminum Sheet" },
          ],
        },
        openCreateMaterialModal: jest.fn(),
        openEditMaterialModal: jest.fn(),
      }),
    );

    expect(markup).toContain('aria-sort="ascending"');
    expect(markup).toContain("table-sort-arrow");
    expect(markup.indexOf("Aluminum Sheet")).toBeLessThan(markup.indexOf("Zinc Sheet"));
  });

  it("exposes and applies the below-reorder stock filter", () => {
    expect(MATERIAL_STOCK_OPTIONS).toContainEqual({ id: "below-reorder", name: "Below reorder" });
    expect(isMaterialBelowReorder(material)).toBe(true);
    expect(matchesMaterialStockFilter(material, ["below-reorder"])).toBe(true);
    expect(matchesMaterialStockFilter({ ...material, onHandQuantity: 3 }, ["below-reorder"])).toBe(false);
    expect(matchesMaterialStockFilter(material, ["ok"])).toBe(false);
  });

  it("provides a filter control for every inventory column", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MaterialsView, {
        bootstrap: { ...EMPTY_BOOTSTRAP, materials: [material] },
        openCreateMaterialModal: jest.fn(),
        openEditMaterialModal: jest.fn(),
      }),
    );

    [
      "Filter materials by name",
      "Filter materials by category",
      "Filter materials by on-hand and reorder quantities",
      "Filter materials by location",
      "Filter materials by vendor",
      "Filter materials by stock level",
    ].forEach((label) => expect(markup).toContain(label));
  });

  it("applies each column selection together", () => {
    const secondMaterial = {
      ...material,
      id: "filament",
      name: "Onyx Filament",
      category: "filament" as MaterialRecord["category"],
      onHandQuantity: 1,
      reorderPoint: 2,
      location: "Filament cabinet",
      preferredVendorId: "vendor-markforged",
    };

    expect(
      filterMaterialInventory([material, secondMaterial], {
        search: "",
        name: ["Polycarbonate Sheet"],
        category: ["plastic"],
        quantity: ["2 / 3"],
        location: ["Shelf B2"],
      vendor: ["McMaster-Carr"],
      stock: ["below-reorder"],
    }, { "vendor-mcmaster": "McMaster-Carr", "vendor-markforged": "Markforged" }),
    ).toEqual([material]);
  });

  it("sorts inventory by the selected column and direction", () => {
    const secondMaterial = { ...material, id: "filament", name: "Onyx Filament", onHandQuantity: 1 };

    expect(sortMaterialInventory([material, secondMaterial], "name", "ascending")).toEqual([
      secondMaterial,
      material,
    ]);
    expect(sortMaterialInventory([material, secondMaterial], "quantity", "ascending")).toEqual([
      secondMaterial,
      material,
    ]);
    expect(sortMaterialInventory([material, secondMaterial], "name", "descending")).toEqual([
      material,
      secondMaterial,
    ]);
  });
});
