import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskRecord } from "@/types/recordsReporting";
import {
  buildConcernAreas,
  buildConcernContextTasks,
  buildPrototypeConcerns,
  createConcernScenarioTasks,
  createConcernScenarios,
  filterPrototypeConcerns,
} from "../riskConcernPrototypeModel";

function risk(id: string, patch: Partial<RiskRecord> = {}): RiskRecord {
  return {
    id,
    projectId: "project-1",
    title: `Concern ${id}`,
    detail: "Recorded concern detail.",
    category: "design",
    severity: "medium",
    status: "open",
    blocksWork: false,
    source: { kind: "manual" },
    relatedTargets: [],
    mitigationTaskId: null,
    ownerGroupId: null,
    ownerMemberId: null,
    mitigationDueDate: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    resolvedAt: null,
    ...patch,
  };
}

function task(id: string, patch: Partial<BootstrapPayload["tasks"][number]> = {}): BootstrapPayload["tasks"][number] {
  return {
    id,
    projectId: "project-1",
    workTypeId: "design",
    responsibleGroupId: null,
    workstreamIds: [],
    title: `Task ${id}`,
    summary: "",
    subsystemIds: [],
    mechanismIds: [],
    partInstanceIds: [],
    scheduleRefs: [],
    requestedById: null,
    ownerId: null,
    assigneeIds: [],
    mentorId: null,
    startDate: "2026-01-01",
    dueDate: "2026-01-10",
    priority: "medium",
    status: "not-started",
    checklistItems: [],
    manufacturingDetails: null,
    estimatedHours: 1,
    actualHours: 0,
    requiresDocumentation: false,
    ...patch,
  };
}

function bootstrap(): BootstrapPayload {
  return { ...EMPTY_BOOTSTRAP };
}

it("keeps the seven illustrative concern scenarios explicit and semantically distinct", () => {
  const scenarios = createConcernScenarios();
  const fragile = scenarios.find(item => item.id === "scenario-fragile-drive-mount")!;
  const repaired = scenarios.find(item => item.id === "scenario-intake-ad-hoc-repair")!;
  const observed = scenarios.find(item => item.id === "scenario-climber-load-failure")!;
  const linkedDate = scenarios.find(item => item.id === "scenario-linked-review-date")!;
  const requiredDate = scenarios.find(item => item.id === "scenario-required-before-review")!;
  const unavailable = scenarios.find(item => item.id === "scenario-unavailable-evidence")!;
  const resolved = scenarios.find(item => item.id === "scenario-resolved-bracket-review")!;

  expect(scenarios).toHaveLength(9);
  expect(scenarios.every(item => item.scenario && item.id.startsWith("scenario-"))).toBe(true);
  expect(fragile.mitigation).toBeNull();
  expect(fragile.evidence[0].detail).toContain("not yet run");
  expect(repaired.mitigation?.status).toBe("complete");
  expect(repaired.status).toBe("in-progress");
  expect(repaired.temporaryRepair).toContain("Temporary shim");
  expect(repaired.verification.status).toBe("pending");
  expect(observed.evidence[0].detail).toContain("fail");
  expect(linkedDate.milestones[0].basis).toBe("linked");
  expect(requiredDate.milestones).toEqual([
    expect.objectContaining({
      id: "scenario-load-review", basis: "required",
      conditions: [expect.objectContaining({ conditionType: "workflow-state", conditionValue: "resolved", required: true })],
    }),
    expect.objectContaining({
      id: "scenario-test-plan-review", basis: "linked",
      conditions: [expect.objectContaining({ conditionType: "custom", conditionValue: "Review test plan", required: true, notes: "Review test plan; not clearance before the milestone." })],
    }),
  ]);
  expect(unavailable.evidence[0]).toMatchObject({ available: false, detail: "Evidence record is unavailable." });
  expect(fragile.evidence[0].role).toBe("source");
  expect(repaired.evidence[0].role).toBe("source");
  expect(resolved.evidence[0].role).toBe("supporting");
  expect(resolved.status).toBe("resolved");
  expect(resolved.verification.status).toBe("verified");
  expect(resolved.verification.evidence).toBeDefined();
});

