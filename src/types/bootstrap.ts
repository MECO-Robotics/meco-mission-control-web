import type { ArtifactRecord, MaterialRecord, PartDefinitionRecord, PartInstanceRecord, PurchaseItemRecord, VendorRecord } from "./recordsInventory";
import type {
  AuditActionRecord,
  AttendanceRecord,
  EscalationRecord,
  MeetingRecord,
  MilestoneRecord,
  MilestoneRequirementRecord,
  QaRequestRecord,
  TaskDependencyRecord,
  TaskRecord,
  WorkLogRecord,
  EventRecord,
} from "./recordsExecution";
import type { DesignIterationRecord, QaFindingRecord, ReportRecord, RiskRecord, TestFindingRecord, TestResultRecord } from "./recordsReporting";
import type { MechanismRecord, MemberRecord, ProjectRecord, ResponsibleGroupRecord, SeasonRecord, SubsystemRecord, WorkstreamRecord, WorkTypeRecord } from "./recordsOrganization";

export interface BootstrapPayload {
  seasons: SeasonRecord[];
  projects: ProjectRecord[];
  workTypes: WorkTypeRecord[];
  responsibleGroups: ResponsibleGroupRecord[];
  workstreams: WorkstreamRecord[];
  vendors: VendorRecord[];
  members: MemberRecord[];
  subsystems: SubsystemRecord[];
  mechanisms: MechanismRecord[];
  materials: MaterialRecord[];
  artifacts: ArtifactRecord[];
  partDefinitions: PartDefinitionRecord[];
  partInstances: PartInstanceRecord[];
  milestones: MilestoneRecord[];
  taskDependencies: TaskDependencyRecord[];
  reports: ReportRecord[];
  qaFindings: QaFindingRecord[];
  testResults: TestResultRecord[];
  testFindings: TestFindingRecord[];
  qaRequests: QaRequestRecord[];
  designIterations?: DesignIterationRecord[];
  risks: RiskRecord[];
  tasks: TaskRecord[];
  workLogs: WorkLogRecord[];
  meetings: MeetingRecord[];
  events: EventRecord[];
  attendanceRecords: AttendanceRecord[];
  purchaseItems: PurchaseItemRecord[];
  manufacturingProcesses: import("./recordsExecution").ManufacturingProcessRecord[];
  milestoneRequirements: MilestoneRequirementRecord[];
  escalations?: EscalationRecord[];
  actions?: AuditActionRecord[];
}

export type PlatformBootstrapPayload = BootstrapPayload;
