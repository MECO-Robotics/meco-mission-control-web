import type { ArtifactRecord, ManufacturingItemRecord, MaterialRecord, PartDefinitionRecord, PartInstanceRecord, PurchaseItemRecord } from "./recordsInventory";
import type {
  AuditActionRecord,
  AttendanceRecord,
  EscalationRecord,
  MeetingRecord,
  MilestoneRecord,
  MilestoneRequirementRecord,
  QaReviewRecord,
  QaRequestRecord,
  TaskBlockerRecord,
  TaskDependencyRecord,
  TaskRecord,
  WorkItemRecord,
  WorkLogRecord,
} from "./recordsExecution";
import type { DesignIterationRecord, ReportFindingRecord, ReportRecord, RiskRecord } from "./recordsReporting";
import type { DisciplineRecord, MechanismRecord, MemberRecord, ProjectRecord, SeasonRecord, SubsystemRecord, WorkstreamRecord } from "./recordsOrganization";

export interface BootstrapPayload {
  seasons: SeasonRecord[];
  projects: ProjectRecord[];
  workstreams: WorkstreamRecord[];
  members: MemberRecord[];
  subsystems: SubsystemRecord[];
  disciplines: DisciplineRecord[];
  mechanisms: MechanismRecord[];
  materials: MaterialRecord[];
  artifacts: ArtifactRecord[];
  partDefinitions: PartDefinitionRecord[];
  partInstances: PartInstanceRecord[];
  milestones: MilestoneRecord[];
  milestoneRequirements?: MilestoneRequirementRecord[];
  taskDependencies?: TaskDependencyRecord[];
  taskBlockers?: TaskBlockerRecord[];
  reports: ReportRecord[];
  reportFindings: ReportFindingRecord[];
  qaRequests: QaRequestRecord[];
  designIterations?: DesignIterationRecord[];
  risks: RiskRecord[];
  tasks: TaskRecord[];
  workLogs: WorkLogRecord[];
  workItems?: WorkItemRecord[];
  meetings?: MeetingRecord[];
  attendanceRecords?: AttendanceRecord[];
  purchaseItems: PurchaseItemRecord[];
  manufacturingItems: ManufacturingItemRecord[];
  qaReviews?: QaReviewRecord[];
  escalations?: EscalationRecord[];
  actions?: AuditActionRecord[];
}

export type PlatformBootstrapPayload = BootstrapPayload;
