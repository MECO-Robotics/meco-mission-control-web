/// <reference types="jest" />

import { renderMaterialModal } from "./WorkspaceModals.manufacturing.test.helpers";

describe("Workspace modals - manufacturing and materials", () => {
  it("hides the unit field in material create and edit modals", () => {
    expect(renderMaterialModal("create")).not.toContain(">Unit</span>");
    expect(renderMaterialModal("edit")).not.toContain(">Unit</span>");
  });
});
