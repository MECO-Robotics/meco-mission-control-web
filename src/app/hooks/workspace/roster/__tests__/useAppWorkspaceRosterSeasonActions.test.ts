/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { useAppWorkspaceRosterSeasonActions } from "@/app/hooks/workspace/roster/useAppWorkspaceRosterSeasonActions";
import type { AppWorkspaceModel } from "@/app/hooks/useAppWorkspaceModel";

const mockCreateSeasonRecord = jest.fn();

jest.mock("@/lib/auth/records/planning", () => ({
  createSeasonRecord: (...args: unknown[]) => mockCreateSeasonRecord(...args),
}));

type RosterSeasonActions = ReturnType<typeof useAppWorkspaceRosterSeasonActions>;

function renderActions(model: AppWorkspaceModel) {
  const actionsRef: { current?: RosterSeasonActions } = {};

  function Harness() {
    actionsRef.current = useAppWorkspaceRosterSeasonActions(model);
    return null;
  }

  renderToStaticMarkup(React.createElement(Harness));

  const actions = actionsRef.current;
  if (!actions) {
    throw new Error("Roster season actions did not render.");
  }

  return actions;
}

function createSubmitEvent() {
  return {
    preventDefault: jest.fn(),
  } as unknown as React.FormEvent<HTMLFormElement>;
}

describe("useAppWorkspaceRosterSeasonActions", () => {
  it("reloads the workspace using the newly created season scope", async () => {
    mockCreateSeasonRecord.mockResolvedValueOnce({
      id: "season-2031",
      name: "2031 Season",
      type: "season",
      startDate: "2031-01-01",
      endDate: "2031-12-31",
    });

    const loadWorkspace = jest.fn().mockResolvedValue(undefined);
    const model = {
      seasonNameDraft: "2031 Season",
      isSavingSeason: false,
      setDataMessage: jest.fn(),
      setIsSavingSeason: jest.fn(),
      setIsAddSeasonPopupOpen: jest.fn(),
      setSeasonNameDraft: jest.fn(),
      setSelectedSeasonId: jest.fn(),
      setSelectedProjectId: jest.fn(),
      loadWorkspace,
      handleUnauthorized: jest.fn(),
    } as unknown as AppWorkspaceModel;

    const actions = renderActions(model);

    await actions.handleCreateSeasonSubmit(createSubmitEvent());

    expect(loadWorkspace).toHaveBeenCalledWith({
      projectId: null,
      seasonId: "season-2031",
    });
  });
});
