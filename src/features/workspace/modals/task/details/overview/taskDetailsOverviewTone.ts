import { getWorkspaceFilterToneClassName } from "@/features/workspace/shared/filters/workspaceFilterTone";

export const getStableToneClassName = getWorkspaceFilterToneClassName;

export function getPriorityToneClassName(priority: string | undefined) {
  if (priority === "critical") {
    return "filter-tone-danger";
  }

  if (priority === "high") {
    return "filter-tone-warning";
  }

  if (priority === "low") {
    return "filter-tone-success";
  }

  return "filter-tone-neutral";
}
