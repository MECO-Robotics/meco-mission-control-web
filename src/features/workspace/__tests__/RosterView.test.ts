/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RosterView } from "@/features/workspace/views/RosterView";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MemberPayload } from "@/types/payloads";
import type { MemberRecord } from "@/types/recordsOrganization";

const mockSearchText = { value: null as string | null };

jest.mock("@/features/workspace/shared/navigation/WorkspaceViewMemory", () => ({
  useRememberedViewState: (key: string, initial: unknown) => [
    key === "people.searchText" ? mockSearchText.value ?? initial : initial,
    jest.fn(),
  ],
}));

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const student: MemberRecord = {
  id: "student-1",
  name: "Student One",
  email: "student@mecorobotics.org",
  role: "student",
  elevated: false,
  seasonId: "season-1",
  activeSeasonIds: ["season-1"],
  photoUrl: "https://cdn.example.test/people/student-one.png",
};

const mentor: MemberRecord = {
  id: "mentor-1",
  name: "Mentor One",
  email: "mentor@mecorobotics.org",
  role: "mentor",
  elevated: false,
  seasonId: "season-1",
  activeSeasonIds: ["season-1"],
  photoUrl: "",
};

const external: MemberRecord = {
  id: "external-1",
  name: "Sponsor Viewer",
  email: "viewer@sponsor.example",
  role: "external",
  elevated: false,
  seasonId: "season-1",
  activeSeasonIds: ["season-1"],
  photoUrl: "",
};

function renderRosterView(
  isAddPersonOpen = false,
  externalMembers: MemberRecord[] = [external],
  rosterMembers: { students?: MemberRecord[]; mentors?: MemberRecord[] } = {},
) {
  const students = rosterMembers.students ?? [student];
  const rosterMentors = rosterMembers.mentors ?? [mentor];
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
    members: [...students, ...rosterMentors, ...externalMembers],
  };
  const memberForm: MemberPayload = {
    name: "",
    email: "",
    role: "student",
    elevated: false,
    photoUrl: "",
    plannedWeeklyAttendanceHours: 0,
    plannedAttendanceDays: [],
    plannedAttendanceNotes: "",
  };

  return renderToStaticMarkup(
    React.createElement(RosterView, {
      allMembers: [...students, ...rosterMentors, ...externalMembers],
      onCreateTaskForMember: jest.fn(),
      bootstrap,
      selectedProject: null,
      selectedMemberId: null,
      selectedSeasonId: "season-1",
      selectMember: jest.fn(),
      isAddPersonOpen,
      setIsAddPersonOpen: jest.fn(),
      isEditPersonOpen: false,
      setIsEditPersonOpen: jest.fn(),
      memberForm,
      setMemberForm: jest.fn(),
      memberEditDraft: null,
      setMemberEditDraft: jest.fn(),
      handleCreateMember: jest.fn(),
      handleReactivateMemberForSeason: jest.fn().mockResolvedValue(undefined),
      handleUpdateMember: jest.fn(),
      handleDeleteMember: jest.fn(),
      requestMemberPhotoUpload: jest.fn(async () => "https://cdn.example.test/uploaded.png"),
      isSavingMember: false,
      isDeletingMember: false,
      students,
      rosterMentors,
      externalMembers,
    }),
  );
}

describe("RosterView", () => {
  it("renders roster sections in student-first order", () => {
    const html = renderRosterView();

    expect(html).toContain("Students");
    expect(html).toContain("Mentors");
    expect(html).not.toContain("Find available teammates, balance assignments, and manage membership.");
    expect(html).toContain('aria-label="People filters"');
    expect(html).toContain('title="Filter people"');
    expect(html).toContain("people-search-filter-menu");
    expect(html.indexOf("Students")).toBeLessThan(html.indexOf("Mentors"));
    expect(html.indexOf("Mentors")).toBeLessThan(html.indexOf("External access"));
    expect(html).toContain("External access");
    expect(html).toContain("Sponsor Viewer");
    expect(html).not.toContain("viewer@sponsor.example");
    expect(html).not.toContain("No attendance recorded today");
    expect(html).not.toContain("people here today</div>");
    expect(html).toContain("0/1 here");
    expect(html).toContain('aria-label="Attendance this week"');
    expect(html).toContain("this week");
    expect(html).not.toContain("planned / week");
    expect(html).not.toContain('aria-label="Task breakdown"');
    expect(html).not.toContain("Planned:");
    expect(html).toContain("https://cdn.example.test/people/student-one.png");
    expect(html).toContain('aria-label="Assign work to Student"');
    expect(html).toContain('title="Assign work to Student"');
    expect(html).toMatch(/people-member-activity[\s\S]*people-workload-details[\s\S]*Workload and recent activity[\s\S]*people-assign-work-button/);
    expect(html).toContain("<svg");
    expect(html).not.toContain("Assign work to Student</button>");
    expect(html).toContain('aria-label="Add person"');
    expect(html.match(/topbar-add-menu-trigger/g)).toHaveLength(1);
    expect(html).not.toContain("roster-section-add");
  });

  it("omits the external access section when it has no members", () => {
    const html = renderRosterView(false, []);

    expect(html).toContain("Students");
    expect(html).toContain("Mentors");
    expect(html).not.toContain("External access");
  });

  it("shows a message when search filters out every roster member", () => {
    mockSearchText.value = "no matching person";
    let html: string;
    try {
      html = renderRosterView();
    } finally {
      mockSearchText.value = null;
    }

    expect(html).toContain('role="status"');
    expect(html).toContain("No people match the current search or filters.");
    expect(html).not.toContain("Student One");
    expect(html).not.toContain("Mentor One");
  });

  it("shows onboarding guidance when the roster has no members", () => {
    const html = renderRosterView(false, [], { students: [], mentors: [] });

    expect(html).toContain('role="status"');
    expect(html).toContain("No people in this roster yet.");
    expect(html).toContain("Add a student, mentor, or external member to get started.");
  });

  it("renders a profile photo upload control in the add-person modal", () => {
    const html = renderRosterView(true);

    expect(html).toContain("Profile photo");
    expect(html).toContain('type="file"');
    expect(html).toContain("Planned weekly attendance");
    expect(html).toContain("Planned days");
  });
});
