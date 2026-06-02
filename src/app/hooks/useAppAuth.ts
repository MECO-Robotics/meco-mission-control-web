import { useAppAuthGoogleButton } from "@/app/hooks/auth/useAppAuthGoogleButton";
import { useAppAuthSession } from "@/app/hooks/auth/useAppAuthSession";

interface UseAppAuthArgs {
  resetWorkspace: () => void;
  isDarkMode: boolean;
  onSessionExpired?: () => void;
}

export function useAppAuth({ isDarkMode, onSessionExpired, resetWorkspace }: UseAppAuthArgs) {
  const { setAuthMessage, ...auth } = useAppAuthSession({
    onSessionExpired,
    resetWorkspace,
  });
  const googleButtonRef = useAppAuthGoogleButton({
    authBooting: auth.authBooting,
    googleClientId: auth.googleClientId,
    handleGoogleCredential: auth.handleGoogleCredential,
    hostedDomain: auth.hostedDomain,
    isDarkMode,
    onAuthMessage: setAuthMessage,
    sessionUser: auth.sessionUser,
  });

  return {
    ...auth,
    googleButtonRef,
  };
}
