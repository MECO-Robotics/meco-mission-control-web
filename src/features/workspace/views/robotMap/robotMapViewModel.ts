import type { BootstrapPayload } from "@/types/bootstrap";

type ReadinessState = "blocked" | "at-risk" | "ready";

export interface RobotMapSummaryModel {
  activeRiskCount: number;
  mechanismCount: number;
  openTaskCount: number;
  partInstanceCount: number;
  subsystemCount: number;
}

export interface RobotMapMechanismModel {
  activeHighRiskCount: number;
  id: string;
  manufacturingIncompleteCount: number;
  name: string;
  openTaskCount: number;
  partInstanceCount: number;
  record: BootstrapPayload["mechanisms"][number];
  waitingQaCount: number;
}

export interface RobotMapSubsystemModel {
  blockedTaskCount: number;
  id: string;
  manufacturingIncompleteCount: number;
  mechanismCount: number;
  mechanisms: RobotMapMechanismModel[];
  name: string;
  openTaskCount: number;
  partInstanceCount: number;
  record: BootstrapPayload["subsystems"][number];
  readinessState: ReadinessState;
  waitingQaCount: number;
}

export interface RobotMapViewModel {
  summary: RobotMapSummaryModel;
  subsystems: RobotMapSubsystemModel[];
}

function buildTaskMechanismIds(
  task: BootstrapPayload["tasks"][number],
  partInstanceToMechanismId: Record<string, string | null>,
) {
  const candidateIds = [
    ...task.mechanismIds,
    task.mechanismId,
    ...task.partInstanceIds.map((partInstanceId) => partInstanceToMechanismId[partInstanceId] ?? null),
    task.partInstanceId ? partInstanceToMechanismId[task.partInstanceId] ?? null : null,
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(candidateIds));
}

function buildRiskMechanismIds(args: {
  mechanismIdsByTaskId: Record<string, string[]>;
  partInstanceToMechanismId: Record<string, string | null>;
  reportTaskIdByReportId: Record<string, string | null>;
  risk: BootstrapPayload["risks"][number];
}) {
  const { mechanismIdsByTaskId, partInstanceToMechanismId, reportTaskIdByReportId, risk } = args;

  if (risk.attachmentType === "mechanism") {
    return [risk.attachmentId];
  }

  if (risk.attachmentType === "part-instance") {
    const mechanismId = partInstanceToMechanismId[risk.attachmentId];
    return mechanismId ? [mechanismId] : [];
  }

  const sourceTaskId = reportTaskIdByReportId[risk.sourceId];
  if (sourceTaskId) {
    return mechanismIdsByTaskId[sourceTaskId] ?? [];
  }

  return [];
}

function resolveSubsystemReadiness(args: {
  blockedTaskCount: number;
  highRiskCount: number;
  manufacturingIncompleteCount: number;
  waitingQaCount: number;
}): ReadinessState {
  const { blockedTaskCount, highRiskCount, manufacturingIncompleteCount, waitingQaCount } = args;

  if (blockedTaskCount > 0 || highRiskCount > 0) {
    return "blocked";
  }

  if (waitingQaCount > 0 || manufacturingIncompleteCount > 0) {
    return "at-risk";
  }

  return "ready";
}

