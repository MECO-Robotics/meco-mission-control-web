import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";

import { buildRiskRows } from "./riskViewData/riskViewDataRows";
import type { RiskSortField, RiskSortOrder } from "./riskViewData/riskViewDataRows";
import { buildRiskViewLookups } from "./riskViewData/riskViewDataLookups";
import { buildRiskViewScopeData } from "./riskViewData/riskViewDataScope";
import {
  ATTACHMENT_TYPE_LABELS,
  RISK_SEVERITY_ORDER,
  SEVERITY_RANK,
  buildDefaultRiskPayload,
  formatRiskSeverity,
  getRiskSeverityPillClassName,
  sanitizeRiskPayload,
  toRiskPayload,
  type RiskSeverityFilter,
  type RiskSourceFilter,
  type SelectOption,
} from "./riskViewData/riskViewDataPayload";

export type { RiskSortField, RiskSortOrder, RiskSourceFilter, RiskSeverityFilter, SelectOption };
export {
  ATTACHMENT_TYPE_LABELS,
  RISK_SEVERITY_ORDER,
  SEVERITY_RANK,
  buildDefaultRiskPayload,
  formatRiskSeverity,
  getRiskSeverityPillClassName,
  sanitizeRiskPayload,
  toRiskPayload,
};

interface BuildRisksViewDataArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  search: string;
  severityFilter: RiskSeverityFilter;
  sortField: RiskSortField;
  sortOrder: RiskSortOrder;
  sourceFilter: RiskSourceFilter;
}

export function buildRisksViewData({
  activePersonFilter,
  bootstrap,
  search,
  severityFilter,
  sortField,
  sortOrder,
  sourceFilter,
}: BuildRisksViewDataArgs) {
  const scope = buildRiskViewScopeData({
    activePersonFilter,
    bootstrap,
  });
  const lookups = buildRiskViewLookups({
    bootstrap,
    scope: scope.pools,
  });
  const rows = buildRiskRows({
    lookups,
    scopedRisks: scope.pools.scopedRisks,
    search,
    severityFilter,
    sortField,
    sortOrder,
    sourceFilter,
  });

  return { metrics: scope.metrics, ...lookups, ...rows };
}
