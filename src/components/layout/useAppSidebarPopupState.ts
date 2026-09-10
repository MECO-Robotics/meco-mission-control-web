import { useEffect, useRef, useState } from "react";

const POPUP_VERTICAL_MARGIN = 8;

function clampPopupTop(
  shellElement: HTMLDivElement | null,
  popupElement: HTMLDivElement | null,
  preferredTop: number,
) {
  if (!shellElement || !popupElement) {
    return preferredTop;
  }

  const shellHeight = shellElement.getBoundingClientRect().height;
  const popupHeight = popupElement.getBoundingClientRect().height;
  const minimumTop = POPUP_VERTICAL_MARGIN;
  const maximumTop = Math.max(minimumTop, shellHeight - popupHeight - POPUP_VERTICAL_MARGIN);

  return Math.min(Math.max(preferredTop, minimumTop), maximumTop);
}

interface UseAppSidebarPopupStateArgs {
  projectPopupLayoutKey?: unknown;
}

export function useAppSidebarPopupState({
  projectPopupLayoutKey,
}: UseAppSidebarPopupStateArgs) {
  const sidebarShellRef = useRef<HTMLDivElement | null>(null);
  const projectPopupRef = useRef<HTMLDivElement | null>(null);
  const projectTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [projectPopupTop, setProjectPopupTop] = useState(0);
  const [isProjectPopupOpen, setIsProjectPopupOpen] = useState(false);

  useEffect(() => {
    if (!isProjectPopupOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target;
      if (!(targetNode instanceof Node)) {
        return;
      }

      if (projectPopupRef.current?.contains(targetNode)) {
        return;
      }

      if (projectTriggerRef.current?.contains(targetNode)) {
        return;
      }

      if (isProjectPopupOpen) {
        setIsProjectPopupOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProjectPopupOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProjectPopupOpen]);

  useEffect(() => {
    if (!isProjectPopupOpen) {
      return;
    }

    const clampedTop = clampPopupTop(sidebarShellRef.current, projectPopupRef.current, projectPopupTop);
    if (Math.abs(clampedTop - projectPopupTop) > 0.5) {
      setProjectPopupTop(clampedTop);
    }
  }, [isProjectPopupOpen, projectPopupLayoutKey, projectPopupTop]);

  return {
    isProjectPopupOpen,
    projectPopupRef,
    projectPopupTop,
    projectTriggerRef,
    setIsProjectPopupOpen,
    setProjectPopupTop,
    sidebarShellRef,
  };
}
