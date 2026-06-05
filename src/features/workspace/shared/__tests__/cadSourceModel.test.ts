/// <reference types="jest" />

import {
  CAD_SOURCE_MODEL_DOCS,
  getCadConfigurationLifecycleCopy,
  getCadConfigurationSourceCopy,
} from "../model/cadSourceModel";

describe("cadSourceModel", () => {
  it("labels manual, STEP import, and Onshape sync sources consistently", () => {
    expect(getCadConfigurationSourceCopy(null)).toMatchObject({
      kind: "manual",
      label: "Manual configuration",
    });
    expect(getCadConfigurationSourceCopy("STEP_UPLOAD")).toMatchObject({
      kind: "step_import",
      label: "STEP import",
    });
    expect(getCadConfigurationSourceCopy("ONSHAPE_API")).toMatchObject({
      kind: "onshape_sync",
      label: "Onshape sync",
    });
    expect(getCadConfigurationSourceCopy("ONSHAPE_BOM_CSV")).toMatchObject({
      kind: "onshape_sync",
      label: "Onshape sync",
    });
    expect(getCadConfigurationSourceCopy("onshape")).toMatchObject({
      kind: "onshape_sync",
      label: "Onshape sync",
    });
  });

  it("labels preview-only and finalized lifecycle states", () => {
    expect(getCadConfigurationLifecycleCopy()).toMatchObject({
      label: "Manual editable",
      state: "manual_editable",
    });
    expect(getCadConfigurationLifecycleCopy({ status: "mapping_review" })).toMatchObject({
      label: "Preview only",
      state: "preview_only",
    });
    expect(getCadConfigurationLifecycleCopy({ finalizedAt: "2026-06-01T12:00:00.000Z" })).toMatchObject({
      label: "Finalized",
      state: "finalized",
    });
  });

  it("keeps CAD/config documentation links in one place", () => {
    expect(CAD_SOURCE_MODEL_DOCS.robotConfiguration).toBe("/docs/CURRENT_WEB_SPEC.md#robot-configuration");
    expect(CAD_SOURCE_MODEL_DOCS.stepExportGuide).toBe("/docs/step-export-conventions.md");
    expect(CAD_SOURCE_MODEL_DOCS.systemArchitecture).toBe("/docs/cross-repo-architecture.md");
  });
});
