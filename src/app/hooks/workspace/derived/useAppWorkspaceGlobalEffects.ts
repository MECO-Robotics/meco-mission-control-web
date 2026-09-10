import { useEffect, type CSSProperties } from "react";

interface UseAppWorkspaceGlobalEffectsOptions {
  isDarkMode: boolean;
  pageShellStyle: CSSProperties;
  isSidebarOverlay: boolean;
  toggleSidebar: () => void;
  setDataMessage: (message: string | null) => void;
}

export function useAppWorkspaceGlobalEffects({
  isDarkMode,
  pageShellStyle,
  isSidebarOverlay,
  toggleSidebar,
  setDataMessage,
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
    if (typeof window === "undefined") {
      return;
    }

    const handleGlobalError = () => {
      setDataMessage("Something went wrong.");
    };

    const handleUnhandledRejection = () => {
      setDataMessage("Something went wrong.");
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [setDataMessage]);

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

}
