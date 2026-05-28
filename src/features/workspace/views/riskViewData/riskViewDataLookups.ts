import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskRecord } from "@/types/recordsReporting";

import type { SelectOption } from "./riskViewDataPayload";
import type { RiskViewScopeData } from "./riskViewScopeTypes";

export interface RiskViewLookups {
  attachmentOptionsForType: (attachmentType: RiskRecord["attachmentType"]) => SelectOption[];
  getAttachmentLabel: (risk: RiskRecord) => string;
  getMitigationLabel: (risk: RiskRecord) => string;
  getSourceLabel: (risk: RiskRecord) => string;
  mechanismAttachmentOptions: SelectOption[];
  mitigationTaskOptions: SelectOption[];
  partInstanceAttachmentOptions: SelectOption[];
  projectAttachmentOptions: SelectOption[];
  qaSourceOptions: SelectOption[];
  sourceOptionsForType: (sourceType: RiskRecord["sourceType"]) => SelectOption[];
  testSourceOptions: SelectOption[];
  workstreamAttachmentOptions: SelectOption[];
}

interface BuildRiskViewLookupsArgs {
  bootstrap: BootstrapPayload;
  scope: RiskViewScopeData;
}

export function buildRiskViewLookups({
  bootstrap,
  scope,
}: BuildRiskViewLookupsArgs): RiskViewLookups {
  const tasksById = Object.fromEntries(scope.scopedTasks.map((task) => [task.id, task] as const));
  const projectsById = Object.fromEntries(bootstrap.projects.map((project) => [project.id, project] as const));
  const workstreamsById = Object.fromEntries(
    bootstrap.workstreams.map((workstream) => [workstream.id, workstream] as const),
  );
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  );
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
  );
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const),
  );
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
  );
  const milestonesById = Object.fromEntries(bootstrap.milestones.map((milestone) => [milestone.id, milestone] as const));
  const testResultsById = Object.fromEntries(
    scope.scopedReports
      .filter((report) => report.reportType !== "QA")
      .map((testResult) => [testResult.id, testResult] as const),
  );
  const qaReportsById = Object.fromEntries(
    scope.scopedReports
      .filter((report) => report.reportType === "QA")
      .map((qaReport) => [qaReport.id, qaReport] as const),
  );

  const qaSourceOptions = scope.scopedReports
    .filter((report) => report.reportType === "QA")
    .map((qaReport) => {
      const taskTitle = tasksById[qaReport.taskId ?? ""]?.title ?? "Unknown task";
      return {
        id: qaReport.id,
        name: `${taskTitle} (${qaReport.reviewedAt})`,
      };
    });
  const testSourceOptions = scope.scopedReports
    .filter((report) => report.reportType !== "QA")
    .map((testResult) => {
      const milestoneTitle = milestonesById[testResult.milestoneId ?? ""]?.title ?? "Unknown milestone";
      return {
        id: testResult.id,
        name: `${testResult.title} (${milestoneTitle})`,
      };
    });
  const projectAttachmentOptions = bootstrap.projects.map((project) => ({
    id: project.id,
    name: project.name,
  }));
  const workstreamAttachmentOptions = bootstrap.workstreams.map((workstream) => ({
    id: workstream.id,
    name: `${workstream.name} (${projectsById[workstream.projectId]?.name ?? "Unknown project"})`,
  }));
  const mechanismAttachmentOptions = bootstrap.mechanisms.map((mechanism) => ({
    id: mechanism.id,
    name: `${mechanism.name} (${subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem"})`,
  }));
  const partInstanceAttachmentOptions = bootstrap.partInstances.map((partInstance) => {
    const partDefinitionName =
      partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part";
    return {
      id: partInstance.id,
      name: `${partInstance.name} (${partDefinitionName})`,
    };
  });
  const mitigationTaskOptions = scope.scopedTasks.map((task) => ({
    id: task.id,
    name: task.title,
  }));

  const sourceOptionsForType = (sourceType: RiskRecord["sourceType"]) =>
    sourceType === "qa-report" ? qaSourceOptions : testSourceOptions;
  const attachmentOptionsForType = (attachmentType: RiskRecord["attachmentType"]) => {
    switch (attachmentType) {
      case "project":
        return projectAttachmentOptions;
      case "workstream":
        return workstreamAttachmentOptions;
      case "mechanism":
        return mechanismAttachmentOptions;
      case "part-instance":
        return partInstanceAttachmentOptions;
      default:
        return projectAttachmentOptions;
    }
  };

  const getSourceLabel = (risk: RiskRecord) => {
    if (risk.sourceType === "qa-report") {
      const report = qaReportsById[risk.sourceId];
      if (!report) {
        return "Unknown QA report";
      }

      return tasksById[report.taskId ?? ""]?.title ?? "Unknown task";
    }

    const testResult = testResultsById[risk.sourceId];
    if (!testResult) {
      return "Unknown test result";
    }

    return testResult.title ?? "Unknown test result";
  };

  const getAttachmentLabel = (risk: RiskRecord) => {
    switch (risk.attachmentType) {
      case "project":
        return projectsById[risk.attachmentId]?.name ?? "Unknown project";
      case "workstream":
        return workstreamsById[risk.attachmentId]?.name ?? "Unknown workflow";
      case "mechanism": {
        const mechanism = mechanismsById[risk.attachmentId];
        if (!mechanism) {
          return "Unknown mechanism";
        }

        const subsystemName = subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem";
        return `${mechanism.name} (${subsystemName})`;
      }
      case "part-instance": {
        const partInstance = partInstancesById[risk.attachmentId];
        if (!partInstance) {
          return "Unknown part instance";
        }

        const partDefinitionName =
          partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part";
        return `${partInstance.name} (${partDefinitionName})`;
      }
      default:
        return "Unknown attachment";
    }
  };

  const getMitigationLabel = (risk: RiskRecord) =>
    risk.mitigationTaskId ? tasksById[risk.mitigationTaskId]?.title ?? "Unknown task" : "None";

  return {
    attachmentOptionsForType,
    getAttachmentLabel,
    getMitigationLabel,
    getSourceLabel,
    mechanismAttachmentOptions,
    mitigationTaskOptions,
    partInstanceAttachmentOptions,
    projectAttachmentOptions,
    qaSourceOptions,
    sourceOptionsForType,
    testSourceOptions,
    workstreamAttachmentOptions,
  };
}
