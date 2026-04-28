import type { BootstrapPayload, EventRecord } from "@/types";
import { filterSelectionIncludes, filterSelectionIntersects } from "@/features/workspace/shared";
import { getEventProjectIds } from "@/features/workspace/shared/eventProjectUtils";
import { EVENT_TYPE_STYLES } from "@/features/workspace/shared/eventStyles";

export type MilestoneSortField = "startDateTime" | "title" | "type";

export function formatMilestoneDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildMilestoneProjectLabels(
  events: BootstrapPayload["events"],
  projectsById: Record<string, BootstrapPayload["projects"][number]>,
  scopedProjectIds: string[],
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
) {
  const labels: Record<string, string> = {};

  events.forEach((event) => {
    const relatedProjectIds = getEventProjectIds(event, subsystemsById);

    if (
      relatedProjectIds.length === 0 ||
      (relatedProjectIds.length === scopedProjectIds.length &&
        relatedProjectIds.every((projectId) => scopedProjectIds.includes(projectId)))
    ) {
      labels[event.id] = "All projects";
    } else if (relatedProjectIds.length === 1) {
      labels[event.id] = projectsById[relatedProjectIds[0]]?.name ?? "Unknown project";
    } else {
      const firstProjectName = projectsById[relatedProjectIds[0]]?.name ?? "Multiple projects";
      labels[event.id] = `${firstProjectName} +${relatedProjectIds.length - 1}`;
    }
  });

  return labels;
}

export function filterAndSortMilestones({
  events,
  isAllProjectsView,
  projectFilter,
  searchFilter,
  sortField,
  sortOrder,
  subsystemsById,
  typeFilter,
}: {
  events: BootstrapPayload["events"];
  isAllProjectsView: boolean;
  projectFilter: string[];
  searchFilter: string;
  sortField: MilestoneSortField;
  sortOrder: "asc" | "desc";
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  typeFilter: string[];
}) {
  let result = [...events];

  if (isAllProjectsView && projectFilter.length > 0) {
    result = result.filter((event) => {
      const eventProjectIds = getEventProjectIds(event, subsystemsById);

      if (eventProjectIds.length === 0) {
        return true;
      }

      return filterSelectionIntersects(projectFilter, eventProjectIds);
    });
  }

  if (typeFilter.length > 0) {
    result = result.filter((event) => filterSelectionIncludes(typeFilter, event.type));
  }

  if (searchFilter.trim() !== "") {
    const search = searchFilter.toLowerCase();

    result = result.filter((event) => {
      const relatedSubsystemNames = event.relatedSubsystemIds
        .map((subsystemId) => subsystemsById[subsystemId]?.name ?? "")
        .join(" ")
        .toLowerCase();

      return (
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        relatedSubsystemNames.includes(search)
      );
    });
  }

  const readSortValue = (event: EventRecord): string => {
    if (sortField === "title") {
      return event.title.toLowerCase();
    }

    if (sortField === "type") {
      return EVENT_TYPE_STYLES[event.type].label;
    }

    return event.startDateTime;
  };

  return result.sort((left, right) => {
    const leftValue = readSortValue(left);
    const rightValue = readSortValue(right);

    if (leftValue < rightValue) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (leftValue > rightValue) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });
}