it("normalizes recorded source and affected subjects without inventing repair or verification", () => {
  const data = bootstrap();
  data.subsystems = [{ id: "drive", projectId: "project-1", name: "Drivetrain", color: "", description: "", iteration: 1, isCore: true, parentSubsystemId: null, responsibleEngineerId: null, mentorIds: [] }];
  data.mechanisms = [{ id: "mount", subsystemId: "drive", name: "Camera mount", description: "", iteration: 1 }];
  data.tasks = [task("inspection", { title: "Inspect camera mount", mechanismIds: ["mount"] })];
  data.reports = [{
    id: "report-1", projectId: "project-1", reportType: "qa", targetRefs: [{ kind: "task", id: "inspection" }],
    createdByMemberId: null, participantIds: [], mentorId: null, requestedById: null,
    summary: "Mount flexed during a hand test.", notes: "Check again under load.", createdAt: "2026-01-01", status: "reviewed", result: "minor-fix",
  }];
  data.risks = [risk("risk-1", {
    title: "Camera mount flexes under load",
    source: { kind: "report", id: "report-1" },
    relatedTargets: [
      { kind: "task", id: "inspection" },
      { kind: "report", id: "report-1" },
      { kind: "qa-finding", id: "finding-1" },
    ],
  })];
  data.qaFindings = [{
    id: "finding-1", reportId: "report-1", projectId: "project-1", targetRefs: [{ kind: "task", id: "inspection" }],
    title: "Mount shifted during assembly", detail: "Witness mark moved after the hand test.", severity: "medium",
    status: "open", createdAt: "2026-01-01", updatedAt: "2026-01-01",
  }];

  const [concern] = buildPrototypeConcerns(data);
  expect(concern.scenario).toBe(false);
  expect(concern.subjects.map(item => item.id)).toEqual(["task:inspection", "mechanism:mount"]);
  expect(concern.subjects.find(item => item.id === "mechanism:mount")?.areaLabel).toBe("Drivetrain");
  expect(concern.evidence).toHaveLength(2);
  expect(concern.evidence).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: "report:report-1", role: "source", kind: "report", available: true }),
    expect.objectContaining({ id: "qa-finding:finding-1", role: "supporting", kind: "qa-finding", available: true }),
  ]));
  expect(concern.evidence.filter(item => item.id === "report:report-1")).toHaveLength(1);
  expect(concern.evidence[0].detail).toContain("minor-fix");
  expect(concern.temporaryRepair).toBeNull();
  expect(concern.verification).toEqual({ criteria: "Not recorded", status: "not-recorded" });

  data.risks = [risk("risk-missing-report", { source: { kind: "report", id: "missing-report" } })];
  const [unavailable] = buildPrototypeConcerns(data);
  expect(unavailable.evidence[0]).toMatchObject({ available: false, kind: "report", role: "source" });

  data.risks = [risk("risk-supporting-report", { relatedTargets: [{ kind: "report", id: "report-1" }] })];
  const [supportingOnly] = buildPrototypeConcerns(data);
  expect(supportingOnly.evidence).toEqual([expect.objectContaining({ id: "report:report-1", role: "supporting" })]);
});

it("does not expand a broad workstream target into mechanisms", () => {
  const data = bootstrap();
  data.subsystems = [{ id: "drive", projectId: "project-1", name: "Drivetrain", color: "", description: "", iteration: 1, isCore: true, parentSubsystemId: null, responsibleEngineerId: null, mentorIds: [] }];
  data.mechanisms = [{ id: "mount", subsystemId: "drive", name: "Camera mount", description: "", iteration: 1 }];
  data.workstreams = [{ id: "workstream-1", projectId: "project-1", name: "Robot", color: "", description: "", isArchived: false }];
  data.tasks = [task("drive-task", { mechanismIds: ["mount"] })];
  data.risks = [risk("risk-broad-target", { relatedTargets: [{ kind: "workstream", id: "workstream-1" }] })];

  const [concern] = buildPrototypeConcerns(data);
  expect(concern.subjects.some(item => item.id === "mechanism:mount")).toBe(false);
  expect(concern.subjects.map(item => item.id)).toEqual(["no-mechanism"]);
  expect(buildConcernAreas([concern])).toEqual([expect.objectContaining({ id: "no-mechanism", label: "No mechanism linked", count: 1 })]);
});

