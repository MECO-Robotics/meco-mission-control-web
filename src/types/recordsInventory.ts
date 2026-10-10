import type {
  AcquisitionMethod,
  ArtifactKind,
  ArtifactStatus,
  DomainReference,
  MaterialCategory,
  PartInstanceLocation,
  PurchaseApprovalStatus,
  PurchaseKind,
  PurchaseOrderStatus,
} from "./common";
import type { CadSourceMetadata } from "./recordsOrganization";

export interface MaterialRecord {
  id: string;
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

export interface ArtifactRecord {
  id: string;
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

export interface PartDefinitionRecord extends CadSourceMetadata {
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
  defaultAcquisitionMethod: AcquisitionMethod;
  materialId: string | null;
  description: string;
  photoUrl?: string;
}

export interface PartInstanceRecord extends CadSourceMetadata {
  id: string;
  partDefinitionId: string;
  intendedSubsystemId: string | null;
  intendedMechanismId: string | null;
  location: PartInstanceLocation;
  readinessStatus?: "not-ready" | "blocked" | "qa" | "ready";
  photoUrl?: string;
}

export interface PurchaseQuoteRecord {
  id: string;
  vendorId: string;
  reference: string | null;
  amount: { amount: number; currency: string | null } | null;
  url?: string;
  expiresAt?: string | null;
  quotedAt: string | null;
}

export interface PurchaseItemRecord {
  id: string;
  taskId: string;
  kind: PurchaseKind;
  partDefinitionId: string | null;
  materialId: string | null;
  title: string;
  quantity: number;
  quotes: PurchaseQuoteRecord[];
  selectedQuoteId: string | null;
  approvalStatus: PurchaseApprovalStatus;
  approvedById: string | null;
  approvedAt: string | null;
  purchaseOrderNumber: string | null;
  orderStatus: PurchaseOrderStatus;
  finalCost: { amount: number; currency: string | null } | null;
  expectedDeliveryDate: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  orderedAt: string | null;
  deliveredAt: string | null;
}

export interface VendorRecord {
  id: string;
  name: string;
  website: string | null;
  isArchived: boolean;
}
