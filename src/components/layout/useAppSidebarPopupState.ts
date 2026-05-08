import { useEffect, useRef, useState } from "react";

import type { NavigationSection } from "@/lib/workspaceNavigation";

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
  activeSection: NavigationSection;
  isCollapsed: boolean;
}

export function useAppSidebarPopupState({ activeSection, isCollapsed }: UseAppSidebarPopupStateArgs) {
  const sidebarShellRef = useRef<HTMLDivElement | null>(null);
  const compactPopupRef = useRef<HTMLDivElement | null>(null);
  const projectPopupRef = useRef<HTMLDivElement | null>(null);
  const projectTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [expandedSection, setExpandedSection] = useState<NavigationSection>(activeSection);
  const [compactPopupSection, setCompactPopupSection] = useState<NavigationSection | null>(null);
  const [compactPopupTop, setCompactPopupTop] = useState(0);
  const [projectPopupTop, setProjectPopupTop] = useState(0);
  const [isProjectPopupOpen, setIsProjectPopupOpen] = useState(false);

  useEffect(() => {
    setExpandedSection(activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (!isCollapsed) {
      setCompactPopupSection(null);
    }
  }, [isCollapsed]);

  useEffect(() => {
    if ((!isCollapsed || compactPopupSection === null) && !isProjectPopupOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target;
      if (!(targetNode instanceof Node)) {
        return;
      }

      if (compactPopupRef.current?.contains(targetNode)) {
        return;
      }

      if (projectPopupRef.current?.contains(targetNode)) {
        return;
      }

      if (projectTriggerRef.current?.contains(targetNode)) {
        return;
      }

      if (compactPopupSection !== null) {
        setCompactPopupSection(null);
      }

      if (isProjectPopupOpen) {
        setIsProjectPopupOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCompactPopupSection(null);
        setIsProjectPopupOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [compactPopupSection, isCollapsed, isProjectPopupOpen]);

  useEffect(() => {
    if (!isCollapsed || compactPopupSection === null) {
      return;
    }

    const clampedTop = clampPopupTop(
      sidebarShellRef.current,
      compactPopupRef.current,
      compactPopupTop,
    );

    if (Math.abs(clampedTop - compactPopupTop) > 0.5) {
      setCompactPopupTop(clampedTop);
    }
  }, [compactPopupSection, compactPopupTop, isCollapsed]);

  useEffect(() => {
    if (!isProjectPopupOpen) {
      return;
    }

    const clampedTop = clampPopupTop(sidebarShellRef.current, projectPopupRef.current, projectPopupTop);
    if (Math.abs(clampedTop - projectPopupTop) > 0.5) {
      setProjectPopupTop(clampedTop);
    }
  }, [isProjectPopupOpen, projectPopupTop]);

  return {
    compactPopupRef,
    compactPopupSection,
    compactPopupTop,
    expandedSection,
    isProjectPopupOpen,
    projectPopupRef,
    projectPopupTop,
    projectTriggerRef,
    setCompactPopupSection,
    setCompactPopupTop,
    setExpandedSection,
    setIsProjectPopupOpen,
    setProjectPopupTop,
    sidebarShellRef,
  };
}