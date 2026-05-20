import type { AttentionSummaryCard, AttentionSummaryGroup } from "./attentionViewTypes";

interface AttentionSummaryCounts {
  blockedTasks: number;
  criticalRisks: number;
  dueSoonTasks: number;
  failedReports: number;
  highRisks: number;
  manufacturingBlockers: number;
  overdueTasks: number;
  purchaseDelays: number;
  waitingQaTasks: number;
}

export function buildAttentionSummaryGroups({
  blockedTasks,
  criticalRisks,
  dueSoonTasks,
  failedReports,
  highRisks,
  manufacturingBlockers,
  overdueTasks,
  purchaseDelays,
  waitingQaTasks,
}: AttentionSummaryCounts): AttentionSummaryGroup[] {
  const cards: AttentionSummaryCard[] = [
    {
      category: "risk",
      helperLabel: "Needs mitigation task",
      id: "critical-risks",
      label: "Critical risks",
      targetGroupId: "critical-risks",
      value: criticalRisks,
    },
    {
      category: "risk",
      helperLabel: "Mitigation in progress",
      id: "high-risks",
      label: "High risks",
      targetGroupId: "high-risks",
      value: highRisks,
    },
    {
      category: "flow",
      helperLabel: "Need unblock plan",
      id: "blocked-tasks",
      label: "Blocked tasks",
      targetGroupId: "blocked-tasks",
      value: blockedTasks,
    },
    {
      category: "flow",
      helperLabel: "Mentor review needed",
      id: "waiting-qa",
      label: "Waiting QA",
      targetGroupId: "waiting-qa",
      value: waitingQaTasks,
    },
    {
      category: "flow",
      helperLabel: "Schedule pressure",
      id: "due-soon",
      label: "Due soon",
      targetGroupId: "due-soon",
      value: dueSoonTasks,
    },
    {
      category: "flow",
      helperLabel: "Schedule credibility risk",
      id: "overdue",
      label: "Overdue",
      targetGroupId: "overdue",
      value: overdueTasks,
    },
    {
      category: "supply",
      helperLabel: "Fabrication bottleneck",
      id: "manufacturing-blockers",
      label: "MFG blockers",
      targetGroupId: "manufacturing-blockers",
      value: manufacturingBlockers,
    },
    {
      category: "supply",
      helperLabel: "Part availability risk",
      id: "purchase-delays",
      label: "Purchase delays",
      targetGroupId: "purchase-delays",
      value: purchaseDelays,
    },
    {
      category: "quality",
      helperLabel: "Rework required",
      id: "failed-reports",
      label: "Failed QA/reports",
      targetGroupId: "failed-reports",
      value: failedReports,
    },
  ];

  return [
    {
      cards: cards.filter((card) => card.category === "risk"),
      id: "risk",
      label: "Risk",
    },
    {
      cards: cards.filter((card) => card.category === "flow"),
      id: "flow",
      label: "Flow",
    },
    {
      cards: cards.filter((card) => card.category === "supply"),
      id: "supply",
      label: "Supply",
    },
    {
      cards: cards.filter((card) => card.category === "quality"),
      id: "quality",
      label: "Quality",
    },
  ];
}
