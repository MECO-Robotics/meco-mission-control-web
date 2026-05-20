/// <reference types="jest" />

import type { RiskRecord } from "@/types/recordsReporting";
import { buildRiskRows } from "../riskViewDataRows";

const baseRisk: RiskRecord = {
  id: "risk-1",
  title: "Alpha risk",
  detail: "",
  severity: "medium",
  sourceType: "qa-report",
  sourceId: "source-a",
  attachmentType: "project",
  attachmentId: "attachment-a",
  mitigationTaskId: null,
};

describe("buildRiskRows", () => {
  it("sorts risks within severity columns by the selected label", () => {
    const rows = buildRiskRows({
      lookups: {
        getAttachmentLabel: (risk) => risk.attachmentId,
        getMitigationLabel: (risk) => risk.mitigationTaskId ?? "No mitigation",
        getSourceLabel: (risk) => risk.sourceId,
      },
      scopedRisks: [
        {
          ...baseRisk,
          id: "risk-a",
          sourceId: "Source A",
          title: "Later title",
        },
        {
          ...baseRisk,
          id: "risk-z",
          sourceId: "Source Z",
          title: "Earlier title",
        },
      ],
      search: "",
      severityFilter: "all",
      sortField: "source",
      sortOrder: "desc",
      sourceFilter: "all",
    });

    expect(rows.risksBySeverity.medium.map((risk) => risk.id)).toEqual(["risk-z", "risk-a"]);
  });
});
