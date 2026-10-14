import type { BootstrapPayload } from "@/types/bootstrap";
import type { DomainReference, RiskSeverity, TaskStatus } from "@/types/common";
import type { RiskRecord } from "@/types/recordsReporting";
import { getTaskPlanningState } from "@/features/workspace/shared/task/taskPlanning";
import { getRiskRecordReference } from "../../riskViewData/riskRecordLinks";

type Reference = { kind: string; id: string };

export interface ConcernSubject {
  id: string;
  label: string;
  areaLabel: string;
}

export interface ConcernEvidence {
  id: string;
  label: string;
  detail: string;
  available: boolean;
  kind: DomainReference["kind"];
  role: "source" | "supporting";
}

export interface ConcernMitigation {
  id: string;
  title: string;
  status: TaskStatus | "unavailable";
}

export interface ConcernMilestone {
  id: string;
  title: string;
  date: string | null;
  basis: "required" | "linked";
  conditions?: {
    id: string;
    required: boolean;
    conditionType: "iteration" | "workflow-state" | "custom";
    conditionValue: string;
    notes: string;
  }[];
}

export interface ConcernVerification {
  criteria: string;
  status: "not-recorded" | "pending" | "verified";
  evidence?: string;
}

export interface PrototypeConcern {
  id: string;
  title: string;
  detail: string;
  severity: RiskSeverity;
  status: RiskRecord["status"];
  blocksWork: boolean;
  projectId: string;
  ownerLabel: string;
  subjects: ConcernSubject[];
  evidence: ConcernEvidence[];
  mitigation: ConcernMitigation | null;
  milestones: ConcernMilestone[];
  temporaryRepair: string | null;
  verification: ConcernVerification;
  scenario: boolean;
}

export interface ConcernFilterOptions {
  search?: string;
  milestone?: string;
  subject?: string;
  includeResolved?: boolean;
}

export interface ConcernArea {
  id: string;
  label: string;
  areaLabel: string;
  count: number;
  highCount: number;
  criticalCount: number;
}

export interface ConcernContextTask {
  id: string;
  title: string;
  subjectIds: string[];
  status: TaskStatus;
  blocked: boolean;
  waitingOnDependency: boolean;
  scenario: boolean;
}

const evidenceKinds = new Set(["report", "qa-finding", "test-finding", "test-result", "qa-request", "artifact"]);

function referenceId(ref: Reference) {
  return `${ref.kind}:${ref.id}`;
}

function subjectForReference(ref: DomainReference, bootstrap: BootstrapPayload): ConcernSubject {
  const reference = getRiskRecordReference(ref, bootstrap);
  const label = reference.label.replace(/^[^·]+·\s*/, "");
  let areaLabel = "No mechanism linked";
  if (ref.kind === "subsystem") areaLabel = bootstrap.subsystems.find(item => item.id === ref.id)?.name ?? "Unavailable subsystem";
  if (ref.kind === "mechanism") {
    const mechanism = bootstrap.mechanisms.find(item => item.id === ref.id);
    areaLabel = bootstrap.subsystems.find(item => item.id === mechanism?.subsystemId)?.name ?? "Uncategorized mechanism";
  }
  if (ref.kind === "task") {
    const task = bootstrap.tasks.find(item => item.id === ref.id);
    const areaNames = [
      ...task?.mechanismIds.map(id => bootstrap.mechanisms.find(item => item.id === id)?.name ?? `Unavailable mechanism · ${id}`) ?? [],
      ...task?.subsystemIds.map(id => bootstrap.subsystems.find(item => item.id === id)?.name ?? `Unavailable subsystem · ${id}`) ?? [],
    ];
    areaLabel = areaNames.length ? [...new Set(areaNames)].join(", ") : "No mechanism linked";
  }
  return { id: referenceId(ref), label, areaLabel };
}

function evidenceDetail(ref: DomainReference, bootstrap: BootstrapPayload): string {
  switch (ref.kind) {
    case "report": {
      const report = bootstrap.reports.find(item => item.id === ref.id);
      return report ? [report.result, report.summary, report.notes && report.notes !== report.summary ? report.notes : null].filter(Boolean).join(" · ") || "Report has no recorded result or notes." : "Evidence record is unavailable.";
    }
    case "qa-finding": {
      const finding = bootstrap.qaFindings.find(item => item.id === ref.id);
      return finding ? finding.detail || finding.title : "Evidence record is unavailable.";
    }
    case "test-finding": {
      const finding = bootstrap.testFindings.find(item => item.id === ref.id);
      return finding ? finding.detail || finding.title : "Evidence record is unavailable.";
    }
    case "test-result": {
      const result = bootstrap.testResults.find(item => item.id === ref.id);
      return result ? `Recorded test status: ${result.status}.` : "Evidence record is unavailable.";
    }
    case "qa-request": {
      const request = bootstrap.qaRequests.find(item => item.id === ref.id);
      return request ? request.subject : "Evidence record is unavailable.";
    }
    case "artifact": {
      const artifact = bootstrap.artifacts.find(item => item.id === ref.id);
      return artifact ? artifact.title : "Evidence record is unavailable.";
    }
    default:
      return "Linked evidence record.";
  }
}

