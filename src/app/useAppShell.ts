import { useEffect, useMemo, useState } from "react";

import { buildPageShellStyle } from "@/app/theme";

export function readStoredThemePreference() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem("meco-theme") === "dark";
  } catch {
    return false;
  }
}

export function writeStoredThemePreference(isDarkMode: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem("meco-theme", isDarkMode ? "dark" : "light");
  } catch {
    // Storage can be blocked by browser settings; keep in-memory theme state usable.
  }
}

export function useAppShell() {
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isCompactSidebarExpanded, setIsCompactSidebarExpanded] = useState(false);
  const [isViewportNarrow, setIsViewportNarrow] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 960px)").matches
      : false,
  );
  const [isDarkMode, setIsDarkMode] = useState(readStoredThemePreference);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 960px)");

    const updateViewportState = () => {
      setIsViewportNarrow(mediaQuery.matches);
    };

    updateViewportState();
    mediaQuery.addEventListener("change", updateViewportState);

    return () => {
      mediaQuery.removeEventListener("change", updateViewportState);
    };
  }, []);

  useEffect(() => {
    if (!isViewportNarrow) {
      setIsCompactSidebarExpanded(false);
    }
  }, [isViewportNarrow]);

  const isSidebarCollapsed = isViewportNarrow
    ? !isCompactSidebarExpanded
    : isDesktopSidebarCollapsed;
  const isSidebarOverlay = isViewportNarrow && isCompactSidebarExpanded;

  const toggleSidebar = () => {
    if (isViewportNarrow) {
      setIsCompactSidebarExpanded((current) => !current);
      return;
    }

    setIsDesktopSidebarCollapsed((current) => !current);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((current) => {
      const next = !current;
      writeStoredThemePreference(next);
      return next;
    });
  };

  const pageShellStyle = useMemo(() => buildPageShellStyle(isDarkMode ? "dark" : "light"), [isDarkMode]);

  return {
    isDarkMode,
    isSidebarCollapsed,
    isSidebarOverlay,
    pageShellStyle,
    toggleDarkMode,
    toggleSidebar,
  };
}
