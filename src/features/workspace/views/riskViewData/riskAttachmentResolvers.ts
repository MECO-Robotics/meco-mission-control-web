import type { CSSProperties } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskRecord } from "@/types/recordsReporting";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";

type Lookups = {
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  tasksById: Record<string, BootstrapPayload["tasks"][number]>;
  reportsById: Record<string, BootstrapPayload["reports"][number]>;
};

function buildById<T extends { id: string }>(items: T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item] as const)) as Record<string, T>;
}

export function buildRiskAttachmentLookups(bootstrap: BootstrapPayload): Lookups {
  return {
    projectsById: buildById(bootstrap.projects),
    workstreamsById: buildById(bootstrap.workstreams),
    mechanismsById: buildById(bootstrap.mechanisms),
    partInstancesById: buildById(bootstrap.partInstances),
    subsystemsById: buildById(bootstrap.subsystems),
    tasksById: buildById(bootstrap.tasks),
    reportsById: buildById(bootstrap.reports),
  };
}

function getRiskSourceTask(risk: RiskRecord, lookups: Lookups) {
  const source = lookups.reportsById[risk.sourceId];
  return source?.taskId ? lookups.tasksById[source.taskId] : null;
}

export function getRiskProjectLabel(risk: RiskRecord, lookups: Lookups) {
  if (risk.attachmentType === "project") {
    return lookups.projectsById[risk.attachmentId]?.name ?? "Unknown project";
  }

  if (risk.attachmentType === "workstream") {
    const workstream = lookups.workstreamsById[risk.attachmentId];
    return workstream ? lookups.projectsById[workstream.projectId]?.name ?? "Unknown project" : "Unknown project";
  }

  if (risk.attachmentType === "mechanism") {
    const mechanism = lookups.mechanismsById[risk.attachmentId];
    const subsystem = mechanism ? lookups.subsystemsById[mechanism.subsystemId] : null;
    return subsystem ? lookups.projectsById[subsystem.projectId]?.name ?? "Unknown project" : "Unknown project";
  }

  if (risk.attachmentType === "part-instance") {
    const partInstance = lookups.partInstancesById[risk.attachmentId];
    const subsystem = partInstance ? lookups.subsystemsById[partInstance.subsystemId] : null;
    return subsystem ? lookups.projectsById[subsystem.projectId]?.name ?? "Unknown project" : "Unknown project";
  }

  const sourceTask = getRiskSourceTask(risk, lookups);
  return sourceTask ? lookups.projectsById[sourceTask.projectId]?.name ?? "Unknown project" : "Unknown project";
}

export function getRiskWorkflowLabel(risk: RiskRecord, lookups: Lookups) {
  if (risk.attachmentType === "workstream") {
    return lookups.workstreamsById[risk.attachmentId]?.name ?? "Unknown workflow";
  }

  const sourceTask = getRiskSourceTask(risk, lookups);
  const workflowId = sourceTask?.workstreamId || sourceTask?.workstreamIds?.[0];
  return workflowId
    ? lookups.workstreamsById[workflowId]?.name ?? "Unknown workflow"
    : "Unassigned workflow";
}

function getRiskWorkflowColor(risk: RiskRecord, lookups: Lookups) {
  if (risk.attachmentType === "workstream") {
    const workstream = lookups.workstreamsById[risk.attachmentId];
    const workflowId = workstream ? workstream.id : risk.attachmentId;
    return resolveWorkspaceColor(workstream?.color, workflowId);
  }

  const sourceTask = getRiskSourceTask(risk, lookups);
  const workflowId = sourceTask?.workstreamId || sourceTask?.workstreamIds?.[0];
  return workflowId && lookups.workstreamsById[workflowId]
    ? resolveWorkspaceColor(lookups.workstreamsById[workflowId]?.color, workflowId)
    : resolveWorkspaceColor(null, risk.id);
}

export function getWorkflowChipStyle(risk: RiskRecord, lookups: Lookups): CSSProperties {
  const workflowColor = getRiskWorkflowColor(risk, lookups);
  return {
    "--task-queue-board-card-context-accent": workflowColor,
    "--task-queue-board-card-context-bg": `color-mix(in srgb, ${workflowColor} 24%, transparent)`,
    "--task-queue-board-card-context-border": `color-mix(in srgb, ${workflowColor} 54%, transparent)`,
  } as CSSProperties;
}

export function getRiskMechanismLabel(risk: RiskRecord, lookups: Lookups) {
  if (risk.attachmentType === "mechanism") {
    return lookups.mechanismsById[risk.attachmentId]?.name ?? null;
  }

  if (risk.attachmentType === "part-instance") {
    const partInstance = lookups.partInstancesById[risk.attachmentId];
    if (partInstance?.mechanismId) {
      return lookups.mechanismsById[partInstance.mechanismId]?.name ?? null;
    }
  }

  const sourceTask = getRiskSourceTask(risk, lookups);
  const mechanismId = sourceTask?.mechanismId || sourceTask?.mechanismIds?.[0];
  return mechanismId ? lookups.mechanismsById[mechanismId]?.name ?? null : null;
}
