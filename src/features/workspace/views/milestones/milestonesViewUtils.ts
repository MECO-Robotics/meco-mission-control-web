import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import { filterSelectionIncludes, filterSelectionIntersects, filterSelectionMatchesTaskPeople } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getMilestoneTasksForState } from "@/features/workspace/shared/milestones/milestoneTaskState";
import { getMilestoneProjectIds } from "@/features/workspace/shared/events/eventProjectUtils";
import { getMilestoneTypeStyle } from "@/features/workspace/shared/events/eventStyles";

export type MilestoneSortField = "startDateTime" | "title" | "type";
export const MILESTONE_ZOOM_MIN = 0.6;
export const MILESTONE_ZOOM_MAX = 1.6;
export const MILESTONE_ZOOM_STEP = 0.1;

export function clampMilestoneZoom(value: number) {
  const normalizedValue = Math.round(value * 10) / 10;
  return Math.min(MILESTONE_ZOOM_MAX, Math.max(MILESTONE_ZOOM_MIN, normalizedValue));
}

export function formatMilestoneZoomLabel(zoom: number) {
  return `${Math.round(zoom * 100)}%`;
}

export function formatMilestoneDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSameLocalCalendarDay(start: Date, end: Date) {
  return (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  );
}

export function formatMilestoneEndDateTime(startDateTime: string, endDateTime: string | null) {
  if (!endDateTime) {
    return null;
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (isSameLocalCalendarDay(start, end)) {
    return end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return formatMilestoneDateTime(endDateTime);
}

export function buildMilestoneProjectLabels(
  milestones: BootstrapPayload["milestones"],
  projectsById: Record<string, BootstrapPayload["projects"][number]>,
  scopedProjectIds: string[],
) {
  const labels: Record<string, string> = {};

  milestones.forEach((milestone) => {
    const relatedProjectIds = getMilestoneProjectIds(milestone);

    if (
      relatedProjectIds.length === 0 ||
      (relatedProjectIds.length === scopedProjectIds.length &&
        relatedProjectIds.every((projectId) => scopedProjectIds.includes(projectId)))
    ) {
      labels[milestone.id] = "All projects";
    } else if (relatedProjectIds.length === 1) {
      labels[milestone.id] = projectsById[relatedProjectIds[0]]?.name ?? "Unknown project";
    } else {
      const firstProjectName = projectsById[relatedProjectIds[0]]?.name ?? "Multiple projects";
      labels[milestone.id] = `${firstProjectName} +${relatedProjectIds.length - 1}`;
    }
  });

  return labels;
}

export function filterAndSortMilestones({
  activePersonFilter,
  bootstrap,
  projectsById,
  milestones,
  isAllProjectsView,
  projectFilter,
  searchFilter,
  sortField,
  sortOrder,
  typeFilter,
}: {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  milestones: BootstrapPayload["milestones"];
  isAllProjectsView: boolean;
  projectFilter: string[];
  searchFilter: string;
  sortField: MilestoneSortField;
  sortOrder: "asc" | "desc";
  typeFilter: string[];
}) {
  let result = [...milestones];

  if (activePersonFilter.length > 0) {
    const matchingMilestoneIds = new Set(
      milestones.flatMap((milestone) =>
        getMilestoneTasksForState(milestone, bootstrap).some((task) =>
          filterSelectionMatchesTaskPeople(activePersonFilter, task),
        )
          ? [milestone.id]
          : [],
      ),
    );
    result = result.filter((milestone) => matchingMilestoneIds.has(milestone.id));
  }

  if (isAllProjectsView && projectFilter.length > 0) {
    result = result.filter((milestone) => {
      const milestoneProjectIds = getMilestoneProjectIds(milestone);

      if (milestoneProjectIds.length === 0) {
        return true;
      }

      return filterSelectionIntersects(projectFilter, milestoneProjectIds);
    });
  }

  if (typeFilter.length > 0) {
    result = result.filter((milestone) => filterSelectionIncludes(typeFilter, milestone.type));
  }

  if (searchFilter.trim() !== "") {
    const search = searchFilter.toLowerCase();

    result = result.filter((milestone) => {
      return (
        milestone.title.toLowerCase().includes(search) ||
        milestone.description.toLowerCase().includes(search) ||
        getMilestoneProjectIds(milestone)
          .map((projectId) => projectsById[projectId]?.name ?? "")
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    });
  }

  const readSortValue = (milestone: MilestoneRecord): string => {
    if (sortField === "title") {
      return milestone.title.toLowerCase();
    }

    if (sortField === "type") {
      return getMilestoneTypeStyle(milestone.type).label;
    }

    return milestone.startDateTime;
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