export function buildRobotMapViewModel(bootstrap: BootstrapPayload): RobotMapViewModel {
  const partInstanceToMechanismId = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance.mechanismId] as const),
  );
  const reportTaskIdByReportId = Object.fromEntries(
    bootstrap.reports.map((report) => [report.id, report.taskId] as const),
  );
  const mechanismsBySubsystemId = bootstrap.mechanisms.reduce<Record<string, BootstrapPayload["mechanisms"]>>(
    (result, mechanism) => {
      result[mechanism.subsystemId] = result[mechanism.subsystemId] ?? [];
      result[mechanism.subsystemId].push(mechanism);
      return result;
    },
    {},
  );

  const mechanismIdsByTaskId = bootstrap.tasks.reduce<Record<string, string[]>>((result, task) => {
    result[task.id] = buildTaskMechanismIds(task, partInstanceToMechanismId);
    return result;
  }, {});
  const mechanismTaskMap = bootstrap.tasks.reduce<Record<string, BootstrapPayload["tasks"]>>(
    (result, task) => {
      const mechanismIds = mechanismIdsByTaskId[task.id];
      mechanismIds.forEach((mechanismId) => {
        result[mechanismId] = result[mechanismId] ?? [];
        result[mechanismId].push(task);
      });
      return result;
    },
    {},
  );
  const mechanismPartMap = bootstrap.partInstances.reduce<Record<string, BootstrapPayload["partInstances"]>>(
    (result, partInstance) => {
      if (!partInstance.mechanismId) {
        return result;
      }

      result[partInstance.mechanismId] = result[partInstance.mechanismId] ?? [];
      result[partInstance.mechanismId].push(partInstance);
      return result;
    },
    {},
  );
  const mechanismRiskMap = bootstrap.risks.reduce<Record<string, BootstrapPayload["risks"]>>(
    (result, risk) => {
      buildRiskMechanismIds({
        mechanismIdsByTaskId,
        partInstanceToMechanismId,
        reportTaskIdByReportId,
        risk,
      }).forEach((mechanismId) => {
        result[mechanismId] = result[mechanismId] ?? [];
        result[mechanismId].push(risk);
      });
      return result;
    },
    {},
  );
  const mechanismManufacturingMap = bootstrap.manufacturingItems.reduce<
    Record<string, BootstrapPayload["manufacturingItems"]>
  >((result, item) => {
    const linkedPartInstanceIds = [item.partInstanceId, ...item.partInstanceIds].filter(
      (partInstanceId): partInstanceId is string => Boolean(partInstanceId),
    );
    const linkedMechanismIds = Array.from(
      new Set(
        linkedPartInstanceIds
          .map((partInstanceId) => partInstanceToMechanismId[partInstanceId])
          .filter((mechanismId): mechanismId is string => Boolean(mechanismId)),
      ),
    );

    linkedMechanismIds.forEach((mechanismId) => {
      result[mechanismId] = result[mechanismId] ?? [];
      result[mechanismId].push(item);
    });
    return result;
  }, {});

  const subsystemModels = [...bootstrap.subsystems]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map<RobotMapSubsystemModel>((subsystem) => {
      const subsystemMechanisms = [...(mechanismsBySubsystemId[subsystem.id] ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      const subsystemTasks = bootstrap.tasks.filter(
        (task) =>
          task.subsystemId === subsystem.id || task.subsystemIds.includes(subsystem.id),
      );
      const subsystemManufacturingItems = bootstrap.manufacturingItems.filter(
        (item) => item.subsystemId === subsystem.id && item.status !== "complete",
      );

      const mechanisms = subsystemMechanisms.map<RobotMapMechanismModel>((mechanism) => {
        const mechanismTasks = mechanismTaskMap[mechanism.id] ?? [];
        const mechanismRisks = mechanismRiskMap[mechanism.id] ?? [];
        const mechanismManufacturingItems = mechanismManufacturingMap[mechanism.id] ?? [];
        const openTaskCount = mechanismTasks.filter((task) => task.status !== "complete").length;
        const waitingQaCount = mechanismTasks.filter((task) => task.status === "waiting-for-qa").length;
        const activeHighRiskCount = mechanismRisks.filter((risk) => risk.severity === "high").length;
        const manufacturingIncompleteCount = mechanismManufacturingItems.filter(
          (item) => item.status !== "complete",
        ).length;

        return {
          activeHighRiskCount,
          id: mechanism.id,
          manufacturingIncompleteCount,
          name: mechanism.name,
          openTaskCount,
          partInstanceCount: (mechanismPartMap[mechanism.id] ?? []).length,
          record: mechanism,
          waitingQaCount,
        };
      });

      const blockedTaskCount = subsystemTasks.filter(
        (task) =>
          task.isBlocked ||
          task.blockers.length > 0 ||
          task.planningState === "blocked" ||
          task.planningState === "waiting-on-dependency",
      ).length;
      const waitingQaCount = subsystemTasks.filter((task) => task.status === "waiting-for-qa").length;
      const highRiskCount = mechanisms.reduce((total, mechanism) => total + mechanism.activeHighRiskCount, 0);
      const manufacturingIncompleteCount = subsystemManufacturingItems.length;

      return {
        blockedTaskCount,
        id: subsystem.id,
        manufacturingIncompleteCount,
        mechanismCount: mechanisms.length,
        mechanisms,
        name: subsystem.name,
        openTaskCount: subsystemTasks.filter((task) => task.status !== "complete").length,
        partInstanceCount: bootstrap.partInstances.filter(
          (partInstance) => partInstance.subsystemId === subsystem.id,
        ).length,
        record: subsystem,
        readinessState: resolveSubsystemReadiness({
          blockedTaskCount,
          highRiskCount,
          manufacturingIncompleteCount,
          waitingQaCount,
        }),
        waitingQaCount,
      };
    });

  return {
    subsystems: subsystemModels,
    summary: {
      activeRiskCount: bootstrap.risks.filter((risk) => risk.severity === "high").length,
      mechanismCount: bootstrap.mechanisms.length,
      openTaskCount: bootstrap.tasks.filter((task) => task.status !== "complete").length,
      partInstanceCount: bootstrap.partInstances.length,
      subsystemCount: bootstrap.subsystems.length,
    },
  };
}
