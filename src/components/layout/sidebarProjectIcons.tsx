import { createElement } from "react";
import {
  Bot,
  ChartNoAxesCombined,
  Cog,
  Dumbbell,
  Folder,
  Megaphone,
  Video,
} from "lucide-react";

import type { ProjectType } from "@/types/common";
import type { ProjectRecord } from "@/types/recordsOrganization";

const ROBOT_PROJECT_ICON_COLORS = [
  "#2563eb",
  "#0f766e",
  "#7c3aed",
  "#b45309",
  "#be185d",
  "#0369a1",
];

const PROJECT_TYPE_ICON_COLORS: Record<ProjectType, string> = {
  robot: "#2563eb",
  media: "#dc2626",
  outreach: "#d97706",
  operations: "#0f766e",
  strategy: "#2563eb",
  training: "#9333ea",
};

function getProjectTypeIcon(projectType: ProjectType | null) {
  switch (projectType) {
    case "robot":
      return createElement(Bot, { size: 14, strokeWidth: 2 });
    case "operations":
      return createElement(Cog, { size: 14, strokeWidth: 2 });
    case "outreach":
      return createElement(Megaphone, { size: 14, strokeWidth: 2 });
    case "media":
      return createElement(Video, { size: 14, strokeWidth: 2 });
    case "strategy":
      return createElement(ChartNoAxesCombined, { size: 14, strokeWidth: 2 });
    case "training":
      return createElement(Dumbbell, { size: 14, strokeWidth: 2 });
    default:
      return createElement(Folder, { size: 14, strokeWidth: 2 });
  }
}

export function getProjectIcon(project: Pick<ProjectRecord, "name" | "projectType"> | null) {
  return getProjectTypeIcon(project?.projectType ?? null);
}

function getRobotProjectIconColor(projectId: string) {
  let hash = 0;
  for (let index = 0; index < projectId.length; index += 1) {
    hash = (hash * 31 + projectId.charCodeAt(index)) | 0;
  }

  return ROBOT_PROJECT_ICON_COLORS[Math.abs(hash) % ROBOT_PROJECT_ICON_COLORS.length];
}

export function getProjectIconColor(
  project: Pick<ProjectRecord, "id" | "name" | "projectType"> | null,
) {
  if (!project) {
    return "var(--official-blue)";
  }

  return project.projectType === "robot"
    ? getRobotProjectIconColor(project.id)
    : PROJECT_TYPE_ICON_COLORS[project.projectType];
}
