import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

import { buildRiskRows } from "./riskViewData/riskViewDataRows";
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

export type { RiskSourceFilter, RiskSeverityFilter, SelectOption };
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
  sourceFilter: RiskSourceFilter;
}

export interface RiskViewData {
  activeMechanismCount: number;
  activeSubsystemCount: number;
  attendanceHours: number;
  attachmentOptionsForType: (attachmentType: RiskPayload["attachmentType"]) => SelectOption[];
  blockerCount: number;
  clampedCompletionWidth: string;
  completionRate: number;
  completedTaskCount: number;
  deliveredPurchases: number;
  filteredRows: RiskRecord[];
  getAttachmentLabel: (risk: RiskRecord) => string;
  getMitigationLabel: (risk: RiskRecord) => string;
  getSourceLabel: (risk: RiskRecord) => string;
  loggedHours: number;
  lowStockMaterials: number;
  maxMetricHours: number;
  mechanismAttachmentOptions: SelectOption[];
  mechanismMetrics: ReturnType<typeof buildRiskViewScopeData>["mechanismMetrics"];
  mitigationTaskOptions: SelectOption[];
  plannedHours: number;
  projectAttachmentOptions: SelectOption[];
  qaPassCount: number;
  qaSourceOptions: SelectOption[];
  risksBySeverity: Record<(typeof RISK_SEVERITY_ORDER)[number], RiskRecord[]>;
  scopedTaskCount: number;
  sourceOptionsForType: (sourceType: RiskPayload["sourceType"]) => SelectOption[];
  subsystemMetrics: ReturnType<typeof buildRiskViewScopeData>["subsystemMetrics"];
  supplySignals: number;
  testSourceOptions: SelectOption[];
  totalMechanismCount: number;
  totalSubsystemCount: number;
  waitingForQaCount: number;
}

export function buildRisksViewData({
  activePersonFilter,
  bootstrap,
  search,
  severityFilter,
  sourceFilter,
}: BuildRisksViewDataArgs): RiskViewData {
  const scope = buildRiskViewScopeData({
    activePersonFilter,
    bootstrap,
  });
  const lookups = buildRiskViewLookups({
    bootstrap,
    scope,
  });
  const rows = buildRiskRows({
    lookups,
    scopedRisks: scope.scopedRisks,
    search,
    severityFilter,
    sourceFilter,
  });

  return {
    activeMechanismCount: scope.activeMechanismCount,
    activeSubsystemCount: scope.activeSubsystemCount,
    attendanceHours: scope.attendanceHours,
    attachmentOptionsForType: lookups.attachmentOptionsForType,
    blockerCount: scope.blockerCount,
    clampedCompletionWidth: scope.clampedCompletionWidth,
    completionRate: scope.completionRate,
    completedTaskCount: scope.completedTaskCount,
    deliveredPurchases: scope.deliveredPurchases,
    filteredRows: rows.filteredRows,
    getAttachmentLabel: lookups.getAttachmentLabel,
    getMitigationLabel: lookups.getMitigationLabel,
    getSourceLabel: lookups.getSourceLabel,
    loggedHours: scope.loggedHours,
    lowStockMaterials: scope.lowStockMaterials,
    maxMetricHours: scope.maxMetricHours,
    mechanismAttachmentOptions: lookups.mechanismAttachmentOptions,
    mechanismMetrics: scope.mechanismMetrics,
    mitigationTaskOptions: lookups.mitigationTaskOptions,
    plannedHours: scope.plannedHours,
    projectAttachmentOptions: lookups.projectAttachmentOptions,
    qaPassCount: scope.qaPassCount,
    qaSourceOptions: lookups.qaSourceOptions,
    risksBySeverity: rows.risksBySeverity,
    scopedTaskCount: scope.scopedTasks.length,
    sourceOptionsForType: lookups.sourceOptionsForType,
    subsystemMetrics: scope.subsystemMetrics,
    supplySignals: scope.supplySignals,
    testSourceOptions: lookups.testSourceOptions,
    totalMechanismCount: bootstrap.mechanisms.length,
    totalSubsystemCount: bootstrap.subsystems.length,
    waitingForQaCount: scope.waitingForQaCount,
  };
}
