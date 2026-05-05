export type WorkspaceToastTone = "success" | "warning" | "error" | "info" | "neutral";

export type WorkspaceToastNotice = {
  id: string;
  message: string;
  title: string;
  tone: WorkspaceToastTone;
};

export function appendWorkspaceToast(
  queue: WorkspaceToastNotice[],
  notice: WorkspaceToastNotice,
): WorkspaceToastNotice[] {
  return [...queue, notice];
}

export function removeWorkspaceToast(
  queue: WorkspaceToastNotice[],
  noticeId: string,
): WorkspaceToastNotice[] {
  return queue.filter((notice) => notice.id !== noticeId);
}
