import type { BootstrapPayload } from "@/types/bootstrap";
import type { DomainReference } from "@/types/common";
import type { RiskRecord } from "@/types/recordsReporting";
import { indexRecordsById } from "@/features/workspace/shared/model/indexRecordsById";
import type { SelectOption } from "./riskViewDataPayload";
import type { ScopedRiskViewPools } from "./riskViewScopeSelectors";

export interface RiskViewLookups {
  targetOptions: SelectOption[];
  responsibleGroupOptions: SelectOption[];
  getTargetLabel: (target: DomainReference) => string;
  getMitigationLabel: (risk: RiskRecord) => string;
  getSourceLabel: (risk: RiskRecord) => string;
  mitigationTaskOptions: SelectOption[];
}

interface BuildRiskViewLookupsArgs {
  bootstrap: BootstrapPayload;
  scope: Pick<ScopedRiskViewPools, "scopedTasks" | "scopedReports">;
}

export function buildRiskViewLookups({ bootstrap, scope }: BuildRiskViewLookupsArgs): RiskViewLookups {
  const tasks = indexRecordsById(scope.scopedTasks);
  const refs: Array<DomainReference & { label: string }> = [
    ...bootstrap.projects.map((x) => ({ kind: "project" as const, id: x.id, label: `Project · ${x.name}` })),
    ...bootstrap.tasks.map((x) => ({ kind: "task" as const, id: x.id, label: `Task · ${x.title}` })),
    ...bootstrap.subsystems.map((x) => ({ kind: "subsystem" as const, id: x.id, label: `Subsystem · ${x.name}` })),
    ...bootstrap.mechanisms.map((x) => ({ kind: "mechanism" as const, id: x.id, label: `Mechanism · ${x.name}` })),
    ...bootstrap.partDefinitions.map((x) => ({ kind: "part-definition" as const, id: x.id, label: `Part · ${x.name}` })),
    ...bootstrap.partInstances.map((x) => ({ kind: "part-instance" as const, id: x.id, label: `Part instance · ${x.id}` })),
    ...bootstrap.materials.map((x) => ({ kind: "material" as const, id: x.id, label: `Material · ${x.name}` })),
    ...bootstrap.milestones.map((x) => ({ kind: "milestone" as const, id: x.id, label: `Milestone · ${x.title}` })),
    ...bootstrap.meetings.map((x) => ({ kind: "meeting" as const, id: x.id, label: `Meeting · ${x.title}` })),
    ...bootstrap.events.map((x) => ({ kind: "event" as const, id: x.id, label: `Event · ${x.title}` })),
    ...bootstrap.reports.map((x) => ({ kind: "report" as const, id: x.id, label: `Report · ${x.summary || x.reportType}` })),
    ...bootstrap.qaFindings.map((x) => ({ kind: "qa-finding" as const, id: x.id, label: `QA finding · ${x.title}` })),
    ...bootstrap.testFindings.map((x) => ({ kind: "test-finding" as const, id: x.id, label: `Test finding · ${x.title}` })),
    ...bootstrap.qaRequests.map((x) => ({ kind: "qa-request" as const, id: x.id, label: `QA request · ${x.id}` })),
    ...bootstrap.testResults.map((x) => ({ kind: "test-result" as const, id: x.id, label: `Test result · ${x.title}` })),
  ];
  const labels = new Map(refs.map(({ kind, id, label }) => [`${kind}:${id}`, label]));
  const labelsByRecord = new Map(refs.map(({ kind, id, label }) => [`${kind}:${id}`, label]));
  return {
    targetOptions: refs.map(({ kind, id, label }) => ({ id: `${kind}:${id}`, name: label })),
    responsibleGroupOptions: bootstrap.responsibleGroups.map((group) => ({ id: group.id, name: group.name })),
    getTargetLabel: (target) => labels.get(`${target.kind}:${target.id}`) ?? `${target.kind} · ${target.id}`,
    getMitigationLabel: (risk) => risk.mitigationTaskId ? tasks[risk.mitigationTaskId]?.title ?? "Unknown task" : "None",
    getSourceLabel: (risk) => risk.source.kind === "manual" ? "Manual" : labelsByRecord.get(`${risk.source.kind}:${risk.source.id}`) ?? `${risk.source.kind} · ${risk.source.id}`,
    mitigationTaskOptions: scope.scopedTasks.map((task) => ({ id: task.id, name: task.title })),
  };
}
