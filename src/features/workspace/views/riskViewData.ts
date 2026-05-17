import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

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

export interface RiskViewData {
  activeMechanismCount: number;
  activeSubsystemCount: number;
  attendanceHours: number;
  attachmentOptionsForType: (attachmentType: RiskPayload["attachmentType"]) => SelectOption[];
  blockerBreakdown: ReturnType<typeof buildRiskViewScopeData>["blockerBreakdown"];
  blockerCount: number;
  buildHealthActions: string[];
  buildHealthReasons: string[];
  buildHealthStatus: ReturnType<typeof buildRiskViewScopeData>["buildHealthStatus"];
  clampedCompletionWidth: string;
  completionRate: number;
  completedTaskCount: number;
  deliveredPurchases: number;
  expectedProgressRate: number | null;
  filteredRows: RiskRecord[];
  getAttachmentLabel: (risk: RiskRecord) => string;
  getMitigationLabel: (risk: RiskRecord) => string;
  getSourceLabel: (risk: RiskRecord) => string;
  hoursLoggedRate: number;
  loggedHours: number;
  logsThisWeekHours: number | null;
  lowStockMaterials: number;
  maxMetricHours: number;
  mechanismAttachmentOptions: SelectOption[];
  mechanismMetrics: ReturnType<typeof buildRiskViewScopeData>["mechanismMetrics"];
  mitigationTaskOptions: SelectOption[];
  mentorActionRequiredCount: number | null;
  oldestBlockerAgeDays: number | null;
  oldestQaWaitingAgeDays: number | null;
  openTaskCount: number;
  ownerlessTaskCount: number;
  pendingPurchaseCount: number;
  planStatus: ReturnType<typeof buildRiskViewScopeData>["planStatus"];
  plannedHours: number;
  projectAttachmentOptions: SelectOption[];
  qaPassCount: number;
  qaWaitingCount: number;
  qaSourceOptions: SelectOption[];
  remainingPlannedHours: number;
  risksBySeverity: Record<(typeof RISK_SEVERITY_ORDER)[number], RiskRecord[]>;
  scopedTaskCount: number;
  sourceOptionsForType: (sourceType: RiskPayload["sourceType"]) => SelectOption[];
  staleSubsystemCount: number | null;
  staleTaskCount: number | null;
  staleTaskThresholdDays: number;
  staleTaskUnavailableCount: number;
  studentRevisionRequiredCount: number | null;
  subsystemMetrics: ReturnType<typeof buildRiskViewScopeData>["subsystemMetrics"];
  supplySignals: number;
  taskCompletionRate: number;
  taskCompletionWidth: string;
  testSourceOptions: SelectOption[];
  totalMechanismCount: number;
  totalSubsystemCount: number;
  untouchedMechanismCount: number;
  unresolvedBlockerCount: number;
  waitingForQaCount: number;
}

export function buildRisksViewData({
  activePersonFilter,
  bootstrap,
  search,
  severityFilter,
  sortField,
  sortOrder,
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
    sortField,
    sortOrder,
    sourceFilter,
  });

  return {
    activeMechanismCount: scope.activeMechanismCount,
    activeSubsystemCount: scope.activeSubsystemCount,
    attendanceHours: scope.attendanceHours,
    attachmentOptionsForType: lookups.attachmentOptionsForType,
    blockerBreakdown: scope.blockerBreakdown,
    blockerCount: scope.blockerCount,
    buildHealthActions: scope.buildHealthActions,
    buildHealthReasons: scope.buildHealthReasons,
    buildHealthStatus: scope.buildHealthStatus,
    clampedCompletionWidth: scope.clampedCompletionWidth,
    completionRate: scope.completionRate,
    completedTaskCount: scope.completedTaskCount,
    deliveredPurchases: scope.deliveredPurchases,
    expectedProgressRate: scope.expectedProgressRate,
    filteredRows: rows.filteredRows,
    getAttachmentLabel: lookups.getAttachmentLabel,
    getMitigationLabel: lookups.getMitigationLabel,
    getSourceLabel: lookups.getSourceLabel,
    hoursLoggedRate: scope.hoursLoggedRate,
    loggedHours: scope.loggedHours,
    logsThisWeekHours: scope.logsThisWeekHours,
    lowStockMaterials: scope.lowStockMaterials,
    maxMetricHours: scope.maxMetricHours,
    mechanismAttachmentOptions: lookups.mechanismAttachmentOptions,
    mechanismMetrics: scope.mechanismMetrics,
    mitigationTaskOptions: lookups.mitigationTaskOptions,
    mentorActionRequiredCount: scope.mentorActionRequiredCount,
    oldestBlockerAgeDays: scope.oldestBlockerAgeDays,
    oldestQaWaitingAgeDays: scope.oldestQaWaitingAgeDays,
    openTaskCount: scope.openTaskCount,
    ownerlessTaskCount: scope.ownerlessTaskCount,
    pendingPurchaseCount: scope.pendingPurchaseCount,
    planStatus: scope.planStatus,
    plannedHours: scope.plannedHours,
    projectAttachmentOptions: lookups.projectAttachmentOptions,
    qaPassCount: scope.qaPassCount,
    qaWaitingCount: scope.qaWaitingCount,
    qaSourceOptions: lookups.qaSourceOptions,
    remainingPlannedHours: scope.remainingPlannedHours,
    risksBySeverity: rows.risksBySeverity,
    scopedTaskCount: scope.scopedTasks.length,
    sourceOptionsForType: lookups.sourceOptionsForType,
    staleSubsystemCount: scope.staleSubsystemCount,
    staleTaskCount: scope.staleTaskCount,
    staleTaskThresholdDays: scope.staleTaskThresholdDays,
    staleTaskUnavailableCount: scope.staleTaskUnavailableCount,
    studentRevisionRequiredCount: scope.studentRevisionRequiredCount,
    subsystemMetrics: scope.subsystemMetrics,
    supplySignals: scope.supplySignals,
    taskCompletionRate: scope.taskCompletionRate,
    taskCompletionWidth: scope.taskCompletionWidth,
    testSourceOptions: lookups.testSourceOptions,
    totalMechanismCount: bootstrap.mechanisms.length,
    totalSubsystemCount: bootstrap.subsystems.length,
    untouchedMechanismCount: scope.untouchedMechanismCount,
    unresolvedBlockerCount: scope.unresolvedBlockerCount,
    waitingForQaCount: scope.waitingForQaCount,
  };
}
