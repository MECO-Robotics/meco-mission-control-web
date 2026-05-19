import {
  appendWorkspaceToastHistory,
  appendWorkspaceToast,
  dismissWorkspaceToast,
  removeWorkspaceToast,
  type WorkspaceToastNotice,
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

  it("retains active notices in history when only the live queue is pruned", () => {
    const notice = {
      id: "toast-1",
      title: "Edit Saved",
      message: "Your changes were saved.",
      tone: "success" as const,
    };
    const activeQueue = appendWorkspaceToast([], notice);
    const history = appendWorkspaceToastHistory([], notice);

    expect(removeWorkspaceToast(activeQueue, notice.id)).toEqual([]);
    expect(history).toEqual([notice]);
  });

  it("removes manually dismissed active notices from notification history", () => {
    const notice = {
      id: "toast-1",
      title: "Edit Saved",
      message: "Your changes were saved.",
      tone: "success" as const,
    };
    const activeQueue = appendWorkspaceToast([], notice);
    const history = appendWorkspaceToastHistory([], notice);

    expect(dismissWorkspaceToast(activeQueue, history, notice.id, "manual")).toEqual({
      queue: [],
      history: [],
    });
  });

  it("keeps auto-expired active notices in notification history", () => {
    const notice = {
      id: "toast-1",
      title: "Edit Saved",
      message: "Your changes were saved.",
      tone: "success" as const,
    };
    const activeQueue = appendWorkspaceToast([], notice);
    const history = appendWorkspaceToastHistory([], notice);

    expect(dismissWorkspaceToast(activeQueue, history, notice.id, "auto")).toEqual({
      queue: [],
      history: [notice],
    });
  });

  it("caps notification history to the latest notices", () => {
    const notices: WorkspaceToastNotice[] = Array.from({ length: 26 }, (_, index) => ({
      id: `toast-${index}`,
      title: "Edit Saved",
      message: `Notice ${index}`,
      tone: "success" as const,
    }));
    const history = notices.reduce<WorkspaceToastNotice[]>(
      (queue, notice) => appendWorkspaceToastHistory(queue, notice),
      [],
    );

    expect(history).toHaveLength(24);
    expect(history[0].id).toBe("toast-25");
    expect(history[23].id).toBe("toast-2");
  });
});
