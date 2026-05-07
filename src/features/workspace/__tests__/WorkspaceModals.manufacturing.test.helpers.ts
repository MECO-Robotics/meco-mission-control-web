import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MaterialEditorModal } from "@/features/workspace/modals/assetCatalog/MaterialEditorModal";
import { ManufacturingEditorModal } from "@/features/workspace/modals/purchaseManufacturing/ManufacturingEditorModal";
import { buildEmptyManufacturingPayload } from "@/lib/appUtils/manufacturing";
import type { BootstrapPayload } from "@/types/bootstrap";
import { createBootstrap } from "./support/WorkspaceModals.test.shared";

export function renderManufacturingModal(
  process: "cnc" | "3d-print" | "fabrication",
  manufacturingModalMode: "create" | "edit" = "create",
) {
  const bootstrap = createBootstrap();

  return renderToStaticMarkup(
    React.createElement(ManufacturingEditorModal, {
      bootstrap,
      closeManufacturingModal: jest.fn(),
      handleManufacturingSubmit: jest.fn(),
      isSavingManufacturing: false,
      manufacturingDraft: {
        ...buildEmptyManufacturingPayload(bootstrap, process),
        process,
      },
      manufacturingModalMode,
      setManufacturingDraft: jest.fn(),
    }),
  );
}

export function renderMaterialModal(materialModalMode: "create" | "edit") {
  return renderToStaticMarkup(
    React.createElement(MaterialEditorModal, {
      activeMaterialId: materialModalMode === "edit" ? "material-1" : null,
      closeMaterialModal: jest.fn(),
      handleDeleteMaterial: jest.fn(),
      handleMaterialSubmit: jest.fn(),
      isDeletingMaterial: false,
      isSavingMaterial: false,
      materialDraft: {
        name: "Aluminum 6061",
        category: "metal",
        unit: "sheet",
        onHandQuantity: 12,
        reorderPoint: 6,
        location: "Rack A",
        vendor: "McMaster",
        notes: "",
      },
      materialModalMode,
      setMaterialDraft: jest.fn(),
    }),
  );
}

export function renderManufacturingModalWithPartInstances(process: "cnc" | "3d-print" | "fabrication") {
  const bootstrap: BootstrapPayload = {
    ...createBootstrap(),
    mechanisms: [
      {
        id: "mechanism-1",
        subsystemId: "subsystem-1",
        name: "Gearbox",
        description: "",
        iteration: 1,
      },
    ],
    materials: [
      {
        id: "material-1",
        name: "Aluminum 6061",
        category: "metal",
        unit: "bar",
        onHandQuantity: 4,
        reorderPoint: 1,
        location: "Rack",
        vendor: "",
        notes: "",
      },
    ],
    partDefinitions: [
      {
        id: "part-definition-1",
        seasonId: "season-2026",
        name: "Bearing Block",
        partNumber: "BB-001",
        revision: "A",
        iteration: 1,
        type: "custom",
        source: "Onshape",
        materialId: "material-1",
        description: "",
      },
    ],
    partInstances: [
      {
        id: "part-instance-1",
        subsystemId: "subsystem-1",
        mechanismId: "mechanism-1",
        partDefinitionId: "part-definition-1",
        name: "Left Bearing Block",
        quantity: 2,
        trackIndividually: false,
        status: "not ready",
      },
    ],
  };

  return renderToStaticMarkup(
    React.createElement(ManufacturingEditorModal, {
      bootstrap,
      closeManufacturingModal: jest.fn(),
      handleManufacturingSubmit: jest.fn(),
      isSavingManufacturing: false,
      manufacturingDraft: buildEmptyManufacturingPayload(bootstrap, process),
      manufacturingModalMode: "create",
      setManufacturingDraft: jest.fn(),
    }),
  );
}
