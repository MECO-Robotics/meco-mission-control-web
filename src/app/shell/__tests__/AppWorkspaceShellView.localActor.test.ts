/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppWorkspaceShellView } from "../AppWorkspaceShellView";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import type { BootstrapPayload } from "@/types/bootstrap";

const mockRetestActors: Array<{ canReview: boolean; localActorMemberId: string | null }> = [];

jest.mock("../useWorkspaceShellNavigation", () => ({
  useWorkspaceShellNavigation: () => ({
    activeSubItemId: "worklogs",
    activeViewLabel: "Work logs",
    handleCreateMilestone: jest.fn(),
    handleOpenProfileEditor: jest.fn(),
    handleSelectNavigationTarget: jest.fn(),
    handleSelectProject: jest.fn(),
    handleSelectSeason: jest.fn(),
    localMode: null,
  }),
}));

jest.mock("../workspaceShell", () => {
  const { WorkspaceContent } = jest.requireActual("@/features/workspace/WorkspaceContent") as typeof import("@/features/workspace/WorkspaceContent");
  return {
    AppSidebar: () => null,
    AppTopbar: () => null,
    SidebarOverlay: () => null,
    WorkspaceModalHost: () => null,
    WorkspaceShellLoading: () => null,
    WorkspaceContent,
  };
});

jest.mock("@/features/workspace/WorkspaceStatusToast", () => ({ WorkspaceToastStack: () => null }));
jest.mock("@/features/workspace/components/overview/WorkspaceOverviewSections", () => ({ WorkspaceHomeSection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceRisksSection", () => ({ WorkspaceRisksSection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceDocumentsSection", () => ({ WorkspaceDocumentsSection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceTaskSection", () => ({ WorkspaceTaskSection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceInventorySection", () => ({ WorkspaceInventorySection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceCadSection", () => ({ WorkspaceCadSection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceSubsystemsSection", () => ({ WorkspaceSubsystemsSection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceRosterSection", () => ({ WorkspaceRosterSection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceTeamsSection", () => ({ WorkspaceTeamsSection: () => null }));
jest.mock("@/features/workspace/components/sections/WorkspaceHelpSection", () => ({ WorkspaceHelpSection: () => null }));

jest.mock("@/features/workspace/views/workLogs/FindingRetestAction", () => ({
  FindingRetestAction: (props: { canReview: boolean; localActorMemberId?: string | null }) => {
    mockRetestActors.push({ canReview: props.canReview, localActorMemberId: props.localActorMemberId ?? null });
    return null;
  },
}));

function renderForAccount(email: string, role: "mentor" | "student", signedInMemberId: string | null) {
  const mentorA = { id: "mentor-a", name: "Mentor A", email: "mentor-a@meco.test", role: "mentor" as const, elevated: true, seasonId: "season-2026" };
  const mentorB = { id: "mentor-b", name: "Mentor B", email: "mentor-b@meco.test", role: "mentor" as const, elevated: true, seasonId: "season-2026" };
  const report: BootstrapPayload["reports"][number] = {
    id: "qa-report", reportType: "qa", projectId: "project-a", targetRefs: [], createdByMemberId: null,
    participantIds: [mentorA.id], mentorId: null, requestedById: null, summary: "Drive check", notes: "",
    status: "reviewed", result: "pass", createdAt: "2026-10-15T00:00:00.000Z", reviewedAt: "2026-10-15T00:00:00.000Z",
  };
  const finding: BootstrapPayload["qaFindings"][number] = {
    id: "finding-1", reportId: report.id, projectId: "project-a", targetRefs: [], title: "Loose fastener", detail: "Recheck torque.",
    severity: "medium", status: "open", createdAt: report.createdAt, updatedAt: report.createdAt,
  };
  const bootstrap = createBootstrap({ members: [mentorA, mentorB], reports: [report], qaFindings: [finding] });
  const model = {
    bootstrap,
    scopedBootstrap: bootstrap,
    sessionUser: { accountId: `account:${email}`, email, role },
    signedInMember: signedInMemberId ? bootstrap.members.find((member) => member.id === signedInMemberId) : null,
    isPublicDemoSession: false,
    selectedSeasonId: null,
    selectedProjectId: null,
    isDarkMode: false,
    isSidebarCollapsed: false,
    isSidebarOverlay: false,
    isNotificationQueueOpen: false,
    notificationHistory: [],
    isWorkspaceModalOpen: false,
    activeTab: "worklogs",
    activePersonFilter: ["mentor-a"],
    tabSwitchDirection: "up",
    selectedProject: null,
    membersById: Object.fromEntries(bootstrap.members.map((member) => [member.id, member])),
    workTypesById: Object.fromEntries(bootstrap.workTypes.map((workType) => [workType.id, workType])),
    externalMembers: [],
    artifacts: [],
    availabilityBootstrap: bootstrap,
    allMembers: bootstrap.members,
    dataMessage: null,
    taskEditNotices: [],
    taskView: "queue",
    worklogsView: "reports",
  };
  const controller = { model } as never;
  return renderToStaticMarkup(React.createElement(AppWorkspaceShellView, { controller }));
}

describe("AppWorkspaceShellView retest actor caller chain", () => {
  beforeEach(() => mockRetestActors.splice(0));

  it("passes the signed-in linked second mentor through the shell and worklogs section despite the first-person filter", () => {
    renderForAccount("mentor-b@meco.test", "mentor", "mentor-b");

    expect(mockRetestActors).toEqual([{ canReview: true, localActorMemberId: "mentor-b" }]);
  });

  it("does not substitute the first mentor for an unlinked account", () => {
    renderForAccount("outsider@meco.test", "mentor", null);

    expect(mockRetestActors).toEqual([{ canReview: false, localActorMemberId: null }]);
  });
});
