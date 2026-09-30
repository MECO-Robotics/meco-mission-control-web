import type { ArtifactStatus } from "@/types/common";
import type { ArtifactRecord } from "@/types/recordsInventory";
import type { ResourceSortDirection } from "@/features/workspace/shared/resourceList/ResourceColumnHeader";

export type ArtifactSortField = "title" | "targets" | "status" | "uri" | "updated";

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

export function getUpdatedDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function summarizeUri(uri: string) {
  if (!uri.trim()) {
    return "No link";
  }

  try {
    const url = new URL(uri);
    return `${url.hostname}${url.pathname}`;
  } catch {
    return uri;
  }
}

export function sortArtifacts(
  artifacts: ArtifactRecord[],
  field: ArtifactSortField,
  direction: ResourceSortDirection,
) {
  const multiplier = direction === "ascending" ? 1 : -1;
  const getSortValue = (artifact: ArtifactRecord) => {
    switch (field) {
      case "title":
        return artifact.title;
      case "targets":
        return artifact.targetRefs.map((target) => `${target.kind}:${target.id}`).join(" ");
      case "status":
        return artifact.status;
      case "uri":
        return artifact.uri;
      case "updated":
        return artifact.updatedAt;
    }
  };

  return [...artifacts].sort((left, right) => {
    return multiplier * getSortValue(left).localeCompare(getSortValue(right), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}