it("preserves all risk milestone links and only calls explicit resolved workflow requirements gates", () => {
  const data = bootstrap();
  data.milestones = [
    { id: "review-1", seasonId: "season-1", projectIds: ["project-1"], title: "Design review", type: "internal-review", status: "planned", startAt: "2026-02-01", endAt: null, description: "" },
    { id: "release-1", seasonId: "season-1", projectIds: ["project-1"], title: "Release review", type: "internal-review", status: "planned", startAt: "2026-03-01", endAt: null, description: "" },
  ];
  data.tasks = [task("scheduled-task", { scheduleRefs: [{ kind: "milestone", id: "review-1" }] })];
  data.risks = [
    risk("linked-risk", { relatedTargets: [{ kind: "milestone", id: "review-1" }, { kind: "milestone", id: "release-1" }, { kind: "milestone", id: "review-1" }] }),
    risk("required-risk"),
    risk("scheduled-only-risk"),
    risk("milestone-source-risk", { source: { kind: "milestone", id: "review-1" } }),
    risk("multiple-requirements-risk"),
  ];
  data.milestoneRequirements = [{
    id: "requirement-1", milestoneId: "review-1", targetRefs: [{ kind: "risk", id: "required-risk" }],
    conditionType: "custom", conditionValue: "review before release", required: true, sortOrder: 0, notes: "Planning note.",
  }, {
    id: "requirement-2", milestoneId: "review-1", targetRefs: [{ kind: "risk", id: "multiple-requirements-risk" }],
    conditionType: "iteration", conditionValue: "3", required: true, sortOrder: 0, notes: "Iteration requirement is not a resolution gate.",
  }, {
    id: "requirement-3", milestoneId: "review-1", targetRefs: [{ kind: "risk", id: "multiple-requirements-risk" }],
    conditionType: "workflow-state", conditionValue: "resolved", required: true, sortOrder: 1, notes: "Clear the concern before this review.",
  }, {
    id: "requirement-4", milestoneId: "release-1", targetRefs: [{ kind: "risk", id: "multiple-requirements-risk" }],
    conditionType: "workflow-state", conditionValue: "in-progress", required: true, sortOrder: 2, notes: "Other required workflow condition.",
  }];

  const concerns = buildPrototypeConcerns(data);
  expect(concerns.find(item => item.id === "linked-risk")?.milestones).toEqual([
    expect.objectContaining({ id: "review-1", basis: "linked", date: "2026-02-01" }),
    expect.objectContaining({ id: "release-1", basis: "linked", date: "2026-03-01" }),
  ]);
  expect(concerns.find(item => item.id === "required-risk")?.milestones[0]).toMatchObject({
    basis: "linked", title: "Design review",
    conditions: [{ id: "requirement-1", required: true, conditionType: "custom", conditionValue: "review before release", notes: "Planning note." }],
  });
  expect(concerns.find(item => item.id === "scheduled-only-risk")?.milestones).toEqual([]);
  expect(concerns.find(item => item.id === "milestone-source-risk")).toMatchObject({ milestones: [{ basis: "linked", id: "review-1" }], evidence: [] });
  expect(concerns.find(item => item.id === "multiple-requirements-risk")?.milestones).toEqual([
    expect.objectContaining({
      id: "review-1", basis: "required",
      conditions: [
        { id: "requirement-2", required: true, conditionType: "iteration", conditionValue: "3", notes: "Iteration requirement is not a resolution gate." },
        { id: "requirement-3", required: true, conditionType: "workflow-state", conditionValue: "resolved", notes: "Clear the concern before this review." },
      ],
    }),
    expect.objectContaining({
      id: "release-1", basis: "linked",
      conditions: [{ id: "requirement-4", required: true, conditionType: "workflow-state", conditionValue: "in-progress", notes: "Other required workflow condition." }],
    }),
  ]);
});

