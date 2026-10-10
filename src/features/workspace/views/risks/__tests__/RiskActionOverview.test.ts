import { createBootstrap } from "@/features/workspace/views/__tests__/riskViewTestFixtures";
import { changeRiskSeverity, countRiskActions, filterRiskRecords } from "../RiskActionOverview";

const today = "2026-10-03";
const risks = () => {
  const records = createBootstrap().risks;
  records[0] = { ...records[0]!, ownerMemberId: "member-1", mitigationDueDate: "2026-10-02", status: "blocked" };
  records[1] = { ...records[1]!, ownerMemberId: null, mitigationDueDate: null, status: "in-progress" };
  return records;
};

it("filters risks by member, status, and due date while keeping the active default semantics", () => {
  const records = risks();
  records.push({ ...records[0]!, id: "risk-resolved", status: "resolved", ownerMemberId: null, mitigationDueDate: "2026-10-01" });
  expect(filterRiskRecords(records, { owner: "member-1", status: "active", due: "overdue", people: [] }, today).map((risk) => risk.id)).toEqual(["risk-1"]);
  expect(filterRiskRecords(records, { owner: "unassigned", status: "in-progress", due: "unset", people: [] }, today).map((risk) => risk.id)).toEqual(["risk-2"]);
  expect(filterRiskRecords(records, { owner: "all", status: "active", due: "all", people: ["member-1"] }, today).map((risk) => risk.id)).toEqual(["risk-1"]);
  expect(filterRiskRecords(records, { owner: "unassigned", status: "resolved", due: "all", people: [] }, today).map((risk) => risk.id)).toEqual(["risk-resolved"]);
});

it("counts unassigned, blocked, and overdue active risks without counting resolved records", () => {
  const records = risks();
  records.push({ ...records[0]!, id: "risk-resolved", status: "resolved", ownerMemberId: null, mitigationDueDate: "2026-10-01" });
  const counts = countRiskActions(records, today);
  expect(counts.unassigned.map((risk) => risk.id)).toEqual(["risk-2"]);
  expect(counts.blocked.map((risk) => risk.id)).toEqual(["risk-1"]);
  expect(counts.overdue.map((risk) => risk.id)).toEqual(["risk-1"]);
});

it("changes severity on board drop while preserving owner and mitigation fields", () => {
  const update = jest.fn();
  const record = risks()[0]!;
  changeRiskSeverity([record], record.id, "critical", update);
  expect(update).toHaveBeenCalledWith(record.id, expect.objectContaining({ severity: "critical", ownerMemberId: "member-1", mitigationDueDate: "2026-10-02" }));
});
