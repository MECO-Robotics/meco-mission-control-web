import { useEffect, useMemo, useState } from "react";

import { buildPageShellStyle } from "@/app/theme";

export function useAppShell() {
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isCompactSidebarExpanded, setIsCompactSidebarExpanded] = useState(false);
  const [isViewportNarrow, setIsViewportNarrow] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 960px)").matches
      : false,
  );
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("meco-theme") === "dark";
  });

  useEffect(() => {
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
      localStorage.setItem("meco-theme", next ? "dark" : "light");
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

