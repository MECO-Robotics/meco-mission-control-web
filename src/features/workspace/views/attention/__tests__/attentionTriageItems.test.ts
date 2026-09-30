import type { BootstrapPayload } from "@/types/bootstrap";
import type { AttentionLookup } from "../attentionActionNowShared";
import {
  buildAttentionTriageGroups,
  buildManufacturingTriageItems,
  buildPurchaseTriageItems,
} from "../attentionTriageItems";

const lookup = {
  membersById: { member: { name: "Morgan" } },
  projectsById: { project: { name: "Drive" } },
  subsystemsById: { subsystem: { name: "Sensor", projectId: "project" } },
  tasksById: {},
  taskByReportId: new Map(),
  workstreamsById: {},
} as unknown as AttentionLookup;

it("maps supply triage items and keeps them in their original groups", () => {
  const manufacturingItems = buildManufacturingTriageItems(
    [{
      id: "mfg-1",
      title: "Bracket run",
      subsystemId: "subsystem",
      requestedById: "member",
      dueDate: "2026-09-28T00:00:00Z",
      quantity: 4,
      status: "queued",
      mentorReviewed: false,
    }] as unknown as BootstrapPayload["manufacturingItems"],
    lookup,
  );
  const purchaseItems = buildPurchaseTriageItems(
    [{
      id: "purchase-1",
      title: "Bearing order",
      subsystemId: "subsystem",
      requestedById: null,
      vendor: "Acme",
      quantity: 2,
      status: "delayed",
    }] as unknown as BootstrapPayload["purchaseItems"],
    lookup,
  );

  expect(manufacturingItems[0]).toEqual({
    actionType: null,
    contextLabel: "Drive | Sensor",
    id: "manufacturing-mfg-1",
    kind: "manufacturing",
    ownerLabel: "Morgan",
    recordId: "mfg-1",
    severityLabel: "Needs review",
    statusLabel: "queued",
    subtitle: "Due 2026-09-28 | Qty 4",
    title: "Bracket run",
  });
  expect(purchaseItems[0]).toEqual({
    actionType: null,
    contextLabel: "Drive | Sensor",
    id: "purchase-purchase-1",
    kind: "purchase",
    ownerLabel: "Unassigned",
    recordId: "purchase-1",
    severityLabel: "Supply",
    statusLabel: "delayed",
    subtitle: "Acme | Qty 2",
    title: "Bearing order",
  });

  const groups = buildAttentionTriageGroups({
    blockedTasks: [],
    criticalRisks: [],
    dueSoonTasks: [],
    highRisks: [],
    manufacturingItems,
    overdueTasks: [],
    purchaseItems,
    reportItems: [],
    staleTasks: [],
    waitingQaTasks: [],
    lookup,
  });
  const manufacturingGroup = groups.find(({ id }) => id === "manufacturing-blockers");
  const purchaseGroup = groups.find(({ id }) => id === "purchase-delays");
  expect(manufacturingGroup).toMatchObject({
    title: "Manufacturing blockers",
  });
  expect(manufacturingGroup?.items).toBe(manufacturingItems);
  expect(purchaseGroup).toMatchObject({
    title: "Purchase delays",
  });
  expect(purchaseGroup?.items).toBe(purchaseItems);
});
