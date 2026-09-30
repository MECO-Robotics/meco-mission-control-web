import type { DomainReference, RiskSeverity } from "./common";

export type ReportStatus = "draft" | "submitted" | "reviewed";

export interface ReportRecord {
  id: string;
  projectId: string;
  reportType: "qa" | "practice" | "competition" | "review";
  targetRefs: DomainReference[];
  createdByMemberId: string | null;
  participantIds: string[];
  mentorId: string | null;
  requestedById: string | null;
  summary: string;
  notes: string;
  evidenceNotes?: string;
  photoUrl?: string;
  createdAt: string;
  status: ReportStatus;
  result: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
}

export interface QaFindingRecord {
  id: string;
  reportId: string | null;
  projectId: string;
  targetRefs: DomainReference[];
  title: string;
  detail: string;
  severity: RiskSeverity;
  status: "open" | "in-progress" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export interface TestResultRecord {
  id: string;
  projectId: string;
  targetRefs: DomainReference[];
  title: string;
  status: "pass" | "fail" | "blocked";
}

export interface TestFindingRecord extends QaFindingRecord {
  testResultId: string;
}

export interface RiskRecord {
  id: string;
  projectId: string;
  title: string;
  detail: string;
  category: "dependency" | "design" | "manufacturing" | "supply" | "schedule" | "qa" | "inventory" | "other";
  severity: RiskSeverity;
  status: "open" | "mitigating" | "accepted" | "resolved";
  blocksWork: boolean;
  source:
    | { kind: "manual" }
    | { kind: "task" | "task-dependency" | "qa-finding" | "test-finding" | "qa-request" | "test-result" | "report" | "event" | "milestone" | "manufacturing-details" | "part-instance" | "material"; id: string };
  relatedTargets: DomainReference[];
  mitigationTaskId: string | null;
  ownerGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface DesignIterationRecord {
  id: string;
  taskId: string | null;
  sourceType: "qa-finding" | "test-finding" | "manual";
  sourceId: string | null;
  title: string;
  summary: string;
  createdAt: string;
}
