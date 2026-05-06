import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord, MilestoneRequirementRecord, TaskRecord } from "@/types/recordsExecution";
import type { TaskStatus } from "@/types/common";
import { TimelineTaskStatusLogo } from "@/features/workspace/views/timeline/TimelineTaskStatusLogo";
import {
  getTaskQueueBoardState,
  type TaskQueueBoardState,
} from "@/features/workspace/views/taskQueue/taskQueueKanbanBoardState";

type MilestoneTaskTarget = {
  targetId: string;
  targetType: MilestoneRequirementRecord["targetType"];
};

function parseRequirementIteration(conditionValue: string) {
  const normalized = conditionValue.trim().toLowerCase();
  const match = normalized.match(/^iteration\s*(?:([<>]=?|==|=)\s*)?(\d+)$/);
  if (!match) {
    return null;
  }

  const [, rawOperator, iterationText] = match;
  const iteration = Number.parseInt(iterationText, 10);
  if (!Number.isFinite(iteration)) {
    return null;
  }

  return {
    iteration: Math.max(1, Math.trunc(iteration)),
    operator: rawOperator === "==" || rawOperator === "=" || rawOperator === undefined ? "=" : rawOperator,
  } as const;
}

function getComparableIterationForTarget(
  target: MilestoneTaskTarget,
  bootstrap: BootstrapPayload,
) {
  if (target.targetType === "subsystem") {
    return bootstrap.subsystems.find((subsystem) => subsystem.id === target.targetId)?.iteration ?? null;
  }

  if (target.targetType === "mechanism") {
    return bootstrap.mechanisms.find((mechanism) => mechanism.id === target.targetId)?.iteration ?? null;
  }

  if (target.targetType === "part-instance") {
    const partInstance = bootstrap.partInstances.find((entry) => entry.id === target.targetId);
    if (!partInstance) {
      return null;
    }

    return (
      bootstrap.partDefinitions.find((partDefinition) => partDefinition.id === partInstance.partDefinitionId)
        ?.iteration ?? null
    );
  }

  return null;
}

function matchesIterationRequirement(
  requirement: MilestoneRequirementRecord,
  target: MilestoneTaskTarget,
  bootstrap: BootstrapPayload,
) {
  const parsed = parseRequirementIteration(requirement.conditionValue);
  if (!parsed) {
    return false;
  }

  const targetIteration = getComparableIterationForTarget(target, bootstrap);
  if (targetIteration === null) {
    return false;
  }

  if (parsed.operator === "=") {
    return targetIteration === parsed.iteration;
  }

  if (parsed.operator === ">=") {
    return targetIteration >= parsed.iteration;
  }

  if (parsed.operator === ">") {
    return targetIteration > parsed.iteration;
  }

  if (parsed.operator === "<=") {
    return targetIteration <= parsed.iteration;
  }

  if (parsed.operator === "<") {
    return targetIteration < parsed.iteration;
  }

  return false;
}

function getTaskTargets(task: TaskRecord): MilestoneTaskTarget[] {
  const workstreamTargetIds = new Set<string>(
    [task.workstreamId, ...task.workstreamIds].filter((targetId): targetId is string => Boolean(targetId)),
  );

  return [
    { targetType: "project", targetId: task.projectId },
    ...Array.from(workstreamTargetIds).map((targetId) => ({ targetType: "workflow" as const, targetId })),
    ...task.subsystemIds.map((targetId) => ({ targetType: "subsystem" as const, targetId })),
    ...task.mechanismIds.map((targetId) => ({ targetType: "mechanism" as const, targetId })),
    ...task.partInstanceIds.map((targetId) => ({ targetType: "part-instance" as const, targetId })),
    ...(task.artifactIds ?? []).map((targetId) => ({ targetType: "artifact" as const, targetId })),
  ];
}

function matchesMilestoneRequirement(
  requirement: MilestoneRequirementRecord,
  target: MilestoneTaskTarget,
  bootstrap: BootstrapPayload,
) {
  if (requirement.targetType !== target.targetType || requirement.targetId !== target.targetId) {
    return false;
  }

  if (requirement.conditionType === "custom") {
    return true;
  }

  if (requirement.conditionType === "iteration") {
    return matchesIterationRequirement(requirement, target, bootstrap);
  }

  return false;
}

