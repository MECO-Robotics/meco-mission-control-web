import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MaterialEditorModal } from "@/features/workspace/modals/assetCatalog/MaterialEditorModal";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";

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
        preferredVendorId: null,
        notes: "",
      },
      materialModalMode,
      setMaterialDraft: jest.fn(),
      bootstrap: EMPTY_BOOTSTRAP,
      requestPhotoUpload: jest.fn(async () => "https://example.test/material.png"),
    }),
  );
}
