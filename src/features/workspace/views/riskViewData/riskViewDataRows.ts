import type { RiskRecord } from "@/types/recordsReporting";

import { SEVERITY_RANK, type RiskSeverityFilter, type RiskSourceFilter } from "./riskViewDataPayload";
import type { RiskViewLookups } from "./riskViewDataLookups";

export type RiskSortField = "title" | "source" | "attachment" | "mitigation";
export type RiskSortOrder = "asc" | "desc";

export interface RiskRowsResult {
  filteredRows: RiskRecord[];
  risksBySeverity: Record<"high" | "medium" | "low", RiskRecord[]>;
}

interface BuildRiskRowsArgs {
  lookups: Pick<RiskViewLookups, "getAttachmentLabel" | "getMitigationLabel" | "getSourceLabel">;
  scopedRisks: RiskRecord[];
  search: string;
  severityFilter: RiskSeverityFilter;
  sortField: RiskSortField;
  sortOrder: RiskSortOrder;
  sourceFilter: RiskSourceFilter;
}

function compareRiskText(left: string, right: string, sortOrder: RiskSortOrder) {
  const result = left.localeCompare(right);
  return sortOrder === "asc" ? result : -result;
}

function getRiskSortValue(
  risk: RiskRecord,
  lookups: BuildRiskRowsArgs["lookups"],
  sortField: RiskSortField,
) {
  switch (sortField) {
    case "source":
      return lookups.getSourceLabel(risk);
    case "attachment":
      return lookups.getAttachmentLabel(risk);
    case "mitigation":
      return lookups.getMitigationLabel(risk);
    case "title":
    default:
      return risk.title;
  }
}

export function buildRiskRows({
  lookups,
  scopedRisks,
  search,
  severityFilter,
  sortField,
  sortOrder,
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

      const sortValue = compareRiskText(
        getRiskSortValue(left, lookups, sortField),
        getRiskSortValue(right, lookups, sortField),
        sortOrder,
      );
      return sortValue || left.title.localeCompare(right.title);
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
