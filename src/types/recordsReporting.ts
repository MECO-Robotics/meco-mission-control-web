import type {
  DesignIterationSourceType,
  FindingStatus,
  ReportType,
  RiskAttachmentType,
  RiskSeverity,
  TestResultStatus,
} from "./common";

export interface ReportRecord {
  id: string;
  reportType: ReportType;
  projectId: string;
  taskId: string | null;
  milestoneId: string | null;
  workstreamId: string | null;
  createdByMemberId: string | null;
  result: string;
  summary: string;
  notes: string;
  photoUrl?: string;
  createdAt: string;
  participantIds?: string[];
  mentorApproved?: boolean;
  reviewedAt?: string;
  title?: string;
  status?: TestResultStatus;
  findings?: string[];
}

export interface ReportFindingRecord {
  id: string;
  reportId: string;
  mechanismId: string | null;
  partInstanceId: string | null;
  artifactInstanceId: string | null;
  issueType: string;
  severity: RiskSeverity;
  notes: string;
  spawnedTaskId: string | null;
  spawnedIterationId: string | null;
  spawnedRiskId: string | null;
  title?: string;
  detail?: string;
  status?: FindingStatus;
  projectId?: string;
  workstreamId?: string | null;
  subsystemId?: string | null;
  taskId?: string | null;
  milestoneId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type QaReportRecord = ReportRecord;
export type TestResultRecord = ReportRecord;

export interface QaFindingRecord {
  id: string;
  taskId: string | null;
  qaReportId: string | null;
  title: string;
  detail: string;
  severity: RiskSeverity;
  status: FindingStatus;
}

export interface TestFindingRecord {
  id: string;
  taskId: string | null;
  testResultId: string | null;
  title: string;
  detail: string;
  severity: RiskSeverity;
  status: FindingStatus;
}

export interface DesignIterationRecord {
  id: string;
  taskId: string | null;
  sourceType: DesignIterationSourceType;
  sourceId: string | null;
  title: string;
  summary: string;
  createdAt: string;
}

export interface RiskRecord {
  id: string;
  title: string;
  detail: string;
  severity: RiskSeverity;
  sourceType: "qa-report" | "test-result";
  sourceId: string;
  attachmentType: RiskAttachmentType;
  attachmentId: string;
  mitigationTaskId: string | null;
}
