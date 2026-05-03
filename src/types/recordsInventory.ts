import type {
  ArtifactKind,
  ArtifactStatus,
  ManufacturingProcess,
  ManufacturingStatus,
  MaterialCategory,
  PartInstanceStatus,
  PurchaseStatus,
} from "./common";

export interface MaterialRecord {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  onHandQuantity: number;
  reorderPoint: number;
  location: string;
  vendor: string;
  notes: string;
}

export interface ArtifactRecord {
  id: string;
  projectId: string;
  workstreamId: string | null;
  kind: ArtifactKind;
  title: string;
  summary: string;
  status: ArtifactStatus;
  link: string;
  isArchived?: boolean;
  updatedAt: string;
}

export interface PartDefinitionRecord {
  id: string;
  seasonId: string;
  activeSeasonIds?: string[];
  name: string;
  partNumber: string;
  revision: string;
  iteration: number;
  isArchived?: boolean;
  isHardware?: boolean;
  type: string;
  source: string;
  materialId: string | null;
  description: string;
  photoUrl?: string;
}

export interface PartInstanceRecord {
  id: string;
  subsystemId: string;
  mechanismId: string | null;
  partDefinitionId: string;
  name: string;
  quantity: number;
  trackIndividually: boolean;
  status: PartInstanceStatus;
  photoUrl?: string;
}

export interface ManufacturingItemRecord {
  id: string;
  title: string;
  subsystemId: string;
  requestedById: string | null;
  process: ManufacturingProcess;
  dueDate: string;
  material: string;
  materialId: string | null;
  partDefinitionId: string | null;
  partInstanceId: string | null;
  partInstanceIds: string[];
  quantity: number;
  status: ManufacturingStatus;
  mentorReviewed: boolean;
  inHouse: boolean;
  batchLabel?: string;
}

export interface PurchaseItemRecord {
  id: string;
  title: string;
  subsystemId: string;
  requestedById: string | null;
  partDefinitionId: string | null;
  quantity: number;
  vendor: string;
  linkLabel: string;
  estimatedCost: number;
  finalCost?: number;
  approvedByMentor: boolean;
  status: PurchaseStatus;
}
