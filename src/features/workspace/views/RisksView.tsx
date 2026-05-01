import { useCallback, useEffect, useMemo, useState } from "react";

import type { RiskManagementViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload, RiskPayload, RiskRecord } from "@/types";
import {
  EditableHoverIndicator,
  type FilterSelection,
  PaginationControls,
  SearchToolbarInput,
  TableCell,
  filterSelectionMatchesTaskPeople,
  useFilterChangeMotionClass,
  useWorkspacePagination,
} from "@/features/workspace/shared";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared";
import {
  buildScopeMetrics,
  formatHours,
  formatPercent,
  MetricHotspotCard,
  MetricScopeTable,
  MetricStatCard,
  TimeMetricGraphic,
} from "./RiskMetrics";

type RiskEditorMode = "create" | "edit" | null;
type RiskSeverityFilter = "all" | RiskPayload["severity"];
type RiskSourceFilter = "all" | RiskPayload["sourceType"];

interface RisksViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  onCreateRisk: (payload: RiskPayload) => Promise<void>;
  onDeleteRisk: (riskId: string) => Promise<void>;
  onUpdateRisk: (riskId: string, payload: RiskPayload) => Promise<void>;
  view: RiskManagementViewTab;
}

interface SelectOption {
  id: string;
  name: string;
}

const SEVERITY_RANK: Record<RiskPayload["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const ATTACHMENT_TYPE_LABELS: Record<RiskPayload["attachmentType"], string> = {
  project: "Project",
  workstream: "Workflow",
  mechanism: "Mechanism",
  "part-instance": "Part instance",
};

function toRiskPayload(risk: RiskRecord): RiskPayload {
  return {
    title: risk.title,
    detail: risk.detail,
    severity: risk.severity,
    sourceType: risk.sourceType,
    sourceId: risk.sourceId,
    attachmentType: risk.attachmentType,
    attachmentId: risk.attachmentId,
    mitigationTaskId: risk.mitigationTaskId,
  };
}

function sanitizeRiskPayload(payload: RiskPayload): RiskPayload {
  const mitigationTaskId =
    typeof payload.mitigationTaskId === "string" && payload.mitigationTaskId.trim().length > 0
      ? payload.mitigationTaskId.trim()
      : null;

  return {
    ...payload,
    title: payload.title.trim(),
    detail: payload.detail.trim(),
    sourceId: payload.sourceId.trim(),
    attachmentId: payload.attachmentId.trim(),
    mitigationTaskId,
  };
}

function buildDefaultRiskPayload(
  bootstrap: BootstrapPayload,
  qaSourceOptions: SelectOption[],
  testSourceOptions: SelectOption[],
  projectAttachmentOptions: SelectOption[],
): RiskPayload {
  const hasQaSources = qaSourceOptions.length > 0;
  const sourceType: RiskPayload["sourceType"] = hasQaSources ? "qa-report" : "test-result";
  const sourceId = hasQaSources
    ? qaSourceOptions[0]?.id ?? ""
    : testSourceOptions[0]?.id ?? "";

  return {
    title: "",
    detail: "",
    severity: "medium",
    sourceType,
    sourceId,
    attachmentType: "project",
    attachmentId: projectAttachmentOptions[0]?.id ?? bootstrap.projects[0]?.id ?? "",
    mitigationTaskId: null,
  };
}

