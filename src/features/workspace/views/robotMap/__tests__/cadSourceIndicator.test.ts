/// <reference types="jest" />

import { resolveCadSourceIndicator } from "../cadSourceIndicator";

describe("resolveCadSourceIndicator", () => {
  it("defaults to manual when no source metadata is present", () => {
    expect(resolveCadSourceIndicator(undefined)).toMatchObject({ tone: "manual", label: "Manual entry" });
    expect(resolveCadSourceIndicator(null)).toMatchObject({ tone: "manual", label: "Manual entry" });
    expect(resolveCadSourceIndicator({})).toMatchObject({ tone: "manual", label: "Manual entry" });
  });

  it("resolves STEP_UPLOAD and step-import source values", () => {
    expect(resolveCadSourceIndicator({ cadImportSource: "STEP_UPLOAD" })).toMatchObject({
      tone: "step-import",
      label: "STEP import",
    });
    expect(resolveCadSourceIndicator({ cadSource: "step-import" })).toMatchObject({
      tone: "step-import",
      label: "STEP import",
    });
    expect(resolveCadSourceIndicator({ cadSourceKind: "step-import" })).toMatchObject({
      tone: "step-import",
      label: "STEP import",
    });
  });

  it("resolves Onshape API and BOM CSV source values", () => {
    expect(resolveCadSourceIndicator({ cadSource: "ONSHAPE_API" })).toMatchObject({
      tone: "onshape-sync",
      label: "Onshape sync",
    });
    expect(resolveCadSourceIndicator({ cadSource: "ONSHAPE_BOM_CSV" })).toMatchObject({
      tone: "onshape-sync",
      label: "Onshape sync",
    });
    expect(resolveCadSourceIndicator({ cadSourceKind: "onshape-sync" })).toMatchObject({
      tone: "onshape-sync",
      label: "Onshape sync",
    });
  });

  it("prioritizes edited-after-import over source kind", () => {
    expect(
      resolveCadSourceIndicator({ cadEditedAfterImport: true, cadSource: "STEP_UPLOAD" }),
    ).toMatchObject({ tone: "edited-after-import", label: "Edited after import" });

    expect(
      resolveCadSourceIndicator({ editedAfterImport: true, cadSource: "STEP_UPLOAD" }),
    ).toMatchObject({ tone: "edited-after-import", label: "Edited after import" });
  });

  it("inherits source from partDefinition when instance has none", () => {
    expect(resolveCadSourceIndicator({}, { cadSource: "STEP_UPLOAD" })).toMatchObject({
      tone: "step-import",
    });
  });

  it("edited-after-import on the inherited record does not override the instance source", () => {
    // The inherited edit flag propagates because wasEditedAfterImport checks both records.
    // If the primary record has a source but no local edit flag, the inherited flag still wins.
    expect(
      resolveCadSourceIndicator(
        { cadSource: "ONSHAPE_API" },
        { cadEditedAfterImport: true },
      ),
    ).toMatchObject({ tone: "edited-after-import" });
  });

  it("uses cadSourceLabel override when provided", () => {
    expect(
      resolveCadSourceIndicator({ cadSourceKind: "step-import", cadSourceLabel: "Custom STEP label" }),
    ).toMatchObject({ tone: "step-import", label: "Custom STEP label" });
  });

  it("uses cadSourceDetail override when provided", () => {
    expect(
      resolveCadSourceIndicator({ cadSourceKind: "onshape-sync", cadSourceDetail: "Custom detail text" }),
    ).toMatchObject({ detail: "Custom detail text" });
  });

  it("survives reload: returns stable output for the same input", () => {
    const input = { cadSourceKind: "step-import", cadSourceLabel: "Stable label" };
    const first = resolveCadSourceIndicator(input);
    const second = resolveCadSourceIndicator(input);
    expect(first).toEqual(second);
  });
});
