import type { AuditActionRecord } from "@/types/recordsExecution";
import type { RiskRecord } from "@/types/recordsReporting";

export function riskAuditActions(
  actions: AuditActionRecord[] | undefined,
  risk: RiskRecord,
) {
  const riskTitle = risk.title.toLowerCase();

  return (actions ?? []).filter(
    (action) =>
      action.entityId === risk.id ||
      action.message.toLowerCase().includes(riskTitle),
  );
}
