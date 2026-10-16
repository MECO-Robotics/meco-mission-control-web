import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { parseLocalDate } from "@/lib/dateUtils";
import { buildAttentionQueue, type AttentionQueueRow } from "../attention/attentionQueue";
import { filterRiskTriageRows, type RiskTriageFilters } from "./riskTriageModel";

export type AreaSegment = "blocked" | "dependency" | "qa" | "other";
export type DeadlineBucketId = "overdue" | "today" | "soon" | "later" | "undated";
export type RiskChartSelection =
  | { kind: "area"; areaId: string; segment?: AreaSegment }
  | { kind: "deadline"; source: "risk" | "task"; bucket: DeadlineBucketId };
export interface AreaPressure {
  id: string;
  label: string;
  projectId: string;
  projectLabel: string;
  taskCount: number;
  blocked: number;
  dependency: number;
  qa: number;
  other: number;
}
export interface DeadlineBucket { id: DeadlineBucketId; label: string; taskCount: number; riskCount: number }

function taskSegment(row: AttentionQueueRow): AreaSegment {
  return row.planningState === "blocked" ? "blocked" : row.planningState === "waiting-on-dependency" ? "dependency" : row.status === "waiting-for-qa" ? "qa" : "other";
}

function deadlineBucket(value: string | null, today: Date): DeadlineBucketId {
  const due = value ? parseLocalDate(value) : null;
  if (!due) return "undated";
  const day = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const difference = (day - now) / 86400000;
  return difference < 0 ? "overdue" : difference === 0 ? "today" : difference <= 7 ? "soon" : "later";
}

export function buildRiskDashboard({ bootstrap, activePersonFilter, filters, includeResolvedRisks = false, selection = null, today = new Date() }: {
  bootstrap: BootstrapPayload;
  activePersonFilter: FilterSelection;
  filters: RiskTriageFilters;
  includeResolvedRisks?: boolean;
  selection?: RiskChartSelection | null;
  today?: Date;
}) {
  const rows = filterRiskTriageRows(buildAttentionQueue({ bootstrap, activePersonFilter, includeResolvedRisks, includeAllUnfinishedTasks: true, today }), filters);
  const projects = new Map(bootstrap.projects.map(project => [project.id, project.name]));
  const risks = new Map(bootstrap.risks.map(risk => [risk.id, risk]));
  const areaMap = new Map<string, AreaPressure>();
  const deadlines: DeadlineBucket[] = [
    { id: "overdue", label: "Overdue", taskCount: 0, riskCount: 0 },
    { id: "today", label: "Today", taskCount: 0, riskCount: 0 },
    { id: "soon", label: "Next 7 days", taskCount: 0, riskCount: 0 },
    { id: "later", label: "Later", taskCount: 0, riskCount: 0 },
    { id: "undated", label: "No valid date", taskCount: 0, riskCount: 0 },
  ];
  for (const row of rows) {
    if (row.source === "risk" && row.status === "resolved") continue;
    const bucket = deadlines.find(item => item.id === deadlineBucket(row.dueDate, today))!;
    if (row.source === "task") {
      bucket.taskCount++;
      for (const [index, id] of [...new Set(row.areaIds ?? [])].entries()) {
        let area = areaMap.get(id);
        if (!area) {
          area = { id, label: row.areaLabels?.[index] ?? "No subsystem", projectId: row.projectId ?? "", projectLabel: projects.get(row.projectId ?? "") ?? "Project", taskCount: 0, blocked: 0, dependency: 0, qa: 0, other: 0 };
          areaMap.set(id, area);
        }
        area.taskCount++;
        area[taskSegment(row)]++;
      }
    } else {
      bucket.riskCount++;
    }
  }
  const selectedTaskIds = new Set(rows.filter(row => row.source === "task" && selection?.kind === "area" && row.areaIds?.includes(selection.areaId) && (!selection.segment || taskSegment(row) === selection.segment)).map(row => row.recordId));
  const queueRows = rows.filter(row => {
    if (!selection) return row.source === "risk" || row.signals.some(signal => signal !== "unassigned");
    if (selection.kind === "deadline") return row.source === selection.source && row.status !== "resolved" && deadlineBucket(row.dueDate, today) === selection.bucket;
    if (row.source === "task") return selectedTaskIds.has(row.recordId);
    return selection.segment ? row.affectedTaskIds?.some(id => selectedTaskIds.has(id)) || selectedTaskIds.has(risks.get(row.recordId)?.mitigationTaskId ?? "") : row.areaIds?.includes(selection.areaId);
  });
  const areas = [...areaMap.values()].sort((a, b) => (b.blocked + b.dependency) - (a.blocked + a.dependency) || b.qa - a.qa || b.taskCount - a.taskCount || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  return { rows, queueRows, areas, deadlines };
}
