import type {
  CadStepImportRunRecord,
  CadStepImportSummary,
  CadStepSnapshotRecord,
  CadStepWarningRecord,
} from "../model/cadIntegrationTypes";
import {
  PLACEHOLDER_PARSER_WARNING_TEXT,
  stepUsesPlaceholderParser,
} from "../model/cadStepParserStatus";

const SUMMARY_WARNING_CODES = new Set([
  "step_hierarchy_missing",
  "step_flattened_file",
  "step_parser_partial",
]);

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "not yet";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function formatList(values: string[]) {
  return values.length ? values.join(", ") : "none detected";
}

function readDiagnostics(summary: CadStepImportSummary | null, importRun: CadStepImportRunRecord | null) {
  const rawSummary = importRun?.rawSummaryJson ?? {};
  const rawStats = summary?.rawStats ?? {};
  const rootNames = summary?.rootNames?.length
    ? summary.rootNames
    : readStringList(rawStats.rootNames).length
      ? readStringList(rawStats.rootNames)
      : readStringList(rawSummary.rootNames);
  const rootName = summary?.rootName ?? readString(rawStats.rootName) ?? readString(rawSummary.rootName);
  const topLevelAssemblies = summary?.topLevelDetectedAssemblies?.length
    ? summary.topLevelDetectedAssemblies
    : summary?.topLevelAssemblyNames?.length
      ? summary.topLevelAssemblyNames
    : summary?.topLevelAssemblies?.length
      ? summary.topLevelAssemblies
      : readStringList(rawSummary.topLevelDetectedAssemblies).length
        ? readStringList(rawSummary.topLevelDetectedAssemblies)
        : readStringList(rawStats.topLevelAssemblyNames).length
          ? readStringList(rawStats.topLevelAssemblyNames)
          : readStringList(rawSummary.topLevelAssemblyNames).length
            ? readStringList(rawSummary.topLevelAssemblyNames)
            : readStringList(rawSummary.topLevelAssemblies);

  return {
    parserMode:
      summary?.configuredParserMode ??
      summary?.parserMode ??
      readString(rawStats.configuredParserMode) ??
      readString(rawStats.parserMode) ??
      readString(rawSummary.configuredParserMode) ??
      readString(rawSummary.parserMode) ??
      "unknown",
    parserVersion:
      summary?.actualParserVersion ??
      summary?.parserVersion ??
      readString(rawStats.actualParserVersion) ??
      readString(rawStats.parserVersion) ??
      importRun?.parserVersion ??
      "not run",
    productCount: summary?.productCount ?? readNumber(rawStats.productCount) ?? readNumber(rawSummary.productCount),
    assemblyUsageCount: summary?.assemblyUsageCount ?? readNumber(rawStats.assemblyUsageCount) ?? readNumber(rawSummary.assemblyUsageCount),
    nextAssemblyUsageOccurrenceCount:
      summary?.nextAssemblyUsageOccurrenceCount ??
      readNumber(rawStats.nextAssemblyUsageOccurrenceCount) ??
      readNumber(rawSummary.nextAssemblyUsageOccurrenceCount),
    rootNames: rootNames.length ? rootNames : rootName ? [rootName] : [],
    topLevelAssemblies,
  };
}

export function CadStepImportSummaryCard({
  importRun,
  snapshot,
  summary,
  warnings,
}: {
  importRun: CadStepImportRunRecord | null;
  snapshot: CadStepSnapshotRecord | null;
  summary: CadStepImportSummary | null;
  warnings: CadStepWarningRecord[];
}) {
  const usesPlaceholderParser = stepUsesPlaceholderParser({ importRun, summary, warnings });
  const diagnostics = readDiagnostics(summary, importRun);
  const summaryWarnings = warnings.filter((warning) => SUMMARY_WARNING_CODES.has(warning.code));

  return (
    <article className="cad-card cad-status-card">
      <span className="cad-eyebrow">Import summary</span>
      <h3>{snapshot?.label ?? "No STEP snapshot selected"}</h3>
      <dl className="cad-key-values">
        <div><dt>Status</dt><dd>{snapshot?.status ?? "none"}</dd></div>
        <div><dt>Parser mode</dt><dd>{diagnostics.parserMode}</dd></div>
        <div><dt>Parser version</dt><dd>{diagnostics.parserVersion}</dd></div>
        <div><dt>Product count</dt><dd>{diagnostics.productCount ?? "unknown"}</dd></div>
        <div><dt>Assembly usage count</dt><dd>{diagnostics.assemblyUsageCount ?? "unknown"}</dd></div>
        <div><dt>NEXT_ASSEMBLY_USAGE_OCCURRENCE</dt><dd>{diagnostics.nextAssemblyUsageOccurrenceCount ?? "unknown"}</dd></div>
        <div><dt>Root names</dt><dd>{formatList(diagnostics.rootNames)}</dd></div>
        <div><dt>Top-level detected assemblies</dt><dd>{formatList(diagnostics.topLevelAssemblies)}</dd></div>
        <div><dt>Placeholder used</dt><dd>{usesPlaceholderParser ? "Yes" : "No"}</dd></div>
        <div><dt>Assemblies</dt><dd>{summary?.assemblyCount ?? 0}</dd></div>
        <div><dt>Part defs</dt><dd>{summary?.partDefinitionCount ?? 0}</dd></div>
        <div><dt>Instances</dt><dd>{summary?.partInstanceCount ?? 0}</dd></div>
        <div><dt>Max depth</dt><dd>{summary?.maxDepth ?? 0}</dd></div>
        <div><dt>Warnings</dt><dd>{warnings.length}</dd></div>
        <div><dt>Created</dt><dd>{formatDate(snapshot?.createdAt)}</dd></div>
      </dl>
      {usesPlaceholderParser ? (
        <p className="cad-parser-alert">{PLACEHOLDER_PARSER_WARNING_TEXT}</p>
      ) : null}
      {summaryWarnings.length ? (
        <div className="cad-summary-warning-list" aria-label="Critical import warnings">
          {summaryWarnings.map((warning) => (
            <article className="cad-summary-warning-item" data-severity={warning.severity.toLowerCase()} key={warning.id}>
              <strong>{warning.title}</strong>
              <span>{warning.message}</span>
              <code>{warning.code}</code>
            </article>
          ))}
        </div>
      ) : null}
    </article>
  );
}