it("filters by text, explicit subject, and milestone while excluding resolved concerns by default", () => {
  const scenarios = createConcernScenarios();
  expect(filterPrototypeConcerns(scenarios, { search: "impact test" }).map(item => item.id)).toEqual(["scenario-fragile-drive-mount"]);
  expect(filterPrototypeConcerns(scenarios, { subject: "scenario-intake" }).map(item => item.id)).toContain("scenario-shared-belt-tension");
  expect(filterPrototypeConcerns(scenarios, { milestone: "scenario-design-check" }).map(item => item.id)).toEqual(["scenario-linked-review-date"]);
  expect(filterPrototypeConcerns(scenarios).some(item => item.status === "resolved")).toBe(false);
  expect(filterPrototypeConcerns(scenarios, { includeResolved: true }).some(item => item.status === "resolved")).toBe(true);
});

it("counts each open concern once per explicit area subject and separates high from critical", () => {
  const data = bootstrap();
  data.subsystems = [
    { id: "drive", projectId: "project-1", name: "Drivetrain", color: "", description: "", iteration: 1, isCore: true, parentSubsystemId: null, responsibleEngineerId: null, mentorIds: [] },
    { id: "manipulator", projectId: "project-1", name: "Manipulator", color: "", description: "", iteration: 1, isCore: false, parentSubsystemId: null, responsibleEngineerId: null, mentorIds: [] },
  ];
  data.mechanisms = [
    { id: "left", subsystemId: "drive", name: "Left mount", description: "", iteration: 1 },
    { id: "right", subsystemId: "drive", name: "Right mount", description: "", iteration: 1 },
    { id: "intake", subsystemId: "manipulator", name: "Intake", description: "", iteration: 1 },
  ];
  data.risks = [
    risk("risk-high", { severity: "high", relatedTargets: [{ kind: "mechanism", id: "left" }, { kind: "mechanism", id: "left" }] }),
    risk("risk-critical", { severity: "critical", relatedTargets: [{ kind: "mechanism", id: "left" }, { kind: "mechanism", id: "intake" }] }),
    risk("risk-resolved", { severity: "critical", status: "resolved", relatedTargets: [{ kind: "mechanism", id: "left" }] }),
  ];

  const areas = buildConcernAreas(buildPrototypeConcerns(data));
  expect(areas.find(item => item.id === "mechanism:left")).toMatchObject({ count: 2, highCount: 1, criticalCount: 1 });
  expect(areas.find(item => item.id === "mechanism:intake")).toMatchObject({ count: 1, highCount: 0, criticalCount: 1 });
  expect(areas.find(item => item.id === "mechanism:right")).toBeUndefined();
});

it("keeps unfinished task pressure independent from mitigation links and uses only explicit task subjects", () => {
  const data = bootstrap();
  data.tasks = [
    task("open", { mechanismIds: ["mount"], isWaitingOnDependency: true }),
    task("blocked", { subsystemIds: ["drive"] }),
    task("waiting", { dueDate: "2099-01-01" }),
    task("complete", { status: "complete", mechanismIds: ["mount"] }),
  ];
  data.taskDependencies = [{ id: "dependency-1", taskId: "waiting", kind: "task", refId: "missing-prerequisite", dependencyType: "hard", createdAt: "2026-01-01" }];
  data.risks = [risk("risk-blocker", { blocksWork: true, relatedTargets: [{ kind: "task", id: "blocked" }] }), risk("risk-1", { mitigationTaskId: "open" })];

  expect(buildConcernContextTasks(data)).toEqual([
    { id: "open", title: "Task open", subjectIds: ["mechanism:mount"], status: "not-started", blocked: false, waitingOnDependency: false, scenario: false },
    { id: "blocked", title: "Task blocked", subjectIds: ["subsystem:drive"], status: "not-started", blocked: true, waitingOnDependency: false, scenario: false },
    { id: "waiting", title: "Task waiting", subjectIds: ["no-mechanism"], status: "not-started", blocked: false, waitingOnDependency: true, scenario: false },
  ]);
  expect(createConcernScenarioTasks().every(item => item.scenario)).toBe(true);
  expect(createConcernScenarioTasks().some(item => item.status === "complete")).toBe(false);
});
