import "@/app/App.css";

import { AppWorkspaceShellView } from "@/app/shell/AppWorkspaceShellView";
import { useAppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";
import { AuthStatusScreen, SignInScreen } from "@/features/auth/AuthScreens";

export default function AppWorkspaceCoreImpl() {
  const c = useAppWorkspaceController();

  if (c.authBooting) {
    return (
      <AuthStatusScreen
        body="Checking the server-side auth configuration before the workspace opens."
        isDarkMode={c.isDarkMode}
        shellStyle={c.isDarkMode ? c.pageShellStyle : undefined}
        title="Loading sign-in rules for MECO Mission Control."
      />
    );
  }

  if (!c.authConfig) {
    return (
      <AuthStatusScreen
        body="The app could not confirm the server-side sign-in rules, so access is paused until the API is reachable again."
        isDarkMode={c.isDarkMode}
        message={c.authMessage}
        shellStyle={c.isDarkMode ? c.pageShellStyle : undefined}
        title="Couldn&apos;t load the authentication configuration."
      />
    );
  }

  if (c.enforcedAuthConfig && !c.sessionUser) {
    return (
      <SignInScreen
        authMessage={c.authMessage}
        clearAuthMessage={c.clearAuthMessage}
        hasEmailSignIn={c.isEmailAuthAvailable}
        hasGoogleSignIn={c.isGoogleAuthAvailable}
        googleButtonRef={c.googleButtonRef}
        isDarkMode={c.isDarkMode}
        isSigningIn={c.isSigningIn}
        onRequestEmailCode={c.handleRequestEmailCode}
        onVerifyEmailCode={c.handleVerifyEmailCode}
        onDevBypassSignIn={c.handleDevBypassSignIn}
        shellStyle={c.isDarkMode ? c.pageShellStyle : undefined}
        signInConfig={c.enforcedAuthConfig}
      />
    );
  }

  return <AppWorkspaceShellView controller={c} />;
}
