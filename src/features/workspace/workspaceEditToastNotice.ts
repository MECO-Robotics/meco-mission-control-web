import type { WorkspaceToastTone } from "./WorkspaceStatusToast";

export type WorkspaceEditToastNotice = {
  message: string;
  title: string;
  tone: WorkspaceToastTone;
};

const EDIT_CANCELED_NOTICE: WorkspaceEditToastNotice = {
  title: "Edit Canceled",
  message: "Unsaved changes were discarded.",
  tone: "info",
};

const EDIT_SAVED_NOTICE: WorkspaceEditToastNotice = {
  title: "Edit Saved",
  message: "Your changes were saved.",
  tone: "success",
};

export function buildEditCanceledNotice(): WorkspaceEditToastNotice {
  return EDIT_CANCELED_NOTICE;
}

export function buildTaskEditSuccessNotice(): WorkspaceEditToastNotice {
  return EDIT_SAVED_NOTICE;
}

export function buildMilestoneEditSuccessNotice(): WorkspaceEditToastNotice {
  return EDIT_SAVED_NOTICE;
}
