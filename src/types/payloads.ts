import type {
  ArtifactKind,
  ArtifactStatus,
  AcquisitionMethod,
  DomainReference,
  PartInstanceLocation,
  MilestoneType,
  MilestoneStatus,
  MaterialCategory,
  MeetingType,
  MemberRole,
  PlannedAttendanceDay,
  ProjectStatus,
  ProjectType,
  RiskSeverity,
  SeasonType,
} from "./common";
import type { SubsystemLayoutView, SubsystemLayoutZone } from "./recordsOrganization";

export interface MilestonePayload {
  title: string;
  type: MilestoneType;
  status: MilestoneStatus;
  startAt: string;
  endAt: string | null;
  description: string;
  projectIds: string[];
}

export interface MeetingPayload {
  title: string;
  meetingType: MeetingType;
  seasonId?: string;
  projectIds: string[];
  startAt: string;
  endAt: string | null;
  location: string;
  description: string;
}

export interface ReportPayload {
  reportType: "qa" | "practice" | "competition" | "review";
  projectId: string;
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
  status: "draft" | "submitted" | "reviewed";
  result: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
}

export type QaReportPayload = ReportPayload;
export type TestResultPayload = ReportPayload;

export interface WorkLogPayload {
  taskId: string;
  date: string;
  hours: number;
  participantIds: string[];
  notes: string;
  photoUrl: string;
}

export interface PurchaseItemPayload {
  taskId: string;
  kind: "cots-goods" | "manufacturing-service";
  title: string;
  partDefinitionId: string | null;
  materialId: string | null;
  quantity: number;
  quotes: Array<{ id: string; vendorId: string; reference: string | null; amount: { amount: number; currency: string | null } | null; url?: string; expiresAt?: string | null; quotedAt: string | null }>;
  selectedQuoteId: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedById: string | null;
  approvedAt: string | null;
  purchaseOrderNumber: string | null;
  orderStatus: "not-ordered" | "ordered" | "shipped" | "delivered" | "cancelled";
  finalCost: { amount: number; currency: string | null } | null;
  expectedDeliveryDate: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  orderedAt: string | null;
  deliveredAt: string | null;
}

export interface SeasonCreatePayload {
  name: string;
  type?: SeasonType;
  startDate?: string;
  endDate?: string;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectCreatePayload extends ProjectPayload {
  seasonId: string;
  projectType: ProjectType;
}

export interface MemberPayload {
  name: string;
  email: string;
  photoUrl: string;
  role: MemberRole;
  elevated: boolean;
  activeSeasonIds?: string[];
  plannedWeeklyAttendanceHours: number;
  plannedAttendanceDays: PlannedAttendanceDay[];
  plannedAttendanceNotes: string;
}

export interface MemberCreatePayload extends MemberPayload {
  seasonId: string;
}

export interface ResponsibleGroupPayload {
  seasonId: string;
  name: string;
  projectIds: string[];
  memberIds: string[];
  primaryMemberIds: string[];
  isArchived: boolean;
}

export interface MaterialPayload {
  name: string;
  category: MaterialCategory;
  unit: string;
  onHandQuantity: number;
  reorderPoint: number;
  location: string;
  preferredVendorId: string | null;
  notes: string;
  photoUrl?: string;
}

export interface ArtifactPayload {
  projectId: string;
  targetRefs: DomainReference[];
  kind: ArtifactKind;
  title: string;
  summary: string;
  status: ArtifactStatus;
  uri: string;
  updatedAt: string;
  photoUrl?: string;
}

export interface WorkstreamPayload {
  projectId: string;
  name: string;
  color: string;
  description: string;
  isArchived?: boolean;
}

export interface RiskPayload {
  projectId: string;
  title: string;
  detail: string;
  severity: RiskSeverity;
  category: "dependency" | "design" | "manufacturing" | "supply" | "schedule" | "qa" | "inventory" | "other";
  status: "open" | "in-progress" | "blocked" | "resolved";
  blocksWork: boolean;
  source: { kind: "manual" } | { kind: "task" | "task-dependency" | "qa-finding" | "test-finding" | "qa-request" | "test-result" | "report" | "event" | "milestone" | "manufacturing-details" | "part-instance" | "material"; id: string };
  relatedTargets: DomainReference[];
  mitigationTaskId: string | null;
  ownerGroupId: string | null;
  ownerMemberId: string | null;
  mitigationDueDate: string | null;
}

export interface PartDefinitionPayload {
  seasonId?: string;
  activeSeasonIds?: string[];
  name: string;
  partNumber: string;
  revision: string;
  iteration: number;
  isArchived?: boolean;
  isHardware: boolean;
  type: string;
  defaultAcquisitionMethod: AcquisitionMethod;
  materialId: string | null;
  description: string;
  photoUrl: string;
}

export interface SubsystemPayload {
  projectId: string;
  name: string;
  color: string;
  description: string;
  photoUrl: string;
  iteration: number;
  isArchived?: boolean;
  parentSubsystemId: string | null;
  responsibleEngineerId: string | null;
  mentorIds: string[];
  layoutX?: number | null;
  layoutY?: number | null;
  layoutZone?: SubsystemLayoutZone | null;
  layoutView?: SubsystemLayoutView | null;
  sortOrder?: number | null;
}

export interface MechanismPayload {
  subsystemId: string;
  name: string;
  description: string;
  googleSheetsUrl: string;
  photoUrl: string;
  iteration: number;
  isArchived?: boolean;
}

export interface PartInstancePayload {
  partDefinitionId: string;
  intendedSubsystemId: string | null;
  intendedMechanismId: string | null;
  location: PartInstanceLocation;
  photoUrl: string;
}
