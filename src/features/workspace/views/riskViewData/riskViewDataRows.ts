import type { RiskRecord } from "@/types/recordsReporting";

import { SEVERITY_RANK, type RiskSeverityFilter, type RiskSourceFilter } from "./riskViewDataPayload";
import type { RiskViewLookups } from "./riskViewDataLookups";

export interface RiskRowsResult {
  filteredRows: RiskRecord[];
  risksBySeverity: Record<"high" | "medium" | "low", RiskRecord[]>;
}

interface BuildRiskRowsArgs {
  lookups: Pick<RiskViewLookups, "getAttachmentLabel" | "getMitigationLabel" | "getSourceLabel">;
  scopedRisks: RiskRecord[];
  search: string;
  severityFilter: RiskSeverityFilter;
  sourceFilter: RiskSourceFilter;
}

export function buildRiskRows({
  lookups,
  scopedRisks,
  search,
  severityFilter,
  sourceFilter,
}: BuildRiskRowsArgs): RiskRowsResult {
  const normalizedSearch = search.trim().toLowerCase();

  const filteredRows = scopedRisks
    .filter((risk) => {
      if (severityFilter !== "all" && risk.severity !== severityFilter) {
        return false;
      }

      if (sourceFilter !== "all" && risk.sourceType !== sourceFilter) {
        return false;
      }

      if (normalizedSearch.length === 0) {
        return true;
      }

      return [
        risk.title,
        risk.detail,
        lookups.getSourceLabel(risk),
        lookups.getAttachmentLabel(risk),
        lookups.getMitigationLabel(risk),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort((left, right) => {
      const severityOrder = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
      if (severityOrder !== 0) {
        return severityOrder;
      }

      return left.title.localeCompare(right.title);
    });

  const risksBySeverity: RiskRowsResult["risksBySeverity"] = {
    high: [],
    medium: [],
    low: [],
  };
  filteredRows.forEach((risk) => {
    risksBySeverity[risk.severity].push(risk);
  });

  return {
    filteredRows,
    risksBySeverity,
  };
}
