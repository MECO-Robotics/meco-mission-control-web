import { lazy, Suspense } from "react";

import "@/app/AuthApp.css";
import { useAppAuth } from "@/app/hooks/useAppAuth";
import { useAppShell } from "@/app/hooks/useAppShell";
import { AuthStatusScreen, SignInScreen } from "@/features/auth/AuthScreens";

const WorkspaceApp = lazy(() => import("./AppWorkspaceCoreImpl"));

export default function App() {
  const { isDarkMode, pageShellStyle, toggleDarkMode } = useAppShell();
  const auth = useAppAuth({
    isDarkMode,
    resetWorkspace: () => {},
  });

  if (auth.authBooting) {
    return (
      <AuthStatusScreen
        body="Checking the server-side auth configuration before the workspace opens."
        isDarkMode={isDarkMode}
        shellStyle={isDarkMode ? pageShellStyle : undefined}
        title="Loading sign-in rules for MECO Mission Control."
      />
    );
  }

  if (!auth.authConfig) {
    return (
      <AuthStatusScreen
        body="The app could not confirm the server-side sign-in rules, so access is paused until the API is reachable again."
        isDarkMode={isDarkMode}
        message={auth.authMessage}
        shellStyle={isDarkMode ? pageShellStyle : undefined}
        title="Couldn't load the authentication configuration."
      />
    );
  }

  if (auth.enforcedAuthConfig && !auth.sessionUser) {
    return (
      <SignInScreen
        authMessage={auth.authMessage}
        clearAuthMessage={auth.clearAuthMessage}
        googleButtonRef={auth.googleButtonRef}
        hasEmailSignIn={auth.isEmailAuthAvailable}
        hasGoogleSignIn={auth.isGoogleAuthAvailable}
        isDarkMode={isDarkMode}
        isSigningIn={auth.isSigningIn}
        onRequestEmailCode={auth.handleRequestEmailCode}
        onToggleDarkMode={toggleDarkMode}
        onVerifyEmailCode={auth.handleVerifyEmailCode}
        onDevBypassSignIn={auth.handleDevBypassSignIn}
        shellStyle={isDarkMode ? pageShellStyle : undefined}
        signInConfig={auth.enforcedAuthConfig}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <AuthStatusScreen
          body="Preparing the workspace interface."
          isDarkMode={isDarkMode}
          shellStyle={isDarkMode ? pageShellStyle : undefined}
          title="Opening MECO Mission Control."
        />
      }
    >
      <WorkspaceApp />
    </Suspense>
  );
}
