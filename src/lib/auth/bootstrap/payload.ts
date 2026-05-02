import type {
  ArtifactRecord,
  BootstrapPayload,
  EventRecord,
  ReportFindingRecord,
  ReportRecord,
  TaskDependencyRecord,
} from "@/types";
import { resolveWorkspaceColor } from "@/features/workspace/shared/workspaceColors";
import { localTodayDate } from "@/lib/dateUtils";
import { normalizePlanningRecords, type LegacyBootstrapPayload } from "./planning";

function isArtifactKind(value: unknown): value is ArtifactRecord["kind"] {
  return value === "document" || value === "nontechnical";
}

function isArtifactStatus(value: unknown): value is ArtifactRecord["status"] {
  return value === "draft" || value === "in-review" || value === "published";
}

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function normalizeBootstrapPayload(payload: BootstrapPayload): BootstrapPayload {
  const source = payload as LegacyBootstrapPayload;
  const planning = normalizePlanningRecords(source);
  const defaultSeasonId = planning.seasons[0]?.id ?? "season-default";
  const defaultProjectId = planning.projects[0]?.id ?? "project-default";
  const projectIds = new Set(planning.projects.map((project) => project.id));
  const workstreamsById = new Map(
    planning.workstreams.map((workstream) => [workstream.id, workstream] as const),
  );
  const artifacts: ArtifactRecord[] = (source.artifacts ?? []).map((artifact, index) => {
    const projectId =
      planning.projectIdAliases.get(artifact.projectId ?? "") ??
      (typeof artifact.projectId === "string" && projectIds.has(artifact.projectId)
        ? artifact.projectId
        : null) ??
      defaultProjectId;
    const requestedWorkstreamId =
      typeof artifact.workstreamId === "string" && artifact.workstreamId.trim().length > 0
        ? artifact.workstreamId
        : null;
    const workstream = requestedWorkstreamId ? workstreamsById.get(requestedWorkstreamId) : null;
    const workstreamId = workstream && workstream.projectId === projectId ? workstream.id : null;

    return {
      id: artifact.id ?? `artifact-${index + 1}`,
      projectId,
      workstreamId,
      kind: isArtifactKind(artifact.kind) ? artifact.kind : "document",
      title: artifact.title ?? `Artifact ${index + 1}`,
      summary: artifact.summary ?? "",
      status: isArtifactStatus(artifact.status) ? artifact.status : "draft",
      link: artifact.link ?? "",
      isArchived: artifact.isArchived ?? false,
      updatedAt:
        typeof artifact.updatedAt === "string" && artifact.updatedAt.trim().length > 0
          ? artifact.updatedAt
          : new Date().toISOString(),
    };
  });
  const subsystems = (source.subsystems ?? []).map((subsystem) => ({
    ...subsystem,
    color: resolveWorkspaceColor(
      subsystem.color,
      `${subsystem.projectId ?? defaultProjectId}:${subsystem.id}:${subsystem.name}`,
      subsystem.iteration ?? 0,
    ),
    isArchived: subsystem.isArchived ?? false,
    projectId:
      planning.projectIdAliases.get(subsystem.projectId ?? "") ??
      (typeof subsystem.projectId === "string" && projectIds.has(subsystem.projectId)
        ? subsystem.projectId
        : null) ??
      defaultProjectId,
  }));
  const subsystemProjectIdsById = new Map(
    subsystems.map((subsystem) => [subsystem.id, subsystem.projectId] as const),
  );
  const events: EventRecord[] = (source.events ?? []).map((event, index) => {
    const relatedSubsystemIds = Array.isArray(event.relatedSubsystemIds)
      ? event.relatedSubsystemIds.filter(
          (subsystemId): subsystemId is string =>
            typeof subsystemId === "string" && subsystemId.length > 0,
        )
      : [];
    const explicitProjectIds = Array.isArray(event.projectIds)
      ? Array.from(
          new Set(
            event.projectIds
              .map((projectId) =>
                typeof projectId === "string"
                  ? planning.projectIdAliases.get(projectId) ??
                    (projectIds.has(projectId) ? projectId : null)
                  : null,
              )
              .filter((projectId): projectId is string => Boolean(projectId)),
          ),
        )
      : [];
    const inferredProjectIds = Array.from(
      new Set(
        relatedSubsystemIds
          .map((subsystemId) => subsystemProjectIdsById.get(subsystemId))
          .filter((projectId): projectId is string => Boolean(projectId)),
      ),
    );
    const fallbackEventDate = planning.seasons[0]?.startDate ?? localTodayDate();

    return {
      id: event.id ?? `event-${index + 1}`,
      title: event.title ?? `Event ${index + 1}`,
      type: event.type ?? "internal-review",
      startDateTime: event.startDateTime ?? `${fallbackEventDate}T12:00:00`,
      endDateTime: event.endDateTime ?? null,
      isExternal: event.isExternal ?? false,
      description: event.description ?? "",
      projectIds: explicitProjectIds.length > 0 ? explicitProjectIds : inferredProjectIds,
      relatedSubsystemIds,
    };
  });
  const reports: ReportRecord[] = (
    Array.isArray(source.reports) && source.reports.length > 0
      ? source.reports
      : [
          ...(source.qaReports ?? []).map<ReportRecord>((report) => ({
            ...report,
            reportType: "QA",
            projectId:
              planning.projectIdAliases.get(report.projectId ?? "") ??
              (typeof report.projectId === "string" && projectIds.has(report.projectId)
                ? report.projectId
                : null) ??
              defaultProjectId,
            taskId: report.taskId ?? null,
            eventId: null,
            workstreamId: report.workstreamId ?? null,
            createdByMemberId: report.createdByMemberId ?? null,
            result: report.result ?? "pass",
            summary: report.summary ?? report.notes ?? "",
            notes: report.notes ?? "",
            createdAt: report.createdAt ?? report.reviewedAt ?? localTodayDate(),
          })),
          ...(source.testResults ?? []).map<ReportRecord>((result) => ({
            ...result,
            reportType: "EventTest",
            projectId:
              planning.projectIdAliases.get(result.projectId ?? "") ??
              (typeof result.projectId === "string" && projectIds.has(result.projectId)
                ? result.projectId
                : null) ??
              defaultProjectId,
            taskId: result.taskId ?? null,
            eventId: result.eventId ?? null,
            workstreamId: result.workstreamId ?? null,
            createdByMemberId: result.createdByMemberId ?? null,
            result: result.result ?? result.status ?? "pass",
            summary: result.summary ?? result.title ?? "",
            notes: result.notes ?? result.findings?.join("\n") ?? "",
            createdAt: result.createdAt ?? localTodayDate(),
            title: result.title ?? "",
            status: result.status ?? "pass",
            findings: result.findings ?? [],
          })),
        ]
  ).map((report) => ({
    ...report,
    reportType:
      report.reportType === "QA" ||
      report.reportType === "EventTest" ||
      report.reportType === "Practice" ||
      report.reportType === "Competition" ||
      report.reportType === "Review"
        ? report.reportType
        : "QA",
    taskId: report.taskId ?? null,
    eventId: report.eventId ?? null,
    workstreamId: report.workstreamId ?? null,
    createdByMemberId: report.createdByMemberId ?? null,
    result: report.result ?? "pass",
    summary: report.summary ?? "",
    notes: report.notes ?? "",
    createdAt: report.createdAt ?? localTodayDate(),
  }));

  const reportsById = new Map(reports.map((report) => [report.id, report] as const));
  const reportFindings: ReportFindingRecord[] = (
    Array.isArray(source.reportFindings) && source.reportFindings.length > 0
      ? source.reportFindings
      : [
          ...(source.qaFindings ?? []).map<ReportFindingRecord>((finding) => ({
            ...finding,
            reportId: finding.qaReportId ?? "",
            mechanismId: null,
            partInstanceId: null,
            artifactInstanceId: null,
            issueType: finding.title ?? "",
            severity: finding.severity ?? "low",
            notes: finding.detail ?? "",
            spawnedTaskId: finding.taskId ?? null,
            spawnedIterationId: null,
            spawnedRiskId: null,
          })),
          ...(source.testFindings ?? []).map<ReportFindingRecord>((finding) => ({
            ...finding,
            reportId: finding.testResultId ?? "",
            mechanismId: null,
            partInstanceId: null,
            artifactInstanceId: null,
            issueType: finding.title ?? "",
            severity: finding.severity ?? "low",
            notes: finding.detail ?? "",
            spawnedTaskId: finding.taskId ?? null,
            spawnedIterationId: null,
            spawnedRiskId: null,
          })),
        ]
  ).map((finding) => ({
    ...finding,
    mechanismId: finding.mechanismId ?? null,
    partInstanceId: finding.partInstanceId ?? null,
    artifactInstanceId: finding.artifactInstanceId ?? null,
    issueType: finding.issueType ?? finding.title ?? "",
    severity: finding.severity ?? "low",
    notes: finding.notes ?? finding.detail ?? "",
    spawnedTaskId: finding.spawnedTaskId ?? null,
    spawnedIterationId: finding.spawnedIterationId ?? null,
    spawnedRiskId: finding.spawnedRiskId ?? null,
  }));

  const qaReports = reports.filter((report) => report.reportType === "QA");
  const testResults = reports.filter((report) => report.reportType !== "QA");
  const qaFindings = reportFindings
    .filter((finding) => {
      const report = reportsById.get(finding.reportId);
      return report?.reportType === "QA";
    })
    .map((finding) => {
      const report = reportsById.get(finding.reportId);
      return {
        id: finding.id,
        qaReportId: finding.reportId || null,
        taskId: finding.taskId ?? report?.taskId ?? null,
        projectId: finding.projectId ?? report?.projectId ?? defaultProjectId,
        workstreamId: finding.workstreamId ?? report?.workstreamId ?? null,
        subsystemId: finding.subsystemId ?? null,
        mechanismId: finding.mechanismId ?? null,
        partInstanceId: finding.partInstanceId ?? null,
        artifactId: finding.artifactInstanceId ?? null,
        title: finding.title ?? finding.issueType,
        detail: finding.detail ?? finding.notes,
        severity: finding.severity,
        status: finding.status ?? "open",
        createdAt: finding.createdAt ?? new Date().toISOString(),
        updatedAt: finding.updatedAt ?? finding.createdAt ?? new Date().toISOString(),
      };
    });
  const testFindings = reportFindings
    .filter((finding) => {
      const report = reportsById.get(finding.reportId);
      return report?.reportType !== "QA";
    })
    .map((finding) => {
      const report = reportsById.get(finding.reportId);
      return {
        id: finding.id,
        testResultId: finding.reportId || null,
        eventId: finding.eventId ?? report?.eventId ?? null,
        taskId: finding.taskId ?? report?.taskId ?? null,
        projectId: finding.projectId ?? report?.projectId ?? defaultProjectId,
        workstreamId: finding.workstreamId ?? report?.workstreamId ?? null,
        subsystemId: finding.subsystemId ?? null,
        mechanismId: finding.mechanismId ?? null,
        partInstanceId: finding.partInstanceId ?? null,
        artifactId: finding.artifactInstanceId ?? null,
        title: finding.title ?? finding.issueType,
        detail: finding.detail ?? finding.notes,
        severity: finding.severity,
        status: finding.status ?? "open",
        createdAt: finding.createdAt ?? new Date().toISOString(),
        updatedAt: finding.updatedAt ?? finding.createdAt ?? new Date().toISOString(),
      };
    });

  return {
    seasons: planning.seasons,
    projects: planning.projects,
    workstreams: planning.workstreams,
    members: (source.members ?? []).map((member) => {
      const seasonId = member.seasonId ?? defaultSeasonId;
      const activeSeasonIds = Array.from(
        new Set([...(member.activeSeasonIds ?? []), seasonId].filter(Boolean)),
      );
      return {
        ...member,
        email: typeof member.email === "string" ? member.email : "",
        photoUrl: typeof member.photoUrl === "string" ? member.photoUrl : "",
        elevated:
          typeof member.elevated === "boolean"
            ? member.elevated
            : member.role === "lead" || member.role === "admin",
        seasonId,
        activeSeasonIds: activeSeasonIds.length > 0 ? activeSeasonIds : [seasonId],
      };
    }),
    subsystems,
    disciplines: source.disciplines ?? [],
    mechanisms: (source.mechanisms ?? []).map((mechanism) => ({
      ...mechanism,
      isArchived: mechanism.isArchived ?? false,
    })),
    materials: source.materials ?? [],
    artifacts,
    partDefinitions: (source.partDefinitions ?? []).map((partDefinition) => ({
      ...partDefinition,
      isArchived: partDefinition.isArchived ?? false,
      materialId: partDefinition.materialId ?? null,
      description: partDefinition.description ?? "",
    })),
    partInstances: (source.partInstances ?? []).map((partInstance) => ({
      ...partInstance,
      mechanismId: partInstance.mechanismId ?? null,
      status: partInstance.status ?? "planned",
    })),
    workLogs: (source.workLogs ?? []).map((workLog) => ({
      ...workLog,
      participantIds: workLog.participantIds ?? [],
      notes: workLog.notes ?? "",
    })),
    purchaseItems: (source.purchaseItems ?? []).map((item) => ({
      ...item,
      partDefinitionId: item.partDefinitionId ?? null,
    })),
    manufacturingItems: (source.manufacturingItems ?? []).map((item) => {
      const partInstanceIds = item.partInstanceIds?.length
        ? uniqueIds(item.partInstanceIds)
        : uniqueIds([item.partInstanceId]);

      return {
        ...item,
        materialId: item.materialId ?? null,
        partDefinitionId: item.partDefinitionId ?? null,
        partInstanceId: partInstanceIds[0] ?? null,
        partInstanceIds,
        inHouse: item.process === "cnc" ? item.inHouse ?? true : false,
      };
    }),
    events,
    reports,
    reportFindings,
    qaReports,
    testResults,
    qaFindings,
    testFindings,
    designIterations: source.designIterations ?? [],
    risks: source.risks ?? [],
    tasks: planning.tasks,
    taskDependencies: (source.taskDependencies ?? []).map((dependency, index) => ({
      id: (dependency as { id?: string }).id ?? `task-dependency-${index + 1}`,
      taskId:
        (dependency as { taskId?: string; downstreamTaskId?: string }).taskId ??
        (dependency as { downstreamTaskId?: string }).downstreamTaskId ??
        "",
      kind: (dependency as { kind?: TaskDependencyRecord["kind"] }).kind ?? "task",
      refId:
        (dependency as { refId?: string; upstreamTaskId?: string }).refId ??
        (dependency as { upstreamTaskId?: string }).upstreamTaskId ??
        "",
      requiredState:
        (dependency as { requiredState?: string }).requiredState ??
        ((((dependency as { kind?: string }).kind ?? "task") as string) === "part_instance"
          ? "available"
          : "complete"),
      dependencyType:
        (dependency as { dependencyType?: string }).dependencyType === "soft" ? "soft" : "hard",
      createdAt: (dependency as { createdAt?: string }).createdAt ?? new Date().toISOString(),
    })),
    taskBlockers: (source.taskBlockers ?? []).map((blocker, index) => ({
      id: blocker.id ?? `task-blocker-${index + 1}`,
      blockedTaskId: blocker.blockedTaskId ?? "",
      blockerType: blocker.blockerType ?? "external",
      blockerId: blocker.blockerId ?? null,
      description: blocker.description ?? "",
      severity: blocker.severity ?? "medium",
      status: blocker.status ?? "open",
      createdByMemberId: blocker.createdByMemberId ?? null,
      createdAt: blocker.createdAt ?? new Date().toISOString(),
      resolvedAt: blocker.resolvedAt ?? null,
    })),
  };
}
