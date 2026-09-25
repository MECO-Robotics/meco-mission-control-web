import { useEffect, useRef, useState } from "react";

import type { AppSidebarScopePanel } from "./AppSidebarScopeMenuPopup";

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

export function useAppSidebarPopupState() {
  const sidebarShellRef = useRef<HTMLDivElement | null>(null);
  const projectPopupRef = useRef<HTMLDivElement | null>(null);
  const projectTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [popup, setPopup] = useState({
    activePanel: null as AppSidebarScopePanel | null,
    isOpen: false,
    top: 0,
  });

  const scopePanels = [
    { id: "project", label: "Projects", icon: "LayoutGrid" },
    { id: "season", label: "Seasons", icon: "CalendarDays" }
  ];

  useEffect(() => {
    if (!popup.isOpen) {
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

      setPopup((current) => ({ ...current, isOpen: false, activePanel: null }));
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopup((current) => ({ ...current, isOpen: false, activePanel: null }));
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [popup.isOpen]);

  useEffect(() => {
    if (!popup.isOpen) {
      return;
    }

    const clampedTop = clampPopupTop(sidebarShellRef.current, projectPopupRef.current, popup.top);
    if (Math.abs(clampedTop - popup.top) > 0.5) {
      setPopup((current) => ({ ...current, top: clampedTop }));
    }
  }, [popup.activePanel, popup.isOpen, popup.top]);

  return {
    popup,
    projectPopupRef,
    projectTriggerRef,
    sidebarShellRef,
    closePopup: () => setPopup((current) => ({ ...current, isOpen: false, activePanel: null })),
    togglePopup: (top: number) => setPopup((current) => (
      current.isOpen
        ? { ...current, isOpen: false, activePanel: null }
        : { activePanel: null, isOpen: true, top }
    )),
    setActivePanel: (activePanel: AppSidebarScopePanel | null) => setPopup((current) => ({ ...current, activePanel })),
    scopePanels,
  };
}
