import { createElement, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Briefcase,
  Boxes,
  CalendarCheck,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  Cog,
  Columns3,
  Dumbbell,
  FileText,
  Flag,
  Folder,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  Package,
  ShoppingCart,
  Users,
  Video,
  Wrench,
} from "lucide-react";

import {
  type NavigationSection,
  type NavigationSubItemId,
} from "@/lib/workspaceNavigation";
import type { ProjectType } from "@/types/common";
import type { ProjectRecord } from "@/types/recordsOrganization";
import { IconParts, IconReports, IconRoster } from "@/components/shared/Icons";

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
  dashboard: createElement(LayoutDashboard, { size: 14, strokeWidth: 2 }),
  readiness: createElement(ClipboardCheck, { size: 14, strokeWidth: 2 }),
  config: createElement(Cog, { size: 14, strokeWidth: 2 }),
  tasks: createElement(ListTodo, { size: 14, strokeWidth: 2 }),
  inventory: createElement(IconParts),
  roster: createElement(IconRoster),
  reports: createElement(IconReports),
};

export const subItemIcons: Record<NavigationSubItemId, ReactNode> = {
  "dashboard-calendar": createElement(CalendarDays, { size: 14, strokeWidth: 2 }),
  "dashboard-activity": createElement(FileText, { size: 14, strokeWidth: 2 }),
  "dashboard-metrics": createElement(BarChart3, { size: 14, strokeWidth: 2 }),
  "readiness-attention": createElement(AlertTriangle, { size: 14, strokeWidth: 2 }),
  "readiness-milestones": createElement(Flag, { size: 14, strokeWidth: 2 }),
  "readiness-subsystems": createElement(Cog, { size: 14, strokeWidth: 2 }),
  "readiness-risks": createElement(AlertTriangle, { size: 14, strokeWidth: 2 }),
  "config-robot-model": createElement(Bot, { size: 14, strokeWidth: 2 }),
  "config-directory": createElement(Users, { size: 14, strokeWidth: 2 }),
  "tasks-timeline": createElement(CalendarDays, { size: 14, strokeWidth: 2 }),
  "tasks-board": createElement(Columns3, { size: 14, strokeWidth: 2 }),
  "tasks-manufacturing": createElement(Wrench, { size: 14, strokeWidth: 2 }),
  "inventory-materials": createElement(Package, { size: 14, strokeWidth: 2 }),
  "inventory-parts": createElement(Boxes, { size: 14, strokeWidth: 2 }),
  "inventory-purchases": createElement(ShoppingCart, { size: 14, strokeWidth: 2 }),
  "roster-workload": createElement(BarChart3, { size: 14, strokeWidth: 2 }),
  "roster-attendance": createElement(CalendarCheck, { size: 14, strokeWidth: 2 }),
  "reports-work-logs": createElement(FileText, { size: 14, strokeWidth: 2 }),
  "reports-qa-forms": createElement(ClipboardCheck, { size: 14, strokeWidth: 2 }),
  "reports-milestone-results": createElement(Flag, { size: 14, strokeWidth: 2 }),
};