export function RisksView({
  activePersonFilter,
  bootstrap,
  onCreateRisk,
  onDeleteRisk,
  onUpdateRisk,
  view,
}: RisksViewProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<RiskSeverityFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<RiskSourceFilter>("all");
  const [editorMode, setEditorMode] = useState<RiskEditorMode>(null);
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const scopedTasks = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.tasks.filter((task) =>
            filterSelectionMatchesTaskPeople(activePersonFilter, task),
          )
        : bootstrap.tasks,
    [activePersonFilter, bootstrap.tasks],
  );
  const scopedTaskIds = useMemo(() => new Set(scopedTasks.map((task) => task.id)), [scopedTasks]);
  const scopedWorkLogs = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.workLogs.filter((workLog) => scopedTaskIds.has(workLog.taskId))
        : bootstrap.workLogs,
    [activePersonFilter.length, bootstrap.workLogs, scopedTaskIds],
  );
  const scopedReports = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.reports.filter((report) => report.taskId && scopedTaskIds.has(report.taskId))
        : bootstrap.reports,
    [activePersonFilter.length, bootstrap.reports, scopedTaskIds],
  );
  const scopedReportIds = useMemo(
    () => new Set(scopedReports.map((report) => report.id)),
    [scopedReports],
  );
  const scopedRisks = useMemo(
    () =>
      activePersonFilter.length > 0
        ? bootstrap.risks.filter((risk) => {
            if (risk.mitigationTaskId && scopedTaskIds.has(risk.mitigationTaskId)) {
              return true;
            }

            return scopedReportIds.has(risk.sourceId);
          })
        : bootstrap.risks,
    [activePersonFilter.length, bootstrap.risks, scopedReportIds, scopedTaskIds],
  );

  const plannedHours = useMemo(
    () =>
      scopedTasks.reduce(
        (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
        0,
      ),
    [scopedTasks],
  );
  const loggedHours = useMemo(
    () =>
      scopedWorkLogs.reduce(
        (total, workLog) => total + Math.max(0, Number(workLog.hours) || 0),
        0,
      ),
    [scopedWorkLogs],
  );
  const maxMetricHours = Math.max(plannedHours, loggedHours, 1);
  const completionRatio = plannedHours > 0 ? loggedHours / plannedHours : 0;
  const clampedCompletionWidth = `${Math.max(0, Math.min(100, completionRatio * 100))}%`;

  const tasksById = useMemo(
    () => Object.fromEntries(scopedTasks.map((task) => [task.id, task] as const)),
    [scopedTasks],
  );
  const projectsById = useMemo(
    () => Object.fromEntries(bootstrap.projects.map((project) => [project.id, project] as const)),
    [bootstrap.projects],
  );
  const workstreamsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.workstreams.map((workstream) => [workstream.id, workstream] as const),
      ),
    [bootstrap.workstreams],
  );
  const subsystemsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
      ),
    [bootstrap.subsystems],
  );
  const partDefinitionsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
      ),
    [bootstrap.partDefinitions],
  );
  const mechanismsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const),
      ),
    [bootstrap.mechanisms],
  );
  const partInstancesById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
      ),
    [bootstrap.partInstances],
  );
  const workHoursByTaskId = useMemo(() => {
    const hoursByTaskId = new Map<string, number>();

    scopedWorkLogs.forEach((workLog) => {
      hoursByTaskId.set(
        workLog.taskId,
        (hoursByTaskId.get(workLog.taskId) ?? 0) + Math.max(0, Number(workLog.hours) || 0),
      );
    });

    return hoursByTaskId;
  }, [scopedWorkLogs]);
  const qaPassTaskIds = useMemo(() => {
    const taskIds = new Set<string>();

    scopedReports.forEach((report) => {
      if (report.result === "pass" && report.mentorApproved && report.taskId) {
        taskIds.add(report.taskId);
      }
    });

    return taskIds;
  }, [scopedReports]);
  const subsystemMetrics = useMemo(
    () =>
      buildScopeMetrics(
        bootstrap.subsystems,
        scopedTasks,
        workHoursByTaskId,
        qaPassTaskIds,
        (subsystem) => `Project: ${projectsById[subsystem.projectId]?.name ?? "Unknown project"}`,
        (subsystem) => {
          const mechanismCount = bootstrap.mechanisms.filter(
            (mechanism) => mechanism.subsystemId === subsystem.id,
          ).length;
          return `${mechanismCount} mechanism${mechanismCount === 1 ? "" : "s"}`;
        },
        (task, subsystem) =>
          task.subsystemId === subsystem.id ||
          (task.subsystemIds ?? []).includes(subsystem.id),
      ),
    [
      bootstrap.mechanisms,
      bootstrap.subsystems,
      scopedTasks,
      projectsById,
      qaPassTaskIds,
      workHoursByTaskId,
    ],
  );
  const mechanismMetrics = useMemo(
    () =>
      buildScopeMetrics(
        bootstrap.mechanisms,
        scopedTasks,
        workHoursByTaskId,
        qaPassTaskIds,
        (mechanism) =>
          `Subsystem: ${subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem"}`,
        (mechanism) => {
          const partInstanceCount = bootstrap.partInstances.filter(
            (partInstance) => partInstance.mechanismId === mechanism.id,
          ).length;
          return `${partInstanceCount} part instance${partInstanceCount === 1 ? "" : "s"}`;
        },
        (task, mechanism) =>
          task.mechanismId === mechanism.id ||
          (task.mechanismIds ?? []).includes(mechanism.id),
      ),
    [
      bootstrap.mechanisms,
      bootstrap.partInstances,
      scopedTasks,
      qaPassTaskIds,
      subsystemsById,
      workHoursByTaskId,
    ],
  );
  const eventsById = useMemo(
    () => Object.fromEntries(bootstrap.events.map((event) => [event.id, event] as const)),
    [bootstrap.events],
  );
  const testResultsById = useMemo(
    () =>
      Object.fromEntries(
        scopedReports
          .filter((report) => report.reportType !== "QA")
          .map((testResult) => [testResult.id, testResult] as const),
      ),
    [scopedReports],
  );

  const completedTaskCount = scopedTasks.filter((task) => task.status === "complete").length;
  const waitingForQaCount = scopedTasks.filter(
    (task) => task.status === "waiting-for-qa",
  ).length;
  const blockerCount = scopedTasks.reduce((sum, task) => sum + task.blockers.length, 0);
  const qaPassCount = scopedReports.filter(
    (report) => report.result === "pass" && report.mentorApproved,
  ).length;
  const deliveredPurchases = bootstrap.purchaseItems.filter(
    (purchase) => purchase.status === "delivered",
  ).length;
  const lowStockMaterials = bootstrap.materials.filter(
    (material) => material.onHandQuantity <= material.reorderPoint,
  ).length;
  const attendanceHours = (bootstrap.attendanceRecords ?? []).reduce(
    (sum, record) => sum + record.totalHours,
    0,
  );
  const activeSubsystemCount = subsystemMetrics.filter((metric) => metric.taskCount > 0).length;
  const activeMechanismCount = mechanismMetrics.filter((metric) => metric.taskCount > 0).length;
  const totalTaskCount = Math.max(scopedTasks.length, 1);
  const completionRate = completedTaskCount / totalTaskCount;
  const supplySignals = deliveredPurchases + lowStockMaterials;
  const qaReportsById = useMemo(
    () =>
      Object.fromEntries(
        scopedReports
          .filter((report) => report.reportType === "QA")
          .map((qaReport) => [qaReport.id, qaReport] as const),
      ),
    [scopedReports],
  );

  const qaSourceOptions = useMemo<SelectOption[]>(
    () =>
        scopedReports
          .filter((report) => report.reportType === "QA")
        .map((qaReport) => {
        const taskTitle = tasksById[qaReport.taskId ?? ""]?.title ?? "Unknown task";
        return {
          id: qaReport.id,
          name: `${taskTitle} (${qaReport.reviewedAt})`,
        };
        }),
    [scopedReports, tasksById],
  );
  const testSourceOptions = useMemo<SelectOption[]>(
    () =>
        scopedReports
          .filter((report) => report.reportType !== "QA")
        .map((testResult) => {
        const eventTitle = eventsById[testResult.eventId ?? ""]?.title ?? "Unknown event";
        return {
          id: testResult.id,
          name: `${testResult.title} (${eventTitle})`,
        };
        }),
    [scopedReports, eventsById],
  );

  const projectAttachmentOptions = useMemo<SelectOption[]>(
    () =>
      bootstrap.projects.map((project) => ({
        id: project.id,
        name: project.name,
      })),
    [bootstrap.projects],
  );
  const workstreamAttachmentOptions = useMemo<SelectOption[]>(
    () =>
      bootstrap.workstreams.map((workstream) => ({
        id: workstream.id,
        name: `${workstream.name} (${projectsById[workstream.projectId]?.name ?? "Unknown project"})`,
      })),
    [bootstrap.workstreams, projectsById],
  );
  const mechanismAttachmentOptions = useMemo<SelectOption[]>(
    () =>
      bootstrap.mechanisms.map((mechanism) => ({
        id: mechanism.id,
        name: `${mechanism.name} (${subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem"})`,
      })),
    [bootstrap.mechanisms, subsystemsById],
  );
  const partInstanceAttachmentOptions = useMemo<SelectOption[]>(
    () =>
      bootstrap.partInstances.map((partInstance) => {
        const partDefinitionName =
          partDefinitionsById[partInstance.partDefinitionId]?.name ?? "Unknown part";
        return {
          id: partInstance.id,
          name: `${partInstance.name} (${partDefinitionName})`,
        };
      }),
    [bootstrap.partInstances, partDefinitionsById],
  );
  const mitigationTaskOptions = useMemo<SelectOption[]>(
    () =>
      scopedTasks.map((task) => ({
        id: task.id,
        name: task.title,
      })),
    [scopedTasks],
  );

  const getSourceOptionsForType = (sourceType: RiskPayload["sourceType"]) =>
    sourceType === "qa-report" ? qaSourceOptions : testSourceOptions;
  const getAttachmentOptionsForType = (attachmentType: RiskPayload["attachmentType"]) => {
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

  const [draft, setDraft] = useState<RiskPayload>(() =>
    buildDefaultRiskPayload(
      bootstrap,
      qaSourceOptions,
      testSourceOptions,
      projectAttachmentOptions,
    ),
  );

  const openCreateEditor = () => {
    setDraft(
      buildDefaultRiskPayload(
        bootstrap,
        qaSourceOptions,
        testSourceOptions,
        projectAttachmentOptions,
      ),
    );
    setActiveRiskId(null);
    setEditorError(null);
    setEditorMode("create");
  };

  const openEditEditor = (risk: RiskRecord) => {
    setDraft(toRiskPayload(risk));
    setActiveRiskId(risk.id);
    setEditorError(null);
    setEditorMode("edit");
  };

  const closeEditor = () => {
    setEditorMode(null);
    setActiveRiskId(null);
    setEditorError(null);
    setIsSaving(false);
    setIsDeleting(false);
  };

  const sourceOptions = getSourceOptionsForType(draft.sourceType);
  const attachmentOptions = getAttachmentOptionsForType(draft.attachmentType);

  useEffect(() => {
    if (!editorMode) {
      return;
    }

    if (!sourceOptions.some((option) => option.id === draft.sourceId)) {
      setDraft((current) => ({
        ...current,
        sourceId: sourceOptions[0]?.id ?? "",
      }));
    }
  }, [draft.sourceId, editorMode, sourceOptions]);

  useEffect(() => {
    if (!editorMode) {
      return;
    }

    if (!attachmentOptions.some((option) => option.id === draft.attachmentId)) {
      setDraft((current) => ({
        ...current,
        attachmentId: attachmentOptions[0]?.id ?? "",
      }));
    }
  }, [attachmentOptions, draft.attachmentId, editorMode]);

  const getSourceLabel = useCallback((risk: RiskRecord) => {
    if (risk.sourceType === "qa-report") {
      const report = qaReportsById[risk.sourceId];
      if (!report) {
        return "Unknown QA report";
      }
      return `${tasksById[report.taskId ?? ""]?.title ?? "Unknown task"} QA report`;
    }

    const testResult = testResultsById[risk.sourceId];
    if (!testResult) {
      return "Unknown test result";
    }
    return `${testResult.title} test result`;
  }, [qaReportsById, tasksById, testResultsById]);

  const getAttachmentLabel = useCallback((risk: RiskRecord) => {
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
        const subsystemName =
          subsystemsById[mechanism.subsystemId]?.name ?? "Unknown subsystem";
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
  }, [
    mechanismsById,
    partDefinitionsById,
    partInstancesById,
    projectsById,
    subsystemsById,
    workstreamsById,
  ]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return scopedRisks
      .filter((risk) => {
        if (severityFilter !== "all" && risk.severity !== severityFilter) {
          return false;
        }

        if (sourceFilter !== "all" && risk.sourceType !== sourceFilter) {
          return false;
        }

        if (normalizedSearch.length === 0) {
          return true;
        }

        const mitigationLabel = risk.mitigationTaskId
          ? tasksById[risk.mitigationTaskId]?.title ?? "Unknown task"
          : "None";
        return [
          risk.title,
          risk.detail,
          getSourceLabel(risk),
          getAttachmentLabel(risk),
          mitigationLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => {
        const severityOrder = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
        if (severityOrder !== 0) {
          return severityOrder;
        }

        return left.title.localeCompare(right.title);
      });
  }, [
    scopedRisks,
    getAttachmentLabel,
    getSourceLabel,
    search,
    severityFilter,
    sourceFilter,
    tasksById,
  ]);

  const pagination = useWorkspacePagination(filteredRows);
  const riskFilterMotionClass = useFilterChangeMotionClass([
    search,
    severityFilter,
    sourceFilter,
  ]);

  const handleSaveRisk = async () => {
    const payload = sanitizeRiskPayload(draft);

    if (payload.title.length < 2) {
      setEditorError("Please provide a risk title.");
      return;
    }

    if (payload.detail.length < 2) {
      setEditorError("Please provide risk details.");
      return;
    }

    if (!payload.sourceId) {
      setEditorError("Please choose a real source.");
      return;
    }

    if (!payload.attachmentId) {
      setEditorError("Please choose a real attachment target.");
      return;
    }

    setEditorError(null);
    setIsSaving(true);
    try {
      if (editorMode === "create") {
        await onCreateRisk(payload);
      } else if (editorMode === "edit" && activeRiskId) {
        await onUpdateRisk(activeRiskId, payload);
      }
      closeEditor();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Couldn't save this risk.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRisk = async () => {
    if (!activeRiskId) {
      return;
    }

    setEditorError(null);
    setIsDeleting(true);
    try {
      await onDeleteRisk(activeRiskId);
      closeEditor();
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Couldn't delete this risk.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className={`panel dense-panel subsystem-manager-shell ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2 style={{ color: "var(--text-title)" }}>
            {view === "metrics" ? "Operations metrics" : "Risk management"}
          </h2>
          <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
            {view === "metrics"
              ? "Track planning, triage, subsystem health, and mechanism health from one view."
              : "Track active risk exposure, evidence source, and mitigation ownership in one place."}
          </p>
        </div>
      </div>

      {view === "metrics" ? (
        <>
          <div className="metrics-intro-shell">
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Ops overview
            </p>
            <h3>Planning, triage, and trend signals in one place</h3>
            <p className="section-copy filter-copy" style={{ color: "var(--text-copy)" }}>
              Use the summary cards for a whole-workspace pulse check, then drill into subsystem
              and mechanism pressure to see where work is stacking up.
            </p>
          </div>

          <div className="risk-time-metrics-shell">
            <TimeMetricGraphic
              colorClassName="risk-time-ring-planned"
              hours={plannedHours}
              label="Time planned"
              maxHours={maxMetricHours}
            />
            <TimeMetricGraphic
              colorClassName="risk-time-ring-done"
              hours={loggedHours}
              label="Work logged"
              maxHours={maxMetricHours}
            />
          </div>

          <div className="risk-time-progress-shell">
            <p className="risk-time-progress-label">
              {plannedHours > 0
                ? `${Math.round(completionRate * 100)}% of planned hours logged`
                : "No planned hours yet"}
            </p>
            <div className="risk-time-progress-track" aria-hidden="true">
              <span style={{ width: clampedCompletionWidth }} />
            </div>
            <p className="risk-time-progress-caption">
              {loggedHours > plannedHours
                ? `${formatHours(loggedHours - plannedHours)} over plan`
                : `${formatHours(plannedHours - loggedHours)} remaining to plan`}
            </p>
          </div>

          <div className="metrics-summary-grid">
            <MetricStatCard
              note={`${completedTaskCount} of ${scopedTasks.length} tasks complete`}
              title="Completion rate"
              value={formatPercent(completionRate)}
            />
            <MetricStatCard
              note={`${formatHours(plannedHours)} planned`}
              title="Execution hours"
              value={formatHours(loggedHours)}
            />
            <MetricStatCard
              note="Tasks that still need a next move"
              title="Open tasks"
              value={scopedTasks.length - completedTaskCount}
            />
            <MetricStatCard
              note="Review gates still waiting on a decision"
              title="QA"
              value={waitingForQaCount}
            />
            <MetricStatCard
              note="Unresolved blockers across all tasks"
              title="Blockers"
              value={blockerCount}
            />
            <MetricStatCard
              note={`${activeSubsystemCount} of ${bootstrap.subsystems.length} subsystems have work`}
              title="Subsystem coverage"
              value={activeSubsystemCount}
            />
            <MetricStatCard
              note={`${activeMechanismCount} of ${bootstrap.mechanisms.length} mechanisms have work`}
              title="Mechanism coverage"
              value={activeMechanismCount}
            />
            <MetricStatCard
              note={`${deliveredPurchases} delivered purchases | ${lowStockMaterials} low-stock materials`}
              title="Supply watch"
              value={supplySignals}
            />
            <MetricStatCard
              note="Attendance records and meeting sign-ins"
              title="Attendance hours"
              value={formatHours(attendanceHours)}
            />
            <MetricStatCard
              note="Mentor-backed QA approvals"
              title="QA passes"
              value={qaPassCount}
            />
          </div>

          <div className="metrics-hotspot-grid">
            <MetricHotspotCard
              rows={subsystemMetrics.slice(0, 3)}
              subtitle="Subsystems sorted by open work and blocker pressure."
              title="Subsystem pressure"
            />
            <MetricHotspotCard
              rows={mechanismMetrics.slice(0, 3)}
              subtitle="Mechanisms sorted by open work and blocker pressure."
              title="Mechanism pressure"
            />
          </div>

          <MetricScopeTable
            rows={subsystemMetrics}
            scopeLabel="Subsystem"
            subtitle="Count tasks, active work, QA pressure, blockers, and logged time at the subsystem level."
            title="Subsystem metrics"
          />

          <MetricScopeTable
            rows={mechanismMetrics}
            scopeLabel="Mechanism"
            subtitle="Track the same signals one layer deeper so mechanism bottlenecks are visible early."
            title="Mechanism metrics"
          />
        </>
      ) : null}

      {view === "risks" ? (
        <>
          <div className="panel-header compact-header">
            <div className="panel-actions filter-toolbar subsystem-manager-toolbar">
              <SearchToolbarInput
                ariaLabel="Search risks"
                onChange={setSearch}
                placeholder="Search risks..."
                value={search}
              />

              <label className="risk-filter-control">
                <span>Severity</span>
                <select
                  onChange={(event) =>
                    setSeverityFilter(event.target.value as RiskSeverityFilter)
                  }
                  value={severityFilter}
                >
                  <option value="all">All severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label className="risk-filter-control">
                <span>Source</span>
                <select
                  onChange={(event) => setSourceFilter(event.target.value as RiskSourceFilter)}
                  value={sourceFilter}
                >
                  <option value="all">All sources</option>
                  <option value="qa-report">QA report</option>
                  <option value="test-result">Test result</option>
                </select>
              </label>

              <button
                className="primary-action queue-toolbar-action subsystem-manager-toolbar-action"
                onClick={openCreateEditor}
                type="button"
              >
                Add risk
              </button>
            </div>
          </div>

          <div className={`table-shell subsystem-manager-list-shell ${riskFilterMotionClass}`}>
            <div
              className="ops-table ops-table-header subsystem-manager-table-header"
              style={{
                gridTemplateColumns: "minmax(220px, 2fr) 0.8fr 1.2fr 1.2fr 1fr",
                borderBottom: "1px solid var(--border-base)",
                color: "var(--text-copy)",
              }}
            >
              <span style={{ textAlign: "left" }}>Risk</span>
              <span>Severity</span>
              <span>Source</span>
              <span>Attachment</span>
              <span>Mitigation</span>
            </div>

            {pagination.pageItems.map((risk) => (
              <div
                className="ops-table ops-row subsystem-manager-row editable-row-clickable editable-hover-target editable-hover-target-row"
                key={risk.id}
                onClick={() => openEditEditor(risk)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) {
                    return;
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openEditEditor(risk);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{
                  gridTemplateColumns: "minmax(220px, 2fr) 0.8fr 1.2fr 1.2fr 1fr",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-base)",
                  color: "var(--text-copy)",
                  background: "var(--row-bg, var(--bg-row-alt))",
                }}
              >
                <TableCell label="Risk">
                  <strong style={{ color: "var(--text-title)" }}>{risk.title}</strong>
                  <small>{risk.detail}</small>
                </TableCell>
                <TableCell label="Severity" valueClassName="table-cell-pill">
                  {risk.severity}
                </TableCell>
                <TableCell label="Source">{getSourceLabel(risk)}</TableCell>
                <TableCell label="Attachment">
                  <strong style={{ color: "var(--text-title)" }}>
                    {ATTACHMENT_TYPE_LABELS[risk.attachmentType]}
                  </strong>
                  <small>{getAttachmentLabel(risk)}</small>
                </TableCell>
                <TableCell label="Mitigation">
                  {risk.mitigationTaskId
                    ? tasksById[risk.mitigationTaskId]?.title ?? "Unknown task"
                    : "None"}
                </TableCell>
                <EditableHoverIndicator />
              </div>
            ))}

            {filteredRows.length === 0 ? (
              <p className="empty-state">No risks match the current filters.</p>
            ) : null}
          </div>

          <PaginationControls
            label="Risk table"
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            page={pagination.page}
            pageSize={pagination.pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            rangeEnd={pagination.rangeEnd}
            rangeStart={pagination.rangeStart}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
          />
        </>
      ) : null}

      {editorMode ? (
        <div
          className="modal-scrim"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeEditor();
            }
          }}
          role="presentation"
        >
          <section aria-modal="true" className="modal-card" role="dialog">
            <div className="panel-header compact-header">
              <div>
                <p className="eyebrow" style={{ color: "var(--official-red)" }}>
                  Risk management
                </p>
                <h2>{editorMode === "create" ? "Create risk" : "Edit risk"}</h2>
              </div>
              <button className="icon-button" onClick={closeEditor} type="button">
                Close
              </button>
            </div>

            <form
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSaveRisk();
              }}
            >
              <label className="field modal-wide">
                <span>Title</span>
                <input
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                  value={draft.title}
                />
              </label>

              <label className="field modal-wide">
                <span>Detail</span>
                <textarea
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      detail: event.target.value,
                    }))
                  }
                  required
                  rows={4}
                  value={draft.detail}
                />
              </label>

              <label className="field">
                <span>Severity</span>
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      severity: event.target.value as RiskPayload["severity"],
                    }))
                  }
                  value={draft.severity}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label className="field">
                <span>Source type</span>
                <select
                  onChange={(event) => {
                    const nextSourceType = event.target.value as RiskPayload["sourceType"];
                    const nextSourceOptions = getSourceOptionsForType(nextSourceType);
                    setDraft((current) => ({
                      ...current,
                      sourceType: nextSourceType,
                      sourceId: nextSourceOptions[0]?.id ?? "",
                    }));
                  }}
                  value={draft.sourceType}
                >
                  <option value="qa-report">QA report</option>
                  <option value="test-result">Test result</option>
                </select>
              </label>

              <label className="field modal-wide">
                <span>Source</span>
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      sourceId: event.target.value,
                    }))
                  }
                  value={draft.sourceId}
                >
                  {sourceOptions.length === 0 ? (
                    <option value="">No sources available</option>
                  ) : (
                    sourceOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="field">
                <span>Attachment type</span>
                <select
                  onChange={(event) => {
                    const nextAttachmentType = event.target
                      .value as RiskPayload["attachmentType"];
                    const nextAttachmentOptions = getAttachmentOptionsForType(nextAttachmentType);
                    setDraft((current) => ({
                      ...current,
                      attachmentType: nextAttachmentType,
                      attachmentId: nextAttachmentOptions[0]?.id ?? "",
                    }));
                  }}
                  value={draft.attachmentType}
                >
                  <option value="project">Project</option>
                  <option value="workstream">Workflow</option>
                  <option value="mechanism">Mechanism</option>
                  <option value="part-instance">Part instance</option>
                </select>
              </label>

              <label className="field modal-wide">
                <span>Attachment target</span>
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      attachmentId: event.target.value,
                    }))
                  }
                  value={draft.attachmentId}
                >
                  {attachmentOptions.length === 0 ? (
                    <option value="">No attachment targets available</option>
                  ) : (
                    attachmentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="field modal-wide">
                <span>Mitigation task</span>
                <select
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      mitigationTaskId: event.target.value || null,
                    }))
                  }
                  value={draft.mitigationTaskId ?? ""}
                >
                  <option value="">None</option>
                  {mitigationTaskOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              {editorError ? (
                <p className="section-copy modal-wide" style={{ color: "var(--official-red)" }}>
                  {editorError}
                </p>
              ) : null}

              <div className="modal-actions modal-wide">
                {editorMode === "edit" ? (
                  <button
                    className="secondary-action danger-action"
                    disabled={isDeleting || isSaving}
                    onClick={() => void handleDeleteRisk()}
                    type="button"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                ) : (
                  <span />
                )}
                <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                  <button
                    className="secondary-action"
                    disabled={isSaving || isDeleting}
                    onClick={closeEditor}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button className="primary-action" disabled={isSaving || isDeleting} type="submit">
                    {isSaving
                      ? "Saving..."
                      : editorMode === "create"
                        ? "Create risk"
                        : "Save changes"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
