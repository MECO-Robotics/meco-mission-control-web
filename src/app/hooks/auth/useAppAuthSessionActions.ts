import {
  startTransition,
  useCallback,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from "react";

import { clearStoredSessionToken, storeSessionToken } from "@/lib/auth/core/sessionStorage";
import {
  exchangeGoogleCredential,
  requestDevBypassSignIn,
  requestEmailSignInCode,
  verifyEmailSignInCode,
} from "@/lib/auth/session";
import {
  type EmailCodeDeliveryResponse,
  type GoogleCredentialResponse,
  type SessionUser,
} from "@/lib/auth/types";
import { signOutFromGoogle } from "@/app/hooks/auth/useAppAuthGoogleIdentity";
import { toErrorMessage } from "@/lib/appUtils/common";

interface UseAppAuthSessionActionsArgs {
  resetWorkspaceRef: RefObject<() => void>;
  setAuthMessage: Dispatch<SetStateAction<string | null>>;
  setIsSigningIn: Dispatch<SetStateAction<boolean>>;
  setSessionUser: Dispatch<SetStateAction<SessionUser | null>>;
}

export interface UseAppAuthSessionActionsResult {
  clearAuthMessage: () => void;
  expireSession: (message: string) => void;
  handleDevBypassSignIn: () => Promise<void>;
  handleGoogleCredential: (response: GoogleCredentialResponse) => Promise<void>;
  handleRequestEmailCode: (email: string) => Promise<EmailCodeDeliveryResponse>;
  handleSignOut: () => void;
  handleVerifyEmailCode: (email: string, code: string) => Promise<void>;
  setAuthMessage: (message: string) => void;
}

function storeSignedInSession(
  session: { token: string; user: SessionUser },
  setSessionUser: Dispatch<SetStateAction<SessionUser | null>>,
) {
  storeSessionToken(session.token);
  startTransition(() => {
    setSessionUser(session.user);
  });
}

export function useAppAuthSessionActions({
  resetWorkspaceRef,
  setAuthMessage,
  setIsSigningIn,
  setSessionUser,
}: UseAppAuthSessionActionsArgs): UseAppAuthSessionActionsResult {
  const clearAuthMessage = useCallback(() => {
    setAuthMessage(null);
  }, [setAuthMessage]);

  const setAuthMessageNow = useCallback(
    (message: string) => {
      setAuthMessage(message);
    },
    [setAuthMessage],
  );

  const expireSession = useCallback(
    (message: string) => {
      clearStoredSessionToken();
      signOutFromGoogle();
      resetWorkspaceRef.current?.();
      startTransition(() => {
        setSessionUser(null);
      });
      setAuthMessage(message);
    },
    [resetWorkspaceRef, setAuthMessage, setSessionUser],
  );

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setAuthMessage("Google did not return a credential to verify.");
        return;
      }

      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        const session = await exchangeGoogleCredential(response.credential);
        storeSignedInSession(session, setSessionUser);
      } catch (error) {
        clearStoredSessionToken();
        setAuthMessage(toErrorMessage(error));
      } finally {
        setIsSigningIn(false);
      }
    },
    [setAuthMessage, setIsSigningIn, setSessionUser],
  );

  const handleRequestEmailCode = useCallback(
    async (email: string): Promise<EmailCodeDeliveryResponse> => {
      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        return await requestEmailSignInCode(email);
      } catch (error) {
        setAuthMessage(toErrorMessage(error));
        throw error;
      } finally {
        setIsSigningIn(false);
      }
    },
    [setAuthMessage, setIsSigningIn],
  );

  const handleVerifyEmailCode = useCallback(
    async (email: string, code: string) => {
      setIsSigningIn(true);
      setAuthMessage(null);

      try {
        const session = await verifyEmailSignInCode(email, code);
        storeSignedInSession(session, setSessionUser);
      } catch (error) {
        clearStoredSessionToken();
        setAuthMessage(toErrorMessage(error));
        throw error;
      } finally {
        setIsSigningIn(false);
      }
    },
    [setAuthMessage, setIsSigningIn, setSessionUser],
  );

  const handleDevBypassSignIn = useCallback(async () => {
    setIsSigningIn(true);
    setAuthMessage(null);

    try {
      const session = await requestDevBypassSignIn();
      storeSignedInSession(session, setSessionUser);
    } catch (error) {
      clearStoredSessionToken();
      setAuthMessage(toErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  }, [setAuthMessage, setIsSigningIn, setSessionUser]);

  const handleSignOut = useCallback(() => {
    clearStoredSessionToken();
    signOutFromGoogle();
    startTransition(() => {
      setSessionUser(null);
    });
    setAuthMessage(null);
    resetWorkspaceRef.current?.();
  }, [resetWorkspaceRef, setAuthMessage, setSessionUser]);

  return {
    clearAuthMessage,
    expireSession,
    handleDevBypassSignIn,
    handleGoogleCredential,
    handleRequestEmailCode,
    handleSignOut,
    handleVerifyEmailCode,
    setAuthMessage: setAuthMessageNow,
  };
}
