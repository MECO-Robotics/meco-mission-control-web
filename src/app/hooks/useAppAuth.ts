import { useAppAuthGoogleButton } from "@/app/hooks/useAppAuthGoogleButton";
import { useAppAuthSession } from "@/app/hooks/useAppAuthSession";

interface UseAppAuthArgs {
  resetWorkspace: () => void;
  isDarkMode: boolean;
}

export function useAppAuth({ isDarkMode, resetWorkspace }: UseAppAuthArgs) {
  const { setAuthMessage, ...auth } = useAppAuthSession({ resetWorkspace });
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
