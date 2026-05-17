import type {
  CadStepImportRunRecord,
  CadStepImportSummary,
  CadStepWarningRecord,
} from "./cadIntegrationTypes";

const PLACEHOLDER_PARSER_WARNING_CODE = "step_parser_placeholder_used";

export const PLACEHOLDER_PARSER_WARNING_TEXT = "Placeholder parser output. This is not from your uploaded STEP file.";

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

export function stepUsesPlaceholderParser(args: {
  importRun?: CadStepImportRunRecord | null;
  summary?: CadStepImportSummary | null;
  warnings: CadStepWarningRecord[];
}) {
  const rawSummary = args.importRun?.rawSummaryJson ?? {};
  const rawStats = args.summary?.rawStats ?? {};
  const parserVersion =
    args.summary?.actualParserVersion ??
    args.summary?.parserVersion ??
    readString(rawStats.actualParserVersion) ??
    readString(rawStats.parserVersion) ??
    args.importRun?.parserVersion ??
    "";

  return (
    args.warnings.some((warning) => warning.code === PLACEHOLDER_PARSER_WARNING_CODE) ||
    args.summary?.parserUsedPlaceholder === true ||
    readBoolean(rawStats.parserUsedPlaceholder) === true ||
    readBoolean(rawSummary.parserUsedPlaceholder) === true ||
    parserVersion.toLowerCase().includes("placeholder")
  );
}
