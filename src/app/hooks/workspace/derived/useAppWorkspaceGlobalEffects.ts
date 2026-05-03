import { useEffect, type Dispatch, type SetStateAction } from "react";

const BROWSER_ZOOM_SHORTCUT_KEYS = new Set(["+", "=", "-", "0", "add", "subtract"]);

function isBrowserZoomShortcut(milestone: KeyboardEvent) {
  if (!(milestone.ctrlKey || milestone.metaKey)) {
    return false;
  }

  const normalizedKey = milestone.key.toLowerCase();
  return BROWSER_ZOOM_SHORTCUT_KEYS.has(normalizedKey);
}

interface UseAppWorkspaceGlobalEffectsOptions {
  isDarkMode: boolean;
  pageShellStyle: Record<string, string | number | undefined>;
  taskEditNotice: string | null;
  setTaskEditNotice: Dispatch<SetStateAction<string | null>>;
  isSidebarOverlay: boolean;
  toggleSidebar: () => void;
  isAddSeasonPopupOpen: boolean;
  setIsAddSeasonPopupOpen: Dispatch<SetStateAction<boolean>>;
  robotProjectModalMode: "create" | "edit" | null;
  setRobotProjectModalMode: Dispatch<SetStateAction<"create" | "edit" | null>>;
}

export function useAppWorkspaceGlobalEffects({
  isDarkMode,
  pageShellStyle,
  taskEditNotice,
  setTaskEditNotice,
  isSidebarOverlay,
  toggleSidebar,
  isAddSeasonPopupOpen,
  setIsAddSeasonPopupOpen,
  robotProjectModalMode,
  setRobotProjectModalMode,
}: UseAppWorkspaceGlobalEffectsOptions) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const rootStyle = document.documentElement.style;
    const themeVariables = Object.entries(pageShellStyle).filter(
      ([name, value]) => name.startsWith("--") && typeof value === "string",
    ) as Array<[string, string]>;

    themeVariables.forEach(([name, value]) => {
      rootStyle.setProperty(name, value);
    });
    document.documentElement.classList.toggle("dark-mode", isDarkMode);

    return () => {
      themeVariables.forEach(([name]) => {
        rootStyle.removeProperty(name);
      });
      document.documentElement.classList.remove("dark-mode");
    };
  }, [isDarkMode, pageShellStyle]);

  useEffect(() => {
    const handleWheel = (milestone: WheelEvent) => {
      if (!milestone.ctrlKey && !milestone.metaKey) {
        return;
      }

      milestone.preventDefault();
    };

    const handleGestureStart = (event: Event) => {
      event.preventDefault();
    };

    const handleKeyDown = (milestone: KeyboardEvent) => {
      if (!isBrowserZoomShortcut(milestone)) {
        return;
      }

      milestone.preventDefault();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("gesturestart", handleGestureStart, { passive: false } as AddEventListenerOptions);
    window.addEventListener("gesturechange", handleGestureStart, { passive: false } as AddEventListenerOptions);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("gesturestart", handleGestureStart);
      window.removeEventListener("gesturechange", handleGestureStart);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!taskEditNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTaskEditNotice(null);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [setTaskEditNotice, taskEditNotice]);

  useEffect(() => {
    if (!isSidebarOverlay) {
      return;
    }

    const onKeyDown = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isSidebarOverlay, toggleSidebar]);

  useEffect(() => {
    if (!isAddSeasonPopupOpen) {
      return;
    }

    const onKeyDown = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        setIsAddSeasonPopupOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isAddSeasonPopupOpen, setIsAddSeasonPopupOpen]);

  useEffect(() => {
    if (!robotProjectModalMode) {
      return;
    }

    const onKeyDown = (milestone: KeyboardEvent) => {
      if (milestone.key === "Escape") {
        setRobotProjectModalMode(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [robotProjectModalMode, setRobotProjectModalMode]);
}

