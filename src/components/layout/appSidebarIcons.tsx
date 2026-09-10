import { createElement, type ReactNode } from "react";
import {
  Bot,
  Briefcase,
  Boxes,
  ChartNoAxesCombined,
  Cog,
  Dumbbell,
  Folder,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  Users,
  Video,
} from "lucide-react";

import {
  type NavigationSection,
} from "@/lib/workspaceNavigation";
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

const PROJECT_TYPE_ICON_COLORS: Record<Exclude<ProjectType, "robot">, string> = {
  operations: "#0f766e",
  outreach: "#d97706",
  other: "#475569",
};

type NamedProjectCategory =
  | "media"
  | "strategy"
  | "training"
  | "business"
  | "operations";

const PROJECT_CATEGORY_ICON_COLORS: Record<NamedProjectCategory, string> = {
  media: "#dc2626",
  strategy: "#2563eb",
  training: "#9333ea",
  business: "#b45309",
  operations: "#0f766e",
};

function getNamedProjectCategory(name: string): NamedProjectCategory | null {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("media")) {
    return "media";
  }

  if (normalizedName.includes("strategy")) {
    return "strategy";
  }

  if (normalizedName.includes("training") || normalizedName.includes("scouting")) {
    return "training";
  }

  if (normalizedName.includes("business")) {
    return "business";
  }

  if (normalizedName.includes("operations")) {
    return "operations";
  }

  return null;
}

function getProjectTypeIcon(projectType: ProjectType | null) {
  switch (projectType) {
    case "robot":
      return createElement(Bot, { size: 14, strokeWidth: 2 });
    case "operations":
      return createElement(Cog, { size: 14, strokeWidth: 2 });
    case "outreach":
      return createElement(Megaphone, { size: 14, strokeWidth: 2 });
    default:
      return createElement(Folder, { size: 14, strokeWidth: 2 });
  }
}

export function getProjectIcon(project: Pick<ProjectRecord, "name" | "projectType"> | null) {
  if (project) {
    const namedCategory = getNamedProjectCategory(project.name);
    if (namedCategory === "media") {
      return createElement(Video, { size: 14, strokeWidth: 2 });
    }

    if (namedCategory === "strategy") {
      return createElement(ChartNoAxesCombined, { size: 14, strokeWidth: 2 });
    }

    if (namedCategory === "training") {
      return createElement(Dumbbell, { size: 14, strokeWidth: 2 });
    }

    if (namedCategory === "business") {
      return createElement(Briefcase, { size: 14, strokeWidth: 2 });
    }

    if (namedCategory === "operations") {
      return createElement(Cog, { size: 14, strokeWidth: 2 });
    }
  }

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

  if (project.projectType === "robot") {
    return getRobotProjectIconColor(project.id);
  }

  const namedCategory = getNamedProjectCategory(project.name);
  if (namedCategory) {
    return PROJECT_CATEGORY_ICON_COLORS[namedCategory];
  }

  return PROJECT_TYPE_ICON_COLORS[project.projectType];
}

export const sectionIcons: Record<NavigationSection, ReactNode> = {
  home: createElement(LayoutDashboard, { size: 20 }), work: createElement(ListTodo, { size: 20 }),
  resources: createElement(Boxes, { size: 20 }), team: createElement(Users, { size: 20 }),
};
