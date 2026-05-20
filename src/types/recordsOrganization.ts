import type {
  DisciplineCode,
  MemberRole,
  ProjectStatus,
  ProjectType,
  SeasonType,
} from "./common";

export interface MemberRecord {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: MemberRole;
  elevated: boolean;
  disciplineId?: string | null;
  seasonId: string;
  activeSeasonIds?: string[];
}

export type SubsystemLayoutZone =
  | "front"
  | "rear"
  | "left"
  | "right"
  | "center"
  | "top"
  | "unplaced";

export type SubsystemLayoutView = "top";

export interface SubsystemRecord {
  id: string;
  projectId: string;
  name: string;
  color?: string;
  description: string;
  photoUrl?: string;
  iteration: number;
  isArchived?: boolean;
  isCore: boolean;
  parentSubsystemId: string | null;
  responsibleEngineerId: string | null;
  mentorIds: string[];
  risks: string[];
  layoutX?: number | null;
  layoutY?: number | null;
  layoutZone?: SubsystemLayoutZone | null;
  layoutView?: SubsystemLayoutView | null;
  sortOrder?: number | null;
}

export interface DisciplineRecord {
  id: string;
  code: DisciplineCode;
  name: string;
}

export interface MechanismRecord {
  id: string;
  subsystemId: string;
  name: string;
  description: string;
  googleSheetsUrl?: string;
  photoUrl?: string;
  iteration: number;
  isArchived?: boolean;
}

export interface SeasonRecord {
  id: string;
  name: string;
  type: SeasonType;
  startDate: string;
  endDate: string;
}

export interface ProjectRecord {
  id: string;
  seasonId: string;
  name: string;
  projectType: ProjectType;
  description: string;
  status: ProjectStatus;
}

export interface WorkstreamRecord {
  id: string;
  projectId: string;
  name: string;
  color?: string;
  description: string;
  isArchived?: boolean;
}
