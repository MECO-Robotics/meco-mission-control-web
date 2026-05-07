/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RosterView } from "@/features/workspace/views/RosterView";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MemberPayload } from "@/types/payloads";
import type { MemberRecord } from "@/types/recordsOrganization";

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

function renderRosterView(isAddPersonOpen = false) {
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
    members: [student, mentor, external],
  };
  const memberForm: MemberPayload = {
    name: "",
    email: "",
    role: "student",
    elevated: false,
    photoUrl: "",
  };

  return renderToStaticMarkup(
    React.createElement(RosterView, {
      allMembers: [student, mentor, external],
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
      students: [student],
      rosterMentors: [mentor],
      externalMembers: [external],
    }),
  );
}

describe("RosterView", () => {
  it("renders external access as a third roster column", () => {
    const html = renderRosterView();

    expect(html).toContain("Students");
    expect(html).toContain("Mentors");
    expect(html).toContain("External access");
    expect(html).toContain("Sponsor Viewer");
    expect(html).toContain("viewer@sponsor.example");
    expect(html).toContain("https://cdn.example.test/people/student-one.png");
  });

  it("renders a profile photo upload control in the add-person modal", () => {
    const html = renderRosterView(true);

    expect(html).toContain("Profile photo");
    expect(html).toContain('type="file"');
  });
});
