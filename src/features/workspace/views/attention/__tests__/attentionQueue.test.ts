import { buildAttentionQueue } from "../attentionQueue";
import type { AttentionViewModel } from "../attentionViewTypes";

it("combines urgent, review and triage signals for one task without dropping reasons", () => {
  const model: AttentionViewModel = { summaryGroups: [], actionNowItems: [{ id: "urgent", recordId: "task-1", sourceType: "task", actionType: "open-task", title: "Repair sensor", reasons: ["blocked"], whyNow: "Blocked", nextAction: "Ask mentor", openLabel: "Open task", urgencyScore: 90 }], mentorQueueItems: [{ id: "review", recordId: "task-1", sourceType: "qa", actionType: "open-task", title: "Repair sensor", sourceLabel: "QA review", contextLabel: "Drive", ownerLabel: "Student", priorityLabel: "High", statusLabel: "Waiting", openLabel: "Open task" }], triageGroups: [{ id: "overdue", title: "Overdue", emptyLabel: "", items: [{ id: "late", recordId: "task-1", kind: "task", actionType: "open-task", title: "Repair sensor", contextLabel: "Drive", ownerLabel: "Student", severityLabel: "High", statusLabel: "Waiting", subtitle: "Due yesterday" }] }] };
  const rows = buildAttentionQueue(model);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ source: "qa", needsReview: true, recordId: "task-1" });
  expect(rows[0].reasons).toEqual(["Blocked", "Ask mentor", "QA review", "Overdue", "Due yesterday"]);
});

it("keeps different resource types with coincident IDs separate", () => {
  const item = { id: "x", recordId: "same", actionType: null, title: "Resource", reasons: [], whyNow: "Delayed", nextAction: "Inspect", openLabel: "Open", urgencyScore: 1 } as const;
  const rows = buildAttentionQueue({ summaryGroups: [], triageGroups: [], mentorQueueItems: [], actionNowItems: [{ ...item, reasons: [], sourceType: "purchase" }, { ...item, reasons: [], sourceType: "manufacturing" }] });
  expect(rows).toHaveLength(2);
});
