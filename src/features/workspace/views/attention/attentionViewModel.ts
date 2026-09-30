import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getTaskPlanningState } from "@/features/workspace/shared/task/taskPlanning";
import { isTaskDueSoon } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import type { AttentionViewModel, AttentionTriageItem, AttentionNowItem } from "./attentionViewTypes";
import { isDateOverdue } from "./attentionViewHelpers";

export type { AttentionNowItem, AttentionReason, AttentionTriageGroup, AttentionTriageItem, AttentionViewModel, MentorActionQueueItem } from "./attentionViewTypes";

export function buildAttentionViewModel({ activePersonFilter, bootstrap }: { activePersonFilter: FilterSelection; bootstrap: BootstrapPayload }): AttentionViewModel {
  const membersById = new Map(bootstrap.members.map((member) => [member.id, member]));
  const projectsById = new Map(bootstrap.projects.map((project) => [project.id, project]));
  const tasksById = new Map(bootstrap.tasks.map((task) => [task.id, task]));
  const scopedTasks = bootstrap.tasks.filter((task) => filterSelectionMatchesTaskPeople(activePersonFilter, task));
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedRisks = bootstrap.risks.filter((risk) => activePersonFilter.length === 0 || risk.relatedTargets.some((ref) => ref.kind === "task" && scopedTaskIds.has(ref.id)) || (risk.mitigationTaskId ? scopedTaskIds.has(risk.mitigationTaskId) : false));
  const blockedTasks = scopedTasks.filter((task) => getTaskPlanningState(task, bootstrap) === "blocked");
  const waitingQaTasks = scopedTasks.filter((task) => task.status === "waiting-for-qa");
  const overdueTasks = scopedTasks.filter((task) => task.dueDate && isDateOverdue(task.dueDate));
  const dueSoonTasks = scopedTasks.filter((task) => task.dueDate && !isDateOverdue(task.dueDate) && isTaskDueSoon(task.dueDate, new Date()));
  const openRisks = scopedRisks.filter((risk) => risk.status !== "resolved");

  const taskRows = (tasks: typeof scopedTasks, status: string): AttentionTriageItem[] => tasks.map((task) => ({
    actionType: "open-task", contextLabel: projectsById.get(task.projectId)?.name ?? "Project", id: `task-${task.id}`, kind: "task",
    ownerLabel: task.ownerId ? membersById.get(task.ownerId)?.name ?? "Unassigned" : "Unassigned", recordId: task.id,
    severityLabel: task.priority, statusLabel: status, subtitle: task.summary, title: task.title,
  }));
  const riskRows: AttentionTriageItem[] = openRisks.map((risk) => ({
    actionType: "open-risk", contextLabel: projectsById.get(risk.projectId)?.name ?? "Project", id: `risk-${risk.id}`, kind: "risk",
    ownerLabel: risk.ownerGroupId ? bootstrap.responsibleGroups.find((group) => group.id === risk.ownerGroupId)?.name ?? "Unassigned" : "Unassigned",
    recordId: risk.id, severityLabel: risk.severity, statusLabel: risk.status, subtitle: risk.detail, title: risk.title,
  }));
  const groups = [
    { emptyLabel: "No risks in scope.", id: "open-risks", items: riskRows, title: "Open risks" },
    { emptyLabel: "No blocked tasks in scope.", id: "blocked-tasks", items: taskRows(blockedTasks, "Blocked"), title: "Blocked tasks" },
    { emptyLabel: "No tasks waiting for QA.", id: "waiting-qa", items: taskRows(waitingQaTasks, "Waiting for QA"), title: "Waiting for QA" },
    { emptyLabel: "No tasks due soon.", id: "due-soon", items: taskRows(dueSoonTasks, "Due soon"), title: "Tasks due soon" },
    { emptyLabel: "No overdue tasks.", id: "overdue", items: taskRows(overdueTasks, "Overdue"), title: "Overdue tasks" },
  ];
  const actionNowItems: AttentionNowItem[] = [
    ...blockedTasks.map((task) => ({ actionType: "open-task" as const, contextLabel: projectsById.get(task.projectId)?.name, id: `blocked-${task.id}`, nextAction: "Review the linked risk or dependency and agree on the unblock plan.", openLabel: "Open task", recordId: task.id, reasons: ["blocked" as const], sourceType: "task" as const, title: task.title, urgencyScore: 90, whyNow: "This task is blocked." })),
    ...openRisks.filter((risk) => risk.severity === "critical" || risk.severity === "high").map((risk) => ({ actionType: "open-risk" as const, contextLabel: projectsById.get(risk.projectId)?.name, id: `risk-${risk.id}`, nextAction: risk.blocksWork ? "Review the blocking risk and assign mitigation work." : "Review the risk owner and next action.", openLabel: "Open risk", recordId: risk.id, reasons: [risk.blocksWork ? "blocked" as const : "high-risk" as const], sourceType: "risk" as const, title: risk.title, urgencyScore: risk.blocksWork ? 95 : 70, whyNow: risk.detail })),
  ];
  return { actionNowItems, mentorQueueItems: [], triageGroups: groups };
}
