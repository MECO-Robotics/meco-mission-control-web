import type { CadSourceKind, CadSourceMetadata } from "@/types/recordsOrganization";

export type CadSourceIndicatorTone = CadSourceKind | "edited-after-import";

export interface CadSourceIndicatorModel {
  detail: string;
  label: string;
  tone: CadSourceIndicatorTone;
}

function normalizeSourceValue(value: unknown): CadSourceIndicatorTone | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[_\s]+/g, "-");

  if (normalized === "step" || normalized === "step-import" || normalized === "step-upload") {
    return "step-import";
  }

  if (normalized === "onshape" || normalized === "onshape-api" || normalized === "onshape-sync") {
    return "onshape-sync";
  }

  if (normalized === "manual" || normalized === "manual-entry" || normalized === "manual-bom-csv") {
    return "manual";
  }

  return null;
}

function labelForTone(tone: CadSourceIndicatorTone) {
  switch (tone) {
    case "edited-after-import":
      return "Edited after import";
    case "step-import":
      return "STEP import";
    case "onshape-sync":
      return "Onshape sync";
    case "manual":
      return "Manual entry";
  }
}

function defaultDetailForTone(tone: CadSourceIndicatorTone) {
  switch (tone) {
    case "edited-after-import":
      return "Backend marked this object as edited after CAD import.";
    case "step-import":
      return "Created from persisted STEP import metadata.";
    case "onshape-sync":
      return "Created from persisted Onshape sync metadata.";
    case "manual":
      return "No CAD import source metadata was provided.";
  }
}

export function resolveCadSourceIndicator(
  record: CadSourceMetadata | null | undefined,
  inheritedRecord?: CadSourceMetadata | null,
): CadSourceIndicatorModel {
  const metadata = record ?? {};
  const inheritedMetadata = inheritedRecord ?? {};
  const wasEditedAfterImport = Boolean(
    metadata.cadEditedAfterImport ??
      metadata.editedAfterImport ??
      inheritedMetadata.cadEditedAfterImport ??
      inheritedMetadata.editedAfterImport,
  );
  const tone = wasEditedAfterImport
    ? "edited-after-import"
    : normalizeSourceValue(metadata.cadSourceKind) ??
      normalizeSourceValue(metadata.cadSource) ??
      normalizeSourceValue(metadata.cadImportSource) ??
      normalizeSourceValue(inheritedMetadata.cadSourceKind) ??
      normalizeSourceValue(inheritedMetadata.cadSource) ??
      normalizeSourceValue(inheritedMetadata.cadImportSource) ??
      "manual";

  return {
    detail: metadata.cadSourceDetail ?? inheritedMetadata.cadSourceDetail ?? defaultDetailForTone(tone),
    label:
      tone === "edited-after-import"
        ? labelForTone(tone)
        : metadata.cadSourceLabel ?? inheritedMetadata.cadSourceLabel ?? labelForTone(tone),
    tone,
  };
}
