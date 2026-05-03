export type MemberRole = "student" | "lead" | "mentor" | "admin" | "external";

export type MilestoneType =
  | "practice"
  | "competition"
  | "deadline"
  | "internal-review"
  | "demo";

export type DisciplineCode =
  | "design"
  | "manufacturing"
  | "assembly"
  | "electrical"
  | "programming"
  | "testing"
  | "planning"
  | "communications"
  | "finance"
  | "research"
  | "documentation"
  | "engagement"
  | "presentation"
  | "media_production"
  | "partnerships"
  | "game_analysis"
  | "scouting"
  | "data_analysis"
  | "risk_review"
  | "curriculum"
  | "instruction"
  | "practice"
  | "assessment"
  | "photography"
  | "video"
  | "graphics"
  | "writing"
  | "web"
  | "social_media";

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "not-started" | "in-progress" | "waiting-for-qa" | "complete";
export type TaskPlanningState = "ready" | "waiting-on-dependency" | "blocked" | "overdue" | "at-risk";
export type MilestoneStatus = "not ready" | "blocked" | "qa" | "ready";
export type PartInstanceStatus = MilestoneStatus;
export type TaskDependencyKind = "task" | "milestone" | "part_instance";
export type TaskDependencyType = "hard" | "soft";
export type TaskBlockerType =
  | "task"
  | "milestone"
  | "workstream"
  | "mechanism"
  | "part_instance"
  | "artifact_instance"
  | "external";
export type TaskBlockerSeverity = "low" | "medium" | "high" | "critical";
export type TaskBlockerStatus = "open" | "resolved";
export type ManufacturingProcess = "3d-print" | "cnc" | "fabrication";
export type ManufacturingStatus = "requested" | "approved" | "in-progress" | "qa" | "complete";
export type PurchaseStatus = "requested" | "approved" | "purchased" | "shipped" | "delivered";
export type MaterialCategory = "metal" | "plastic" | "filament" | "electronics" | "hardware" | "consumable" | "other";
export type ArtifactKind = "document" | "nontechnical";
export type ArtifactStatus = "draft" | "in-review" | "published";
export type SeasonType = "season" | "offseason" | "initiative";
export type ProjectType = "robot" | "operations" | "outreach" | "other";
export type ProjectStatus = "planned" | "active" | "paused" | "complete";
export type TestResultStatus = "pass" | "fail" | "blocked";
export type ReportType = "QA" | "MilestoneTest" | "Practice" | "Competition" | "Review";
export type RiskSeverity = "high" | "medium" | "low";
export type RiskAttachmentType = "project" | "workstream" | "mechanism" | "part-instance";
export type FindingStatus = "open" | "resolved";
export type DesignIterationSourceType = "qa-finding" | "test-finding" | "manual";
