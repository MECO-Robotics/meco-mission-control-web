import type { ArtifactRecord, ManufacturingItemRecord, MaterialRecord, PartDefinitionRecord, PartInstanceRecord, PurchaseItemRecord } from "./recordsInventory";
import type { AttendanceRecord, MilestoneRecord, MilestoneRequirementRecord, TaskBlockerRecord, TaskDependencyRecord, TaskRecord, WorkLogRecord } from "./recordsExecution";
import type { DesignIterationRecord, QaFindingRecord, QaReportRecord, ReportFindingRecord, ReportRecord, RiskRecord, TestFindingRecord, TestResultRecord } from "./recordsReporting";
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
  qaReports: QaReportRecord[];
  testResults: TestResultRecord[];
  qaFindings: QaFindingRecord[];
  testFindings: TestFindingRecord[];
  designIterations: DesignIterationRecord[];
  risks: RiskRecord[];
  tasks: TaskRecord[];
  workLogs: WorkLogRecord[];
  attendanceRecords?: AttendanceRecord[];
  purchaseItems: PurchaseItemRecord[];
  manufacturingItems: ManufacturingItemRecord[];
}

export type PlatformBootstrapPayload = BootstrapPayload;