export function getMilestoneRequirementsForMilestone(
  milestone: MilestoneRecord,
  bootstrap: BootstrapPayload,
) {
  return (bootstrap.milestoneRequirements ?? [])
    .filter((requirement) => requirement.milestoneId === milestone.id)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
}

export function getMilestoneRequirementTasks(
  requirement: MilestoneRequirementRecord,
  bootstrap: BootstrapPayload,
) {
  const matchedTaskIds = new Set<string>();

  bootstrap.tasks.forEach((task) => {
    const targets = getTaskTargets(task);
    if (
      targets.some((target) =>
        matchesMilestoneRequirement(requirement, target, bootstrap),
      )
    ) {
      matchedTaskIds.add(task.id);
    }
  });

  return bootstrap.tasks.filter((task) => matchedTaskIds.has(task.id));
}

export function getMilestoneTasksForState(
  milestone: MilestoneRecord,
  bootstrap: BootstrapPayload,
) {
  const directMilestoneTasks = bootstrap.tasks.filter(
    (task) => task.targetMilestoneId === milestone.id,
  );
  const milestoneRequirements = getMilestoneRequirementsForMilestone(milestone, bootstrap);

  if (milestoneRequirements.length === 0) {
    return directMilestoneTasks;
  }

  const matchedTaskIds = new Set(directMilestoneTasks.map((task) => task.id));

  bootstrap.tasks.forEach((task) => {
    if (matchedTaskIds.has(task.id)) {
      return;
    }

    const targets = getTaskTargets(task);
    if (
      targets.some((target) =>
        milestoneRequirements.some((requirement) =>
          matchesMilestoneRequirement(requirement, target, bootstrap),
        ),
      )
    ) {
      matchedTaskIds.add(task.id);
    }
  });

  return bootstrap.tasks.filter((task) => matchedTaskIds.has(task.id));
}

export function getMilestoneTaskBoardState(
  tasks: TaskRecord[],
  bootstrap: BootstrapPayload,
): TaskQueueBoardState {
  const states = tasks.map((task) => getTaskQueueBoardState(task, bootstrap));

  if (states.length === 0 || states.every((state) => state === "not-started")) {
    return "not-started";
  }

  if (states.every((state) => state === "complete")) {
    return "complete";
  }

  if (states.includes("blocked")) {
    return "blocked";
  }

  if (states.includes("in-progress")) {
    return "in-progress";
  }

  if (states.includes("waiting-on-dependency")) {
    return "waiting-on-dependency";
  }

  if (states.includes("waiting-for-qa")) {
    return "waiting-for-qa";
  }

  return "not-started";
}

export function getMilestoneTaskBoardStateForMilestone(
  milestone: MilestoneRecord,
  bootstrap: BootstrapPayload,
) {
  return getMilestoneTaskBoardState(getMilestoneTasksForState(milestone, bootstrap), bootstrap);
}

export function getMilestoneTaskBoardStateLabel(state: TaskQueueBoardState) {
  switch (state) {
    case "not-started":
      return "Not started";
    case "in-progress":
      return "In progress";
    case "blocked":
      return "Blocked";
    case "waiting-on-dependency":
      return "Waiting on dependency";
    case "waiting-for-qa":
      return "Waiting for QA";
    case "complete":
      return "Complete";
    default:
      return state;
  }
}

export function getMilestoneTaskBoardStateIconStatus(state: TaskQueueBoardState): TaskStatus {
  return state === "blocked" || state === "waiting-on-dependency" ? "not-started" : state;
}

export function MilestoneTaskStateIcon({
  compact = true,
  state,
}: {
  compact?: boolean;
  state: TaskQueueBoardState;
}) {
  return (
    <TimelineTaskStatusLogo
      compact={compact}
      signal={state}
      status={getMilestoneTaskBoardStateIconStatus(state)}
    />
  );
}