function evidenceForReference(ref: DomainReference, role: ConcernEvidence["role"], bootstrap: BootstrapPayload): ConcernEvidence {
  const reference = getRiskRecordReference(ref, bootstrap);
  return {
    id: referenceId(ref),
    label: reference.label,
    detail: reference.available ? evidenceDetail(ref, bootstrap) : "Evidence record is unavailable.",
    available: reference.available,
    kind: ref.kind,
    role,
  };
}

function concernSubjects(risk: RiskRecord, bootstrap: BootstrapPayload): ConcernSubject[] {
  const subjects = new Map<string, ConcernSubject>();
  for (const ref of risk.relatedTargets.filter((item): item is Extract<DomainReference, { kind: "task" | "mechanism" | "subsystem" }> => item.kind === "task" || item.kind === "mechanism" || item.kind === "subsystem")) {
    const subject = subjectForReference(ref, bootstrap);
    subjects.set(subject.id, subject);
    if (ref.kind !== "task") continue;
    const task = bootstrap.tasks.find(item => item.id === ref.id);
    for (const id of task?.mechanismIds ?? []) {
      const area = subjectForReference({ kind: "mechanism", id }, bootstrap);
      subjects.set(area.id, area);
    }
    for (const id of task?.subsystemIds ?? []) {
      const area = subjectForReference({ kind: "subsystem", id }, bootstrap);
      subjects.set(area.id, area);
    }
  }
  if (![...subjects.values()].some(subject => subject.id.startsWith("mechanism:") || subject.id.startsWith("subsystem:"))) {
    subjects.set("no-mechanism", { id: "no-mechanism", label: "No mechanism linked", areaLabel: "No mechanism linked" });
  }
  return [...subjects.values()];
}

