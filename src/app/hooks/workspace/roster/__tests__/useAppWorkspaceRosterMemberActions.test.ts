/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { useAppWorkspaceRosterMemberActions } from "@/app/hooks/workspace/roster/useAppWorkspaceRosterMemberActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";

const mockCreateMemberRecord = jest.fn();

jest.mock("@/lib/auth/records/planning", () => ({
  createMemberRecord: (...args: unknown[]) => mockCreateMemberRecord(...args),
  deleteMemberRecord: jest.fn(),
  updateMemberRecord: jest.fn(),
}));

type RosterMemberActions = ReturnType<typeof useAppWorkspaceRosterMemberActions>;

function renderActions(model: AppWorkspaceModel) {
  const actionsRef: { current?: RosterMemberActions } = {};

  function Harness() {
    actionsRef.current = useAppWorkspaceRosterMemberActions(model);
    return null;
  }

  renderToStaticMarkup(React.createElement(Harness));

  const actions = actionsRef.current;
  if (!actions) {
    throw new Error("Roster member actions did not render.");
  }

  return actions;
}

function createSubmitEvent() {
  return {
    preventDefault: jest.fn(),
  } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useAppWorkspaceRosterMemberActions", () => {
  beforeEach(() => {
    mockCreateMemberRecord.mockReset();
  });

  it("creates a person in the newly selected season and reloads that season scope", async () => {
    mockCreateMemberRecord.mockResolvedValueOnce({
      id: "new-person",
      name: "New Person",
      role: "student",
      elevated: false,
      seasonId: "season-2033",
      activeSeasonIds: ["season-2033"],
    });

    const loadWorkspace = jest.fn().mockResolvedValue(undefined);
    const model = {
      selectedSeasonId: "season-2033",
      selectedProjectId: null,
      memberForm: {
        name: " New Person ",
        email: " new.person@example.test ",
        photoUrl: "",
        role: "student",
        elevated: false,
        disciplineId: null,
        plannedWeeklyAttendanceHours: 4,
        plannedAttendanceDays: ["monday"],
        plannedAttendanceNotes: " Immediately after season creation ",
      },
      setDataMessage: jest.fn(),
      setIsSavingMember: jest.fn(),
      setMemberForm: jest.fn(),
      setIsAddPersonOpen: jest.fn(),
      loadWorkspace,
      handleUnauthorized: jest.fn(),
    } as unknown as AppWorkspaceModel;

    const actions = renderActions(model);

    await actions.handleCreateMember(createSubmitEvent());

    expect(mockCreateMemberRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New Person",
        email: "new.person@example.test",
        seasonId: "season-2033",
        activeSeasonIds: ["season-2033"],
        plannedAttendanceNotes: "Immediately after season creation",
      }),
      model.handleUnauthorized,
    );
    expect(loadWorkspace).toHaveBeenCalledWith({
      projectId: null,
      seasonId: "season-2033",
    });
  });
});
