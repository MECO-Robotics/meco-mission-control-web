export type MemberRole = "student" | "lead" | "mentor" | "admin" | "external";

export type PlannedAttendanceDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

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
export type ReadinessStatus = "not-ready" | "blocked" | "qa" | "ready";
export type MilestoneStatus = "planned" | "active" | "complete";
export type MeetingType = "general" | "build" | "review" | "outreach" | "competition" | "other";
export type PartInstanceStatus = ReadinessStatus;
export type TaskDependencyKind = "task" | "milestone" | "part-instance";
export type TaskDependencyType = "hard" | "soft";
export type TaskBlockerSourceKind = "task" | "milestone" | "workstream" | "mechanism" | "part_instance" | "artifact_instance" | "external";
export type TaskBlockerType =
  | "external"
  | "lost-part"
  | "broken-part"
  | "lost-tool"
  | "broken-tool"
  | "design-issue"
  | "manufacturing-unavailable"
  | "shipping-delay"
  | "qa-failed"
  | "other";
export const TASK_BLOCKER_TYPE_LABELS: Record<TaskBlockerType, string> = {
  external: "External",
  "lost-part": "Lost part",
  "broken-part": "Broken part",
  "lost-tool": "Lost tool",
  "broken-tool": "Broken tool",
  "design-issue": "Design issue",
  "manufacturing-unavailable": "Manufacturing unavailable",
  "shipping-delay": "Shipping delay",
  "qa-failed": "QA failed",
  other: "Other",
};
export const TASK_BLOCKER_TYPE_OPTIONS = Object.entries(TASK_BLOCKER_TYPE_LABELS).map(
  ([id, name]) => ({ id: id as TaskBlockerType, name }),
);
export type TaskBlockerSeverity = "low" | "medium" | "high" | "critical";
export type TaskBlockerStatus = "open" | "resolved";
export type ManufacturingStatus = "requested" | "approved" | "in-progress" | "qa" | "complete";
export type PurchaseStatus = "requested" | "approved" | "purchased" | "shipped" | "delivered";
export type MaterialCategory = "metal" | "plastic" | "filament" | "electronics" | "hardware" | "consumable" | "other";
export type ArtifactKind = "document" | "nontechnical";
export type ArtifactStatus = "draft" | "in-review" | "published";
export type SeasonType = "season" | "offseason" | "initiative";
export type ProjectType = "robot" | "media" | "outreach" | "operations" | "strategy" | "training";
export type ProjectStatus = "planned" | "active" | "paused" | "complete";
export type TestResultStatus = "pass" | "fail" | "blocked";
export type RiskSeverity = "critical" | "high" | "medium" | "low";
export type RiskReassessmentStatus = "partial-mitigation" | "full-mitigation";
export type RiskAttachmentType = "project" | "workstream" | "mechanism" | "part-instance";
export type FindingStatus = "open" | "resolved";
export type DesignIterationSourceType = "qa-finding" | "test-finding" | "manual";

export type WorkTypeCode = string;
export type AcquisitionMethod = "stock" | "purchase-cots" | "manufacture";
export type FulfillmentSource = "in-house" | "outsourced";
export type PurchaseKind = "cots-goods" | "manufacturing-service";
export type PurchaseApprovalStatus = "pending" | "approved" | "rejected";
export type PurchaseOrderStatus = "not-ordered" | "ordered" | "shipped" | "delivered" | "cancelled";
export type PartInstanceLocation =
  | { kind: "stock"; location: string }
  | { kind: "installed"; subsystemId: string; mechanismId: string | null }
  | { kind: "repair"; location: string }
  | { kind: "retired"; location: string | null }
  | { kind: "lost" }
  | { kind: "unlocated" };

export type ScheduleReference =
  | { kind: "meeting"; id: string }
  | { kind: "event"; id: string }
  | { kind: "milestone"; id: string };

export type DomainReference =
  | { kind: "project"; id: string }
  | { kind: "workstream"; id: string }
  | { kind: "responsible-group"; id: string }
  | { kind: "task"; id: string }
  | { kind: "subsystem"; id: string }
  | { kind: "mechanism"; id: string }
  | { kind: "part-definition"; id: string }
  | { kind: "part-instance"; id: string }
  | { kind: "material"; id: string }
  | { kind: "vendor"; id: string }
  | { kind: "manufacturing-details"; id: string }
  | { kind: "purchase-item"; id: string }
  | { kind: "meeting"; id: string }
  | { kind: "event"; id: string }
  | { kind: "milestone"; id: string }
  | { kind: "qa-request"; id: string }
  | { kind: "test-result"; id: string }
  | { kind: "report"; id: string }
  | { kind: "artifact"; id: string }
  | { kind: "qa-finding"; id: string }
  | { kind: "test-finding"; id: string }
  | { kind: "task-dependency"; id: string }
  | { kind: "risk"; id: string }
  | { kind: "design-iteration"; id: string };

export type PartInstanceDependencyCondition =
  | { kind: "physical-location"; value: PartInstanceLocation["kind"] }
  | { kind: "derived-readiness"; value: ReadinessStatus };