function concernMilestones(risk: RiskRecord, bootstrap: BootstrapPayload): ConcernMilestone[] {
  const requirements = bootstrap.milestoneRequirements
    .filter(item => item.targetRefs.some(ref => ref.kind === "risk" && ref.id === risk.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const milestoneIds = new Set<string>([
    ...requirements.map(item => item.milestoneId),
    ...risk.relatedTargets.filter((ref): ref is Extract<DomainReference, { kind: "milestone" }> => ref.kind === "milestone").map(ref => ref.id),
    ...(risk.source.kind === "milestone" ? [risk.source.id] : []),
  ]);
  return [...milestoneIds].map(id => {
    const milestone = bootstrap.milestones.find(item => item.id === id);
    const conditions = requirements.filter(item => item.milestoneId === id).map(item => ({
      id: item.id,
      required: item.required,
      conditionType: item.conditionType,
      conditionValue: item.conditionValue,
      notes: item.notes,
    }));
    const requiredBefore = conditions.some(condition => condition.required && condition.conditionType === "workflow-state" && condition.conditionValue === "resolved");
    return {
      id,
      title: milestone?.title ?? `Unavailable milestone · ${id}`,
      date: milestone?.startAt ?? null,
      basis: requiredBefore ? "required" as const : "linked" as const,
      ...(conditions.length ? { conditions } : {}),
    };
  });
}

function ownerLabel(risk: RiskRecord, bootstrap: BootstrapPayload) {
  if (risk.ownerMemberId) return bootstrap.members.find(item => item.id === risk.ownerMemberId)?.name ?? `Unavailable member · ${risk.ownerMemberId}`;
  if (risk.ownerGroupId) return bootstrap.responsibleGroups.find(item => item.id === risk.ownerGroupId)?.name ?? `Unavailable group · ${risk.ownerGroupId}`;
  return "Unassigned";
}

function mitigationForRisk(risk: RiskRecord, bootstrap: BootstrapPayload): ConcernMitigation | null {
  if (!risk.mitigationTaskId) return null;
  const task = bootstrap.tasks.find(item => item.id === risk.mitigationTaskId);
  return { id: risk.mitigationTaskId, title: task?.title ?? `Unavailable task · ${risk.mitigationTaskId}`, status: task?.status ?? "unavailable" };
}

function evidenceForRisk(risk: RiskRecord, bootstrap: BootstrapPayload): ConcernEvidence[] {
  const references = new Map<string, { ref: DomainReference; role: ConcernEvidence["role"] }>();
  if (risk.source.kind !== "manual" && evidenceKinds.has(risk.source.kind)) {
    references.set(referenceId(risk.source), { ref: risk.source, role: "source" });
  }
  for (const ref of risk.relatedTargets.filter((item): item is DomainReference => evidenceKinds.has(item.kind))) {
    const id = referenceId(ref);
    if (!references.has(id)) references.set(id, { ref, role: "supporting" });
  }
  return [...references.values()].map(({ ref, role }) => evidenceForReference(ref, role, bootstrap));
}

export function buildPrototypeConcerns(bootstrap: BootstrapPayload): PrototypeConcern[] {
  return bootstrap.risks.map(risk => ({
    id: risk.id,
    title: risk.title,
    detail: risk.detail,
    severity: risk.severity,
    status: risk.status,
    blocksWork: risk.blocksWork,
    projectId: risk.projectId,
    ownerLabel: ownerLabel(risk, bootstrap),
    subjects: concernSubjects(risk, bootstrap),
    evidence: evidenceForRisk(risk, bootstrap),
    mitigation: mitigationForRisk(risk, bootstrap),
    milestones: concernMilestones(risk, bootstrap),
    temporaryRepair: null,
    verification: { criteria: "Not recorded", status: "not-recorded" },
    scenario: false,
  }));
}

export function filterPrototypeConcerns(concerns: PrototypeConcern[], options: ConcernFilterOptions = {}): PrototypeConcern[] {
  const query = options.search?.trim().toLocaleLowerCase() ?? "";
  return concerns.filter(concern => {
    if (!options.includeResolved && concern.status === "resolved") return false;
    if (options.milestone && !concern.milestones.some(milestone => milestone.id === options.milestone)) return false;
    if (options.subject && !concern.subjects.some(subject => subject.id === options.subject || subject.id.endsWith(`:${options.subject}`))) return false;
    if (!query) return true;
    const searchable = [
      concern.title,
      concern.detail,
      concern.ownerLabel,
      concern.temporaryRepair,
      concern.verification.criteria,
      concern.verification.evidence,
      concern.mitigation?.title,
      ...concern.milestones.map(milestone => milestone.title),
      ...concern.subjects.flatMap(subject => [subject.label, subject.areaLabel]),
      ...concern.evidence.flatMap(evidence => [evidence.label, evidence.detail]),
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    return searchable.includes(query);
  });
}

export function buildConcernAreas(concerns: PrototypeConcern[]): ConcernArea[] {
  const areas = new Map<string, { subject: ConcernSubject; concerns: Map<string, PrototypeConcern> }>();
  for (const concern of concerns) {
    if (concern.status === "resolved") continue;
    for (const subject of concern.subjects.filter(item => item.id.startsWith("mechanism:") || item.id.startsWith("subsystem:") || item.id === "no-mechanism")) {
      const area = areas.get(subject.id) ?? { subject, concerns: new Map<string, PrototypeConcern>() };
      area.concerns.set(concern.id, concern);
      areas.set(subject.id, area);
    }
  }
  return [...areas.values()].map(({ subject, concerns: uniqueConcerns }) => {
    const items = [...uniqueConcerns.values()];
    return {
      id: subject.id,
      label: subject.label,
      areaLabel: subject.areaLabel,
      count: items.length,
      highCount: items.filter(item => item.severity === "high").length,
      criticalCount: items.filter(item => item.severity === "critical").length,
    };
  }).sort((a, b) => a.areaLabel.localeCompare(b.areaLabel) || a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}

export function buildConcernContextTasks(bootstrap: BootstrapPayload): ConcernContextTask[] {
  return bootstrap.tasks.filter(task => task.status !== "complete").map(task => {
    const subjectIds = [...new Set([
      ...task.mechanismIds.map(id => `mechanism:${id}`),
      ...task.subsystemIds.map(id => `subsystem:${id}`),
    ])];
    const planningState = getTaskPlanningState(task, bootstrap);
    return {
      id: task.id,
      title: task.title,
      subjectIds: subjectIds.length ? subjectIds : ["no-mechanism"],
      status: task.status,
      blocked: planningState === "blocked",
      waitingOnDependency: planningState === "waiting-on-dependency",
      scenario: false,
    };
  });
}

const scenarioProject = "scenario-project";
const scenarioTask = (id: string, title: string, subjectIds: string[], status: TaskStatus, blocked = false): ConcernContextTask => ({ id, title, subjectIds, status, blocked, waitingOnDependency: false, scenario: true });
const scenarioConcern = (concern: Omit<PrototypeConcern, "scenario">): PrototypeConcern => ({ ...concern, scenario: true });

export function createConcernScenarioTasks(): ConcernContextTask[] {
  return [
    scenarioTask("scenario-task-drive-inspection", "Inspect drive mount after impact", ["mechanism:scenario-drive-mount"], "not-started"),
    scenarioTask("scenario-task-intake-redesign", "Replace patched intake guard", ["mechanism:scenario-intake-guard"], "in-progress"),
    scenarioTask("scenario-task-climber-retest", "Repeat climber load test", ["mechanism:scenario-climber"], "not-started", true),
  ];
}

export function createConcernScenarios(): PrototypeConcern[] {
  return [
    scenarioConcern({
      id: "scenario-fragile-drive-mount",
      title: "Drive mount may be too fragile under a direct hit",
      detail: "The concern is suspected from the current design review; no direct-hit failure has been demonstrated.",
      severity: "high",
      status: "open",
      blocksWork: false,
      projectId: scenarioProject,
      ownerLabel: "Unassigned",
      subjects: [{ id: "mechanism:scenario-drive-mount", label: "Drive mount", areaLabel: "Drivetrain" }],
      evidence: [{ id: "review:scenario-drive-review", label: "Illustrative design review note", detail: "Suspected weakness; impact test not yet run.", available: true, kind: "report", role: "source" }],
      mitigation: null,
      milestones: [],
      temporaryRepair: null,
      verification: { criteria: "Inspect mount after representative impact test", status: "pending" },
    }),
    scenarioConcern({
      id: "scenario-intake-ad-hoc-repair",
      title: "Intake guard was patched ad hoc; redesign remains open",
      detail: "A temporary shim restored clearance. The permanent geometry change still needs review and fit verification.",
      severity: "high",
      status: "in-progress",
      blocksWork: false,
      projectId: scenarioProject,
      ownerLabel: "Mechanical team (illustrative)",
      subjects: [{ id: "mechanism:scenario-intake-guard", label: "Intake guard", areaLabel: "Manipulator" }],
      evidence: [{ id: "qa-finding:scenario-intake-clearance", label: "Illustrative QA finding", detail: "Guard contacted the frame during assembly.", available: true, kind: "qa-finding", role: "source" }],
      mitigation: { id: "scenario-task-intake-shim", title: "Fit temporary intake shim", status: "complete" },
      milestones: [],
      temporaryRepair: "Temporary shim fitted; permanent guard geometry remains unchanged.",
      verification: { criteria: "Check clearance across the full mechanism travel after redesign", status: "pending" },
    }),
    scenarioConcern({
      id: "scenario-climber-load-failure",
      title: "Climber bracket failed the repeated load test",
      detail: "The bracket cracked during the second recorded load cycle.",
      severity: "critical",
      status: "open",
      blocksWork: true,
      projectId: scenarioProject,
      ownerLabel: "Unassigned",
      subjects: [{ id: "mechanism:scenario-climber", label: "Climber", areaLabel: "Climber" }],
      evidence: [{ id: "test-result:scenario-climber-test", label: "Illustrative repeated load test", detail: "Recorded test status: fail. Crack observed on cycle two.", available: true, kind: "test-result", role: "source" }],
      mitigation: { id: "scenario-task-climber-retest", title: "Repeat climber load test", status: "not-started" },
      milestones: [],
      temporaryRepair: null,
      verification: { criteria: "Pass the repeated load test on the revised bracket", status: "pending" },
    }),
    scenarioConcern({
      id: "scenario-shared-belt-tension",
      title: "Belt tension drops across two linked mechanisms",
      detail: "The same tension loss is visible at both the intake and feeder interfaces.",
      severity: "medium",
      status: "open",
      blocksWork: false,
      projectId: scenarioProject,
      ownerLabel: "Mechanical team (illustrative)",
      subjects: [
        { id: "mechanism:scenario-intake", label: "Intake", areaLabel: "Manipulator" },
        { id: "mechanism:scenario-feeder", label: "Feeder", areaLabel: "Manipulator" },
      ],
      evidence: [{ id: "report:scenario-belt-review", label: "Illustrative inspection report", detail: "Tension loss observed at both interfaces.", available: true, kind: "report", role: "source" }],
      mitigation: null,
      milestones: [],
      temporaryRepair: null,
      verification: { criteria: "Verify belt tension under a full handling cycle", status: "pending" },
    }),
    scenarioConcern({
      id: "scenario-unowned-evidence-gap",
      title: "Frame corner may interfere with the service panel",
      detail: "A concern was raised, but no evidence, owner, action, or date has been recorded.",
      severity: "medium",
      status: "open",
      blocksWork: false,
      projectId: scenarioProject,
      ownerLabel: "Unassigned",
      subjects: [{ id: "no-mechanism", label: "No mechanism linked", areaLabel: "No mechanism linked" }],
      evidence: [],
      mitigation: null,
      milestones: [],
      temporaryRepair: null,
      verification: { criteria: "Not recorded", status: "not-recorded" },
    }),
    scenarioConcern({
      id: "scenario-linked-review-date",
      title: "Intake clearance should be reviewed at design check",
      detail: "The concern is linked to the review date; no requirement says it must be cleared before that milestone.",
      severity: "medium",
      status: "open",
      blocksWork: false,
      projectId: scenarioProject,
      ownerLabel: "Unassigned",
      subjects: [{ id: "mechanism:scenario-intake-clearance", label: "Intake clearance", areaLabel: "Manipulator" }],
      evidence: [],
      mitigation: null,
      milestones: [{ id: "scenario-design-check", title: "Illustrative design check", date: "2026-11-12", basis: "linked" }],
      temporaryRepair: null,
      verification: { criteria: "Not recorded", status: "not-recorded" },
    }),
    scenarioConcern({
      id: "scenario-required-before-review",
      title: "Climber verification is required before design review",
      detail: "The example includes an explicit required milestone relation; the review date alone does not create that commitment.",
      severity: "high",
      status: "open",
      blocksWork: false,
      projectId: scenarioProject,
      ownerLabel: "Unassigned",
      subjects: [{ id: "mechanism:scenario-climber", label: "Climber", areaLabel: "Climber" }],
      evidence: [],
      mitigation: null,
      milestones: [
        { id: "scenario-load-review", title: "Illustrative load review", date: "2026-11-18", basis: "required", conditions: [{ id: "scenario-condition-load-review", required: true, conditionType: "workflow-state", conditionValue: "resolved", notes: "Illustrative explicit closure requirement." }] },
        { id: "scenario-test-plan-review", title: "Illustrative test-plan review", date: "2026-11-16", basis: "linked", conditions: [{ id: "scenario-condition-test-plan", required: true, conditionType: "custom", conditionValue: "Review test plan", notes: "Review test plan; not clearance before the milestone." }] },
      ],
      temporaryRepair: null,
      verification: { criteria: "Not recorded", status: "not-recorded" },
    }),
    scenarioConcern({
      id: "scenario-unavailable-evidence",
      title: "Gearbox vibration report is unavailable",
      detail: "The concern retains its recorded report reference and makes the missing evidence visible.",
      severity: "medium",
      status: "open",
      blocksWork: false,
      projectId: scenarioProject,
      ownerLabel: "Unassigned",
      subjects: [{ id: "mechanism:scenario-gearbox", label: "Gearbox", areaLabel: "Drivetrain" }],
      evidence: [{ id: "report:scenario-missing-vibration-report", label: "Unavailable report · scenario-missing-vibration-report", detail: "Evidence record is unavailable.", available: false, kind: "report", role: "source" }],
      mitigation: null,
      milestones: [],
      temporaryRepair: null,
      verification: { criteria: "Not recorded", status: "not-recorded" },
    }),
    scenarioConcern({
      id: "scenario-resolved-bracket-review",
      title: "Sensor bracket edge quality verified after rework",
      detail: "The revised edge passed the recorded inspection and the concern was resolved explicitly.",
      severity: "low",
      status: "resolved",
      blocksWork: false,
      projectId: scenarioProject,
      ownerLabel: "Mechanical team (illustrative)",
      subjects: [{ id: "mechanism:scenario-sensor-bracket", label: "Sensor bracket", areaLabel: "Drivetrain" }],
      evidence: [{ id: "qa-finding:scenario-bracket-inspection", label: "Illustrative verification result", detail: "Inspection passed after rework.", available: true, kind: "qa-finding", role: "supporting" }],
      mitigation: { id: "scenario-task-bracket-rework", title: "Deburr and inspect bracket", status: "complete" },
      milestones: [],
      temporaryRepair: null,
      verification: { criteria: "Inspect all revised bracket edges", status: "verified", evidence: "Illustrative inspection passed." },
    }),
  ];
}
