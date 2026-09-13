import type { WorkspaceToastTone } from "./workspaceToastTypes";
export type { WorkspaceToastTone } from "./workspaceToastTypes";

export type WorkspaceToastNotice = {
  id: string;
  message: string;
  title: string;
  tone: WorkspaceToastTone;
};

export type WorkspaceToastDismissReason = "auto" | "manual";

const WORKSPACE_TOAST_HISTORY_LIMIT = 24;

export function appendWorkspaceToast(
  queue: WorkspaceToastNotice[],
  notice: WorkspaceToastNotice,
): WorkspaceToastNotice[] {
  return [...queue, notice];
}

export function appendWorkspaceToastHistory(
  history: WorkspaceToastNotice[],
  notice: WorkspaceToastNotice,
): WorkspaceToastNotice[] {
  const withoutDuplicate = history.filter((item) => item.id !== notice.id);
  return [notice, ...withoutDuplicate].slice(0, WORKSPACE_TOAST_HISTORY_LIMIT);
}

export function removeWorkspaceToast(
  queue: WorkspaceToastNotice[],
  noticeId: string,
): WorkspaceToastNotice[] {
  return queue.filter((notice) => notice.id !== noticeId);
}

export function dismissWorkspaceToast(
  queue: WorkspaceToastNotice[],
  history: WorkspaceToastNotice[],
  noticeId: string,
  reason: WorkspaceToastDismissReason,
): {
  history: WorkspaceToastNotice[];
  queue: WorkspaceToastNotice[];
} {
  return {
    queue: removeWorkspaceToast(queue, noticeId),
    history: reason === "manual" ? removeWorkspaceToast(history, noticeId) : history,
  };
}
