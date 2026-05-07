import "@/app/App.css";

import { AppWorkspaceShellView } from "@/app/shell/AppWorkspaceShellView";
import { useAppWorkspaceController } from "@/app/hooks/useAppWorkspaceController";
import { AuthStatusScreen, SignInScreen } from "@/features/auth/AuthScreens";

export default function AppWorkspaceCoreImpl() {
  const c = useAppWorkspaceController();
  const auth = c.auth;

  if (auth.authBooting) {
    return (
      <AuthStatusScreen
        body="Checking the server-side auth configuration before the workspace opens."
        isDarkMode={auth.isDarkMode}
        shellStyle={auth.isDarkMode ? auth.pageShellStyle : undefined}
        title="Loading sign-in rules for MECO Mission Control."
      />
    );
  }

  if (!auth.authConfig) {
    return (
      <AuthStatusScreen
        body="The app could not confirm the server-side sign-in rules, so access is paused until the API is reachable again."
        isDarkMode={auth.isDarkMode}
        message={auth.authMessage}
        shellStyle={auth.isDarkMode ? auth.pageShellStyle : undefined}
        title="Couldn&apos;t load the authentication configuration."
      />
    );
  }

  if (auth.enforcedAuthConfig && !auth.sessionUser) {
    return (
      <SignInScreen
        authMessage={auth.authMessage}
        clearAuthMessage={auth.clearAuthMessage}
        hasEmailSignIn={auth.isEmailAuthAvailable}
        hasGoogleSignIn={auth.isGoogleAuthAvailable}
        googleButtonRef={auth.googleButtonRef}
        isDarkMode={auth.isDarkMode}
        isSigningIn={auth.isSigningIn}
        onRequestEmailCode={auth.handleRequestEmailCode}
        onToggleDarkMode={auth.toggleDarkMode}
        onVerifyEmailCode={auth.handleVerifyEmailCode}
        onDevBypassSignIn={auth.handleDevBypassSignIn}
        shellStyle={auth.isDarkMode ? auth.pageShellStyle : undefined}
        signInConfig={auth.enforcedAuthConfig}
      />
    );
  }

  return <AppWorkspaceShellView controller={c.shell} />;
}
