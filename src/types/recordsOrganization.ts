import type {
  DisciplineCode,
  MemberRole,
  PlannedAttendanceDay,
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
  seasonId: string;
  activeSeasonIds?: string[];
  plannedWeeklyAttendanceHours?: number;
  plannedAttendanceDays?: PlannedAttendanceDay[];
  plannedAttendanceNotes?: string;
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

export type CadSourceKind = "manual" | "step-import" | "onshape-sync";

export interface CadSourceMetadata {
  cadSource?: CadSourceKind | "STEP_UPLOAD" | "ONSHAPE_API" | "ONSHAPE_BOM_CSV" | "MANUAL_BOM_CSV" | string | null;
  cadSourceKind?: CadSourceKind | string | null;
  cadImportSource?: "STEP_UPLOAD" | "ONSHAPE_API" | "ONSHAPE_BOM_CSV" | "MANUAL_BOM_CSV" | string | null;
  cadSourceLabel?: string | null;
  cadSourceDetail?: string | null;
  cadSourceUpdatedAt?: string | null;
  cadImportedAt?: string | null;
  cadEditedAfterImport?: boolean | null;
  editedAfterImport?: boolean | null;
}

export interface SubsystemRecord extends CadSourceMetadata {
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

export interface MechanismRecord extends CadSourceMetadata {
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
  teamId: string;
  name: string;
  type: SeasonType;
  startDate: string;
  endDate: string;
}

export interface ProjectRecord {
  id: string;
  seasonId: string;
  name: "Robot" | "Media" | "Outreach" | "Operations" | "Strategy" | "Training";
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

export interface WorkTypeRecord {
  id: string;
  projectType: ProjectType;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ResponsibleGroupRecord {
  id: string;
  seasonId: string;
  name: string;
  projectIds: string[];
  workTypeIds: string[];
  memberIds: string[];
  primaryMemberIds: string[];
  isArchived: boolean;
}
