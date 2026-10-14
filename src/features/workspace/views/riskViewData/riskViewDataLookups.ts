import type { BootstrapPayload } from "@/types/bootstrap";
import type { DomainReference } from "@/types/common";
import type { SelectOption } from "./riskViewDataPayload";
import { getRiskRecordReference } from "./riskRecordLinks";

export interface RiskViewLookups {
  targetOptions: SelectOption[];
  responsibleGroupOptions: SelectOption[];
  mitigationTaskOptions: SelectOption[];
}

interface BuildRiskViewLookupsArgs {
  bootstrap: BootstrapPayload;
  scopedTasks: BootstrapPayload["tasks"];
}

export function buildRiskViewLookups({ bootstrap, scopedTasks }: BuildRiskViewLookupsArgs): RiskViewLookups {
  const collections: Array<[DomainReference["kind"], { id: string }[]]> = [
    ["project", bootstrap.projects], ["task", bootstrap.tasks], ["subsystem", bootstrap.subsystems],
    ["mechanism", bootstrap.mechanisms], ["part-definition", bootstrap.partDefinitions],
    ["part-instance", bootstrap.partInstances], ["material", bootstrap.materials],
    ["milestone", bootstrap.milestones], ["meeting", bootstrap.meetings], ["event", bootstrap.events],
    ["report", bootstrap.reports], ["qa-finding", bootstrap.qaFindings], ["test-finding", bootstrap.testFindings],
    ["qa-request", bootstrap.qaRequests], ["test-result", bootstrap.testResults],
    ["purchase-item", bootstrap.purchaseItems], ["manufacturing-details", bootstrap.tasks.filter(task => task.manufacturingDetails)],
  ];
  const refs = collections.flatMap(([kind, records]) => records.map(({ id }) => ({ kind, id })));
  return {
    targetOptions: refs.map((ref) => { const record = getRiskRecordReference(ref, bootstrap); return { id: record.key, name: record.label }; }),
    responsibleGroupOptions: bootstrap.responsibleGroups.map((group) => ({ id: group.id, name: group.name })),
    mitigationTaskOptions: scopedTasks.map((task) => ({ id: task.id, name: task.title })),
  };
}
