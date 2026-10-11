import { lazy, Suspense } from "react";

import "@/app/AuthApp.css";
import { buildPageShellStyle } from "@/app/theme";
import { readStoredThemePreference } from "@/app/hooks/useAppShell";
import { AuthStatusScreen } from "@/features/auth/AuthScreens";

const WorkspaceApp = lazy(() => import("./AppWorkspaceCoreImpl"));

export default function App() {
  const isDarkMode = readStoredThemePreference();

  return (
    <Suspense
      fallback={
        <AuthStatusScreen
          body="Preparing the sign-in and workspace interface."
          isDarkMode={isDarkMode}
          shellStyle={buildPageShellStyle(isDarkMode ? "dark" : "light")}
          title="Opening MECO Mission Control."
        />
      }
    >
      <WorkspaceApp />
    </Suspense>
  );
}
