import {
  buildEditCanceledNotice,
  buildMilestoneEditSuccessNotice,
  buildTaskEditSuccessNotice,
} from "../workspaceEditToastNotice";

describe("workspaceEditToastNotice", () => {
  it("builds the shared cancel notice", () => {
    expect(buildEditCanceledNotice()).toEqual({
      title: "Edit Canceled",
      message: "Unsaved changes were discarded.",
      tone: "info",
    });
  });

  it("builds the task edit success notice", () => {
    expect(buildTaskEditSuccessNotice()).toEqual({
      title: "Edit Saved",
      message: "Your changes were saved.",
      tone: "success",
    });
  });

  it("builds the milestone edit success notice", () => {
    expect(buildMilestoneEditSuccessNotice()).toEqual({
      title: "Edit Saved",
      message: "Your changes were saved.",
      tone: "success",
    });
  });
});
