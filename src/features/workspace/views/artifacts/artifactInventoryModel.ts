import type { ArtifactStatus } from "@/types/common";
import type { ArtifactRecord } from "@/types/recordsInventory";
import type { ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";

export type ArtifactSortField = "title" | "workstream" | "status" | "link" | "updated";

export const ARTIFACT_GRID_TEMPLATE = "minmax(240px, 2fr) 1.1fr 0.9fr 1fr 0.8fr";

export const ARTIFACT_STATUS_OPTIONS: Array<{ id: ArtifactStatus; name: string }> = [
  { id: "draft", name: "Draft" },
  { id: "in-review", name: "In review" },
  { id: "published", name: "Published" },
];

export const ARTIFACT_STATUS_DISPLAY: Record<
  ArtifactStatus,
  { label: string; statusValue: string }
> = {
  draft: { label: "Draft", statusValue: "not-started" },
  "in-review": { label: "In review", statusValue: "waiting-for-qa" },
  published: { label: "Published", statusValue: "complete" },
};

export function formatUpdatedAt(value: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString();
}

export function summarizeLink(link: string) {
  if (!link.trim()) {
    return "No link";
  }

  try {
    const url = new URL(link);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return link;
  }
}

export function sortArtifacts(artifacts: ArtifactRecord[], field: ArtifactSortField, direction: ResourceSortDirection) {
  const multiplier = direction === "ascending" ? 1 : -1;
  return [...artifacts].sort((left, right) => {
    const leftValue = field === "title" ? left.title : field === "workstream" ? left.workstreamId ?? "" : field === "status" ? left.status : field === "link" ? left.link : left.updatedAt;
    const rightValue = field === "title" ? right.title : field === "workstream" ? right.workstreamId ?? "" : field === "status" ? right.status : field === "link" ? right.link : right.updatedAt;
    return multiplier * leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
  });
}
