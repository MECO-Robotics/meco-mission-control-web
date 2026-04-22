export type RoleFilter = "all" | "students" | "mentors" | "admins";

export interface PortalCard {
  title: string;
  topline: string;
  metric: string;
  description: string;
  roles: Exclude<RoleFilter, "all">[];
  items: string[];
}

export interface WorkflowLane {
  title: string;
  metric: string;
  summary: string;
  tags: string[];
}

export interface SubsystemCard {
  name: string;
  lead: string;
  mentor: string;
  progress: number;
}

export type MemberRole = "student" | "mentor" | "admin";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus =
  | "not-started"
  | "in-progress"
  | "waiting-for-qa"
  | "complete";

export interface MemberRecord {
  id: string;
  name: string;
  role: MemberRole;
}

export interface SubsystemRecord {
  id: string;
  name: string;
  responsibleEngineerId: string;
  mentorIds: string[];
  risks: string[];
}

export interface TaskRecord {
  id: string;
  title: string;
  summary: string;
  subsystemId: string;
  ownerId: string;
  mentorId: string;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependencyIds: string[];
  blockers: string[];
  linkedManufacturingIds: string[];
  linkedPurchaseIds: string[];
  estimatedHours: number;
  actualHours: number;
  requiresDocumentation: boolean;
  documentationLinked: boolean;
}

export interface BootstrapPayload {
  members: MemberRecord[];
  subsystems: SubsystemRecord[];
  tasks: TaskRecord[];
}

export interface MemberPayload {
  name: string;
  role: MemberRole;
}

export interface TaskPayload {
  title: string;
  summary: string;
  subsystemId: string;
  ownerId: string;
  mentorId: string;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  blockers: string[];
  dependencyIds: string[];
  linkedManufacturingIds: string[];
  linkedPurchaseIds: string[];
  requiresDocumentation: boolean;
  documentationLinked: boolean;
}
