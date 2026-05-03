import type {
  ArtifactRecord,
  AttendanceRecord,
  DesignIterationRecord,
  DisciplineRecord,
  MilestoneRecord,
  ManufacturingItemRecord,
  MaterialRecord,
  MemberRecord,
  MechanismRecord,
  PartDefinitionRecord,
  PartInstanceRecord,
  ProjectRecord,
  PurchaseItemRecord,
  QaFindingRecord,
  QaReportRecord,
  ReportFindingRecord,
  ReportRecord,
  RiskRecord,
  SeasonRecord,
  SubsystemRecord,
  TaskBlockerRecord,
  TaskDependencyRecord,
  TaskRecord,
  TestFindingRecord,
  TestResultRecord,
  WorkLogRecord,
  WorkstreamRecord,
} from "./records";

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
