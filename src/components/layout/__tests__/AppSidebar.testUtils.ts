/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/branding", () => ({
  MECO_PROFILE_AVATAR_SIZE: 32,
}));

import { AppSidebar } from "@/components/layout/AppSidebar";
import type { SessionUser } from "@/lib/auth/types";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import type { NavigationItem, NavigationSubItemId, ViewTab } from "@/lib/workspaceNavigation";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

export function renderSidebar(
  _items: NavigationItem[],
  activeTab: ViewTab = "worklogs",
  options?: {
    favoriteViewIds?: NavigationSubItemId[];
    canSignIn?: boolean;
    inventoryView?: "materials" | "parts" | "part-mappings" | "purchases";
    isCollapsed?: boolean;
    isMyViewActive?: boolean;
    isNotificationQueueOpen?: boolean;
    myViewMemberName?: string | null;
    notificationCount?: number;
    projects?: ProjectRecord[];
    riskManagementView?: "kanban" | "metrics";
    selectedProjectId?: string | null;
    selectedSeasonId?: string | null;
    seasons?: SeasonRecord[];
    sessionUser?: SessionUser | null;
    taskView?: "calendar" | "timeline" | "robot-map" | "queue" | "milestones";
  },
) {
  const sidebarProps: React.ComponentProps<typeof AppSidebar> = {
      activeTab,
      favoriteViewIds: options?.favoriteViewIds ?? [],
      canSignIn: options?.canSignIn ?? (options?.sessionUser ?? null) === null,
      handleSignOut: jest.fn(),
      inventoryView: options?.inventoryView ?? "materials",
      isDarkMode: false,
      isMyViewActive: options?.isMyViewActive ?? false,
      isCollapsed: options?.isCollapsed ?? false,
      isNotificationQueueOpen: options?.isNotificationQueueOpen ?? false,
      myViewMemberName: options?.myViewMemberName === undefined ? "Ava Chen" : options.myViewMemberName,
      notificationCount: options?.notificationCount ?? 0,
      onCreateSeason: jest.fn(),
      onCreateMilestone: jest.fn(),
      onCreatePart: jest.fn(),
      onCreateQaReport: jest.fn(),
      onCreateRobot: jest.fn(),
      onCreateTask: jest.fn(),
      onEditSelectedRobot: jest.fn(),
      onRefreshWorkspace: jest.fn(),
      onSignIn: jest.fn(),
      onSelectSeason: jest.fn(),
      onSelectProject: jest.fn(),
      onSelectTarget: jest.fn(),
      onToggleMyView: jest.fn(),
      onToggleNotificationQueue: jest.fn(),
      projects: options?.projects ?? [],
      rosterView: "directory",
      riskManagementView: options?.riskManagementView ?? "kanban",
      selectedProjectId: options?.selectedProjectId ?? null,
      selectedSeasonId: options?.selectedSeasonId ?? "season-1",
      seasons: options?.seasons ?? [
        {
          id: "season-1",
          name: "2026 Season",
          type: "season",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        },
      ],
      sessionUser: options?.sessionUser ?? null,
      taskView: options?.taskView ?? "queue",
      toggleDarkMode: jest.fn(),
      toggleSidebar: jest.fn(),
      worklogsView: "logs",
    };

  return renderToStaticMarkup(React.createElement(AppSidebar, sidebarProps));
}

export const signedInUser: SessionUser = {
  accountId: "account-1",
  authProvider: "google",
  email: "ava.chen@example.com",
  hostedDomain: "meco-robotics.com",
  name: "Ava Chen",
  picture: null,
};
