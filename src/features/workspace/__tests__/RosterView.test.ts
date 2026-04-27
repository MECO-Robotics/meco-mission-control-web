/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RosterView } from "@/features/workspace/views/RosterView";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import type { BootstrapPayload, MemberPayload, MemberRecord } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const student: MemberRecord = {
  id: "student-1",
  name: "Student One",
  email: "student@mecorobotics.org",
  role: "student",
  elevated: false,
  seasonId: "season-1",
  activeSeasonIds: ["season-1"],
};

const mentor: MemberRecord = {
  id: "mentor-1",
  name: "Mentor One",
  email: "mentor@mecorobotics.org",
  role: "mentor",
  elevated: false,
  seasonId: "season-1",
  activeSeasonIds: ["season-1"],
};

const external: MemberRecord = {
  id: "external-1",
  name: "Sponsor Viewer",
  email: "viewer@sponsor.example",
  role: "external",
  elevated: false,
  seasonId: "season-1",
  activeSeasonIds: ["season-1"],
};

function renderRosterView() {
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
    members: [student, mentor, external],
  };
  const memberForm: MemberPayload = {
    name: "",
    email: "",
    role: "student",
    elevated: false,
  };

  return renderToStaticMarkup(
    React.createElement(RosterView, {
      allMembers: [student, mentor, external],
      bootstrap,
      selectedMemberId: null,
      selectedSeasonId: "season-1",
      selectMember: jest.fn(),
      isAddPersonOpen: false,
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
  });
});
