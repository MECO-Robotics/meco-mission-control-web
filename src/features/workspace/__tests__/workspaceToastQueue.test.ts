import {
  appendWorkspaceToast,
  removeWorkspaceToast,
} from "../workspaceToastQueue";

describe("workspaceToastQueue", () => {
  it("appends notices without replacing earlier ones", () => {
    const initial = [
      { id: "toast-1", title: "Edit Saved", message: "Your changes were saved.", tone: "success" as const },
    ];

    const next = appendWorkspaceToast(initial, {
      id: "toast-2",
      title: "Edit Saved",
      message: "Your changes were saved.",
      tone: "success" as const,
    });

    expect(next).toHaveLength(2);
    expect(next[0].id).toBe("toast-1");
    expect(next[1].id).toBe("toast-2");
  });

  it("removes one queued notice by id", () => {
    const initial = [
      { id: "toast-1", title: "Edit Saved", message: "Your changes were saved.", tone: "success" as const },
      { id: "toast-2", title: "Edit Canceled", message: "Unsaved changes were discarded.", tone: "info" as const },
    ];

    expect(removeWorkspaceToast(initial, "toast-1")).toEqual([
      { id: "toast-2", title: "Edit Canceled", message: "Unsaved changes were discarded.", tone: "info" },
    ]);
  });
});
