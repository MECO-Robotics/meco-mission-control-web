import { useSyncExternalStore } from "react";

function currentTarget(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const focusedDialog = document.activeElement?.closest<HTMLDialogElement>("dialog:modal");
  const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog:modal");
  return focusedDialog ?? dialogs.item(dialogs.length - 1) ?? document.body;
}

function subscribe(onChange: () => void) {
  document.addEventListener("workspace-modal-change", onChange);
  return () => document.removeEventListener("workspace-modal-change", onChange);
}

/** Toasts and tutorial controls must stay interactive in the active modal layer. */
export function useModalPortalTarget() {
  return useSyncExternalStore(subscribe, currentTarget, () => null);
}
