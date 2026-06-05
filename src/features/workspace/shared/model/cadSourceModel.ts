export type CadConfigurationSourceKind = "manual" | "step_import" | "onshape_sync";
export type CadConfigurationLifecycle = "manual_editable" | "preview_only" | "finalized";

export interface CadConfigurationSourceCopy {
  detail: string;
  kind: CadConfigurationSourceKind;
  label: string;
}

export interface CadConfigurationLifecycleCopy {
  detail: string;
  label: string;
  state: CadConfigurationLifecycle;
}

export const CAD_SOURCE_MODEL_DOCS = {
  robotConfiguration: "/docs/CURRENT_WEB_SPEC.md#robot-configuration",
  stepExportGuide: "/docs/step-export-conventions.md",
  systemArchitecture: "/docs/cross-repo-architecture.md",
} as const;

export function getCadConfigurationSourceCopy(source?: string | null): CadConfigurationSourceCopy {
  switch ((source ?? "").toUpperCase()) {
    case "STEP_UPLOAD":
      return {
        detail: "Uploaded STEP file parsed into a reviewable snapshot.",
        kind: "step_import",
        label: "STEP import",
      };
    case "ONSHAPE_API":
    case "ONSHAPE_BOM_CSV":
    case "ONSHAPE":
      return {
        detail: "Onshape sync data cached from a saved document reference.",
        kind: "onshape_sync",
        label: "Onshape sync",
      };
    case "MANUAL_BOM_CSV":
      return {
        detail: "Manual configuration data staged outside the live robot map.",
        kind: "manual",
        label: "Manual configuration",
      };
    default:
      return {
        detail: "Manual edits maintained directly in Robot Configuration.",
        kind: "manual",
        label: "Manual configuration",
      };
  }
}

export function getCadConfigurationLifecycleCopy(input?: {
  finalizedAt?: string | null;
  finalizedBy?: string | null;
  immutable?: boolean | null;
  status?: string | null;
} | null): CadConfigurationLifecycleCopy {
  const normalizedStatus = (input?.status ?? "").toLowerCase();

  if (normalizedStatus === "finalized" || input?.finalizedAt) {
    return {
      detail: "Reviewed data can be used as finalized Robot Configuration source.",
      label: "Finalized",
      state: "finalized",
    };
  }

  if (normalizedStatus || input?.immutable !== undefined) {
    return {
      detail: "Review-only data that has not been finalized into Robot Configuration.",
      label: "Preview only",
      state: "preview_only",
    };
  }

  return {
    detail: "Editable structure maintained directly in Robot Configuration.",
    label: "Manual editable",
    state: "manual_editable",
  };
}
